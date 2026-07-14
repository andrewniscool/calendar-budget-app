import { withTransaction } from '../db.js';

export function createUserRepository(db) {
  async function enqueueMail(client, user, type, token) {
    await client.query(
      `INSERT INTO mail_outbox (type, recipient, payload)
       VALUES ($1, $2, $3::jsonb)`,
      [type, user.email, JSON.stringify({ token })]
    );
  }

  const userSelect = `
    SELECT id, username, email, password, email_verified_at,
           failed_login_attempts, locked_until, auth_version
    FROM users
  `;

  return {
    async findByUsername(username) {
      const result = await db.query(`${userSelect} WHERE username = $1`, [username]);
      return result.rows[0];
    },

    async findByEmail(email) {
      const result = await db.query(`${userSelect} WHERE LOWER(email) = LOWER($1)`, [email]);
      return result.rows[0];
    },

    async findAuthUser(id) {
      const result = await db.query(`${userSelect} WHERE id = $1`, [id]);
      return result.rows[0];
    },

    async createWithVerification({ username, email, hashedPassword, tokenHash, token, expiresAt }) {
      return withTransaction(db, async (client) => {
        const result = await client.query(
          `INSERT INTO users (username, email, password)
           VALUES ($1, LOWER($2), $3)
           RETURNING id, username, email, email_verified_at`,
          [username, email, hashedPassword]
        );
        const user = result.rows[0];
        await client.query(
          `INSERT INTO account_tokens (user_id, type, token_hash, expires_at)
           VALUES ($1, 'email_verification', $2, $3)`,
          [user.id, tokenHash, expiresAt]
        );
        await enqueueMail(client, user, 'email_verification', token);
        return user;
      });
    },

    async recordLoginFailure(userId, maxAttempts, lockoutMinutes) {
      const result = await db.query(
        `UPDATE users
         SET failed_login_attempts = failed_login_attempts + 1,
             locked_until = CASE
               WHEN failed_login_attempts + 1 >= $2
               THEN CURRENT_TIMESTAMP + ($3 * INTERVAL '1 minute')
               ELSE locked_until
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING failed_login_attempts, locked_until`,
        [userId, maxAttempts, lockoutMinutes]
      );
      return result.rows[0];
    },

    async clearLoginFailures(userId) {
      await db.query(
        `UPDATE users
         SET failed_login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [userId]
      );
    },

    async issueAccountTokenWithEmail(user, type, tokenHash, token, expiresAt) {
      return withTransaction(db, async (client) => {
        await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [user.id]);
        const recent = await client.query(
          `SELECT 1 FROM account_tokens
           WHERE user_id = $1 AND type = $2
             AND created_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes'
           LIMIT 1`,
          [user.id, type]
        );
        if (recent.rowCount) return { queued: false };
        await client.query(
          `UPDATE mail_outbox
           SET failed_at = CURRENT_TIMESTAMP,
               payload = '{}'::jsonb,
               last_error = 'Superseded by a newer account token',
               updated_at = CURRENT_TIMESTAMP
           WHERE recipient = $1 AND type = $2
             AND sent_at IS NULL AND failed_at IS NULL`,
          [user.email, type]
        );
        await client.query(
          `UPDATE account_tokens
           SET consumed_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND type = $2 AND consumed_at IS NULL`,
          [user.id, type]
        );
        const result = await client.query(
          `INSERT INTO account_tokens (user_id, type, token_hash, expires_at)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [user.id, type, tokenHash, expiresAt]
        );
        await enqueueMail(client, user, type, token);
        return { ...result.rows[0], queued: true };
      });
    },

    async consumeVerificationToken(tokenHash) {
      return withTransaction(db, async (client) => {
        const token = await client.query(
          `SELECT id, user_id
           FROM account_tokens
           WHERE token_hash = $1
             AND type = 'email_verification'
             AND consumed_at IS NULL
             AND expires_at > CURRENT_TIMESTAMP
           FOR UPDATE`,
          [tokenHash]
        );
        if (!token.rows[0]) return undefined;
        await client.query(
          'UPDATE account_tokens SET consumed_at = CURRENT_TIMESTAMP WHERE id = $1',
          [token.rows[0].id]
        );
        const user = await client.query(
          `UPDATE users
           SET email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING id, username, email, email_verified_at`,
          [token.rows[0].user_id]
        );
        return user.rows[0];
      });
    },

    async consumeResetToken(tokenHash, hashedPassword) {
      return withTransaction(db, async (client) => {
        const token = await client.query(
          `SELECT id, user_id
           FROM account_tokens
           WHERE token_hash = $1
             AND type = 'password_reset'
             AND consumed_at IS NULL
             AND expires_at > CURRENT_TIMESTAMP
           FOR UPDATE`,
          [tokenHash]
        );
        if (!token.rows[0]) return undefined;
        await client.query(
          'UPDATE account_tokens SET consumed_at = CURRENT_TIMESTAMP WHERE id = $1',
          [token.rows[0].id]
        );
        const user = await client.query(
          `UPDATE users
           SET password = $1,
               failed_login_attempts = 0,
               locked_until = NULL,
               auth_version = auth_version + 1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING id, username, email, email_verified_at, auth_version`,
          [hashedPassword, token.rows[0].user_id]
        );
        await client.query(
          `UPDATE refresh_tokens
           SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
           WHERE user_id = $1`,
          [token.rows[0].user_id]
        );
        return user.rows[0];
      });
    },

    async createRefreshToken({ userId, familyId, tokenHash, expiresAt }) {
      const result = await db.query(
        `INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [userId, familyId, tokenHash, expiresAt]
      );
      return result.rows[0];
    },

    async rotateRefreshToken(currentHash, replacement) {
      return withTransaction(db, async (client) => {
        const current = await client.query(
          `SELECT rt.*, u.username, u.email, u.email_verified_at, u.auth_version
           FROM refresh_tokens rt
           JOIN users u ON u.id = rt.user_id
           WHERE rt.token_hash = $1
           FOR UPDATE OF rt`,
          [currentHash]
        );
        const row = current.rows[0];
        if (!row) return { status: 'invalid' };
        if (row.revoked_at || row.replaced_by_id) {
          await client.query(
            `UPDATE refresh_tokens
             SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
             WHERE family_id = $1`,
            [row.family_id]
          );
          return { status: 'reused' };
        }
        if (new Date(row.expires_at) <= new Date()) return { status: 'expired' };
        if (!row.email_verified_at) return { status: 'invalid' };

        const inserted = await client.query(
          `INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [row.user_id, row.family_id, replacement.tokenHash, row.expires_at]
        );
        await client.query(
          `UPDATE refresh_tokens
           SET revoked_at = CURRENT_TIMESTAMP,
               last_used_at = CURRENT_TIMESTAMP,
               replaced_by_id = $2
           WHERE id = $1`,
          [row.id, inserted.rows[0].id]
        );
        return {
          status: 'rotated',
          user: {
            id: row.user_id,
            username: row.username,
            email: row.email,
            email_verified_at: row.email_verified_at,
            auth_version: row.auth_version,
          },
          familyId: row.family_id,
        };
      });
    },

    async revokeRefreshFamily(tokenHash) {
      return withTransaction(db, async (client) => {
        const current = await client.query(
          'SELECT family_id FROM refresh_tokens WHERE token_hash = $1 FOR UPDATE',
          [tokenHash]
        );
        if (!current.rows[0]) return false;
        await client.query(
          `UPDATE refresh_tokens
           SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
           WHERE family_id = $1`,
          [current.rows[0].family_id]
        );
        return true;
      });
    },
  };
}
