const recurringSelect = `
  SELECT re.*, c.name AS category_name, c.color AS category_color
  FROM recurring_events re
  LEFT JOIN categories c
    ON c.category_id = re.category_id
   AND c.calendar_id = re.calendar_id
`;

export function createRecurringEventRepository(db) {
  return {
    async calendarExists(calendarId, userId) {
      const result = await db.query(
        'SELECT 1 FROM calendars WHERE calendar_id = $1 AND user_id = $2',
        [calendarId, userId]
      );
      return result.rowCount > 0;
    },

    async list(calendarId, userId) {
      const result = await db.query(
        `${recurringSelect}
         JOIN calendars cal ON cal.calendar_id = re.calendar_id
         WHERE re.calendar_id = $1 AND cal.user_id = $2
         ORDER BY re.start_date, re.time_start, re.id`,
        [calendarId, userId]
      );
      return result.rows;
    },

    async create(data, userId) {
      const inserted = await db.query(
        `INSERT INTO recurring_events (
           calendar_id, category_id, title, start_date, end_date,
           time_start, time_end, budget, frequency, interval_count
         )
         SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
         WHERE EXISTS (
           SELECT 1 FROM calendars WHERE calendar_id = $1 AND user_id = $11
         )
         RETURNING id`,
        [
          data.calendarId,
          data.categoryId ?? null,
          data.title,
          data.startDate,
          data.endDate ?? null,
          data.timeStart,
          data.timeEnd,
          data.budget,
          data.frequency,
          data.interval,
          userId,
        ]
      );
      if (!inserted.rows[0]) return undefined;
      return this.findById(inserted.rows[0].id, userId);
    },

    async update(id, userId, data) {
      const updated = await db.query(
        `UPDATE recurring_events re
         SET calendar_id = $1,
             category_id = $2,
             title = $3,
             start_date = $4,
             end_date = $5,
             time_start = $6,
             time_end = $7,
             budget = $8,
             frequency = $9,
             interval_count = $10,
             updated_at = CURRENT_TIMESTAMP
         WHERE re.id = $11
           AND EXISTS (
             SELECT 1 FROM calendars
             WHERE calendar_id = re.calendar_id AND user_id = $12
           )
           AND EXISTS (
             SELECT 1 FROM calendars
             WHERE calendar_id = $1 AND user_id = $12
           )
         RETURNING re.id`,
        [
          data.calendarId,
          data.categoryId ?? null,
          data.title,
          data.startDate,
          data.endDate ?? null,
          data.timeStart,
          data.timeEnd,
          data.budget,
          data.frequency,
          data.interval,
          id,
          userId,
        ]
      );
      if (!updated.rows[0]) return undefined;
      return this.findById(updated.rows[0].id, userId);
    },

    async findById(id, userId) {
      const result = await db.query(
        `${recurringSelect}
         JOIN calendars cal ON cal.calendar_id = re.calendar_id
         WHERE re.id = $1 AND cal.user_id = $2`,
        [id, userId]
      );
      return result.rows[0];
    },

    async remove(id, userId) {
      const result = await db.query(
        `DELETE FROM recurring_events re
         WHERE re.id = $1
           AND EXISTS (
             SELECT 1 FROM calendars
             WHERE calendar_id = re.calendar_id AND user_id = $2
           )
         RETURNING *`,
        [id, userId]
      );
      return result.rows[0];
    },
  };
}
