import { withTransaction } from '../db.js';

export function createMailOutboxRepository(db) {
  return {
    claimBatch(limit = 10) {
      return withTransaction(db, async (client) => {
        const result = await client.query(
          `WITH available AS (
             SELECT id
             FROM mail_outbox
             WHERE sent_at IS NULL
               AND failed_at IS NULL
               AND attempts < max_attempts
               AND next_attempt_at <= CURRENT_TIMESTAMP
               AND (locked_at IS NULL OR locked_at < CURRENT_TIMESTAMP - INTERVAL '5 minutes')
             ORDER BY next_attempt_at, id
             FOR UPDATE SKIP LOCKED
             LIMIT $1
           )
           UPDATE mail_outbox outbox
           SET locked_at = CURRENT_TIMESTAMP,
               attempts = attempts + 1,
               updated_at = CURRENT_TIMESTAMP
           FROM available
           WHERE outbox.id = available.id
           RETURNING outbox.*`,
          [limit]
        );
        return result.rows;
      });
    },

    async markSent(id) {
      await db.query(
        `UPDATE mail_outbox
         SET sent_at = CURRENT_TIMESTAMP,
             payload = '{}'::jsonb,
             locked_at = NULL,
             last_error = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );
    },

    async markFailed(job, errorMessage, retryDelaySeconds) {
      const terminal = job.attempts >= job.max_attempts;
      await db.query(
        `UPDATE mail_outbox
         SET locked_at = NULL,
             last_error = $2,
             failed_at = CASE WHEN $3 THEN CURRENT_TIMESTAMP ELSE NULL END,
             payload = CASE WHEN $3 THEN '{}'::jsonb ELSE payload END,
             next_attempt_at = CASE
               WHEN $3 THEN next_attempt_at
               ELSE CURRENT_TIMESTAMP + ($4 * INTERVAL '1 second')
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [job.id, errorMessage.slice(0, 1000), terminal, retryDelaySeconds]
      );
    },
  };
}
