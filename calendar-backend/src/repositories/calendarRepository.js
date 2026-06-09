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
      const result = await db.query(
        `INSERT INTO calendars (user_id, name)
         VALUES ($1, $2)
         RETURNING calendar_id, name, created_at`,
        [userId, name]
      );
      return result.rows[0];
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
