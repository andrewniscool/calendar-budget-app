export function createCategoryRepository(db) {
  return {
    async list(calendarId, userId) {
      const result = await db.query(
        `SELECT c.category_id, c.name, c.color
         FROM categories c
         JOIN calendars cal ON cal.calendar_id = c.calendar_id
         WHERE c.calendar_id = $1 AND cal.user_id = $2
         ORDER BY c.name`,
        [calendarId, userId]
      );
      return result.rows;
    },

    async create({ name, color, calendarId, userId }) {
      const result = await db.query(
        `INSERT INTO categories (calendar_id, name, color)
         SELECT $1, $2, $3
         WHERE EXISTS (
           SELECT 1 FROM calendars WHERE calendar_id = $1 AND user_id = $4
         )
         RETURNING category_id, name, color`,
        [calendarId, name, color, userId]
      );
      return result.rows[0];
    },

    async update(categoryId, { name, color, calendarId, userId }) {
      const result = await db.query(
        `UPDATE categories c
         SET name = $1, color = $2
         WHERE c.category_id = $3
           AND c.calendar_id = $4
           AND EXISTS (
             SELECT 1 FROM calendars
             WHERE calendar_id = c.calendar_id AND user_id = $5
           )
         RETURNING category_id, name, color`,
        [name, color, categoryId, calendarId, userId]
      );
      return result.rows[0];
    },

    async remove(categoryId, userId) {
      const result = await db.query(
        `DELETE FROM categories c
         WHERE c.category_id = $1
           AND EXISTS (
             SELECT 1 FROM calendars
             WHERE calendar_id = c.calendar_id AND user_id = $2
           )
         RETURNING category_id, name, color`,
        [categoryId, userId]
      );
      return result.rows[0];
    },

    async removeAll(calendarId, userId) {
      const result = await db.query(
        `DELETE FROM categories c
         WHERE c.calendar_id = $1
           AND EXISTS (
             SELECT 1 FROM calendars
             WHERE calendar_id = c.calendar_id AND user_id = $2
           )
         RETURNING category_id`,
        [calendarId, userId]
      );
      return result.rowCount;
    },

    async calendarExists(calendarId, userId) {
      const result = await db.query(
        'SELECT 1 FROM calendars WHERE calendar_id = $1 AND user_id = $2',
        [calendarId, userId]
      );
      return result.rowCount > 0;
    },
  };
}
