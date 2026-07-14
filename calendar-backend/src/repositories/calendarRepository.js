import { withTransaction } from '../db.js';

export function createCalendarRepository(db) {
  return {
    async list(userId) {
      const result = await db.query(
        `SELECT calendar_id, name, created_at
         FROM calendars
         WHERE user_id = $1
         ORDER BY created_at`,
        [userId]
      );
      return result.rows;
    },

    async create(userId, name) {
      return withTransaction(db, async (client) => {
        await client.query('SELECT pg_advisory_xact_lock(1001, $1)', [userId]);
        const result = await client.query(
          `INSERT INTO calendars (user_id, name)
           SELECT $1, $2
           WHERE (SELECT COUNT(*) FROM calendars WHERE user_id = $1) < 50
           RETURNING calendar_id, name, created_at`,
          [userId, name]
        );
        return result.rows[0];
      });
    },

    async count(userId) {
      const result = await db.query('SELECT COUNT(*)::integer AS count FROM calendars WHERE user_id = $1', [userId]);
      return result.rows[0].count;
    },

    async remove(calendarId, userId) {
      const result = await db.query(
        `DELETE FROM calendars
         WHERE calendar_id = $1 AND user_id = $2
         RETURNING calendar_id, name, created_at`,
        [calendarId, userId]
      );
      return result.rows[0];
    },
  };
}
