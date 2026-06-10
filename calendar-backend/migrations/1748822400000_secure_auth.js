export async function up(pgm) {
  pgm.sql(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS auth_version INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

    CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
      ON users (LOWER(email))
      WHERE email IS NOT NULL;

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      family_id UUID NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      replaced_by_id BIGINT REFERENCES refresh_tokens(id) ON DELETE SET NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_used_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS account_tokens (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      consumed_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS refresh_tokens_family_idx ON refresh_tokens(family_id);
    CREATE INDEX IF NOT EXISTS refresh_tokens_expires_idx ON refresh_tokens(expires_at);
    CREATE INDEX IF NOT EXISTS account_tokens_user_type_idx ON account_tokens(user_id, type);
    CREATE INDEX IF NOT EXISTS account_tokens_expires_idx ON account_tokens(expires_at);
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP TABLE IF EXISTS account_tokens;
    DROP TABLE IF EXISTS refresh_tokens;
    DROP INDEX IF EXISTS users_email_lower_unique;
    ALTER TABLE users
      DROP COLUMN IF EXISTS email,
      DROP COLUMN IF EXISTS email_verified_at,
      DROP COLUMN IF EXISTS failed_login_attempts,
      DROP COLUMN IF EXISTS locked_until,
      DROP COLUMN IF EXISTS auth_version,
      DROP COLUMN IF EXISTS created_at,
      DROP COLUMN IF EXISTS updated_at;
  `);
}
