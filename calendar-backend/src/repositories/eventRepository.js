const eventSelect = `
  SELECT e.*, c.name AS category_name, c.color AS category_color
  FROM events e
  LEFT JOIN categories c
    ON c.category_id = e.category_id
   AND c.calendar_id = e.calendar_id
`;

export function createEventRepository(db) {
  return {
    async calendarExists(calendarId, userId) {
      const result = await db.query(
        'SELECT 1 FROM calendars WHERE calendar_id = $1 AND user_id = $2',
        [calendarId, userId]
      );
      return result.rowCount > 0;
    },

    async list(calendarId, userId, { startDate, endDate } = {}) {
      const filters = ['e.calendar_id = $1', 'cal.user_id = $2'];
      const values = [calendarId, userId];

      if (startDate) {
        values.push(startDate);
        filters.push(`e.date >= $${values.length}`);
      }
      if (endDate) {
        values.push(endDate);
        filters.push(`e.date <= $${values.length}`);
      }

      const result = await db.query(
        `${eventSelect}
         JOIN calendars cal ON cal.calendar_id = e.calendar_id
         WHERE ${filters.join(' AND ')}
         ORDER BY e.date, e.time_start`,
        values
      );
      return result.rows;
    },

    async create(data, userId) {
      const inserted = await db.query(
        `INSERT INTO events (
           title, date, time_start, time_end, category_id, budget, calendar_id
         )
         SELECT $1, $2, $3, $4, $5, $6, $7
         WHERE EXISTS (
           SELECT 1 FROM calendars WHERE calendar_id = $7 AND user_id = $8
         )
         RETURNING id`,
        [
          data.title,
          data.date,
          data.timeStart,
          data.timeEnd,
          data.categoryId ?? null,
          data.budget,
          data.calendarId,
          userId,
        ]
      );
      if (!inserted.rows[0]) return undefined;
      return this.findById(inserted.rows[0].id, userId);
    },

    async update(id, userId, data) {
      const updated = await db.query(
        `UPDATE events e
         SET title = $1,
             date = $2,
             time_start = $3,
             time_end = $4,
             category_id = $5,
             budget = $6
         WHERE e.id = $7
           AND EXISTS (
             SELECT 1 FROM calendars
             WHERE calendar_id = e.calendar_id AND user_id = $8
           )
         RETURNING e.id`,
        [
          data.title,
          data.date,
          data.timeStart,
          data.timeEnd,
          data.categoryId ?? null,
          data.budget,
          id,
          userId,
        ]
      );
      if (!updated.rows[0]) return undefined;
      return this.findById(updated.rows[0].id, userId);
    },

    async findById(id, userId) {
      const result = await db.query(
        `${eventSelect}
         JOIN calendars cal ON cal.calendar_id = e.calendar_id
         WHERE e.id = $1 AND cal.user_id = $2`,
        [id, userId]
      );
      return result.rows[0];
    },

    async remove(id, userId) {
      const result = await db.query(
        `DELETE FROM events e
         WHERE e.id = $1
           AND EXISTS (
             SELECT 1 FROM calendars
             WHERE calendar_id = e.calendar_id AND user_id = $2
           )
         RETURNING *`,
        [id, userId]
      );
      return result.rows[0];
    },
  };
}
