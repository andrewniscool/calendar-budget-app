function periodStart(period) {
  return `${period}-01`;
}

function mapBudgetLimit(row) {
  return {
    id: row.id,
    calendar_id: row.calendar_id,
    category_id: row.category_id,
    period_start: row.period_start,
    amount: row.amount,
  };
}

export function createBudgetLimitRepository(db) {
  return {
    async calendarExists(calendarId, userId) {
      const result = await db.query(
        'SELECT 1 FROM calendars WHERE calendar_id = $1 AND user_id = $2',
        [calendarId, userId]
      );
      return result.rowCount > 0;
    },

    async list(calendarId, userId, period) {
      const result = await db.query(
        `SELECT bl.id, bl.calendar_id, bl.category_id, bl.period_start, bl.amount
         FROM budget_limits bl
         JOIN calendars cal ON cal.calendar_id = bl.calendar_id
         WHERE bl.calendar_id = $1
           AND cal.user_id = $2
           AND bl.period_start = $3
         ORDER BY bl.category_id NULLS FIRST`,
        [calendarId, userId, periodStart(period)]
      );
      return result.rows.map(mapBudgetLimit);
    },

    async upsertMany(userId, { calendarId, period, overall, categories }) {
      const periodDate = periodStart(period);
      if (overall !== null && overall !== undefined) {
        await db.query(
          `INSERT INTO budget_limits (calendar_id, category_id, period_start, amount)
           SELECT $1, NULL, $2, $3
           WHERE EXISTS (
             SELECT 1 FROM calendars WHERE calendar_id = $1 AND user_id = $4
           )
           ON CONFLICT (calendar_id, period_start)
             WHERE category_id IS NULL
             DO UPDATE SET amount = EXCLUDED.amount, updated_at = CURRENT_TIMESTAMP`,
          [calendarId, periodDate, overall, userId]
        );
      }
      for (const category of categories) {
        await db.query(
          `INSERT INTO budget_limits (calendar_id, category_id, period_start, amount)
           SELECT $1, $2, $3, $4
           WHERE EXISTS (
             SELECT 1 FROM calendars WHERE calendar_id = $1 AND user_id = $5
           )
           ON CONFLICT (calendar_id, category_id, period_start)
             WHERE category_id IS NOT NULL
             DO UPDATE SET amount = EXCLUDED.amount, updated_at = CURRENT_TIMESTAMP`,
          [calendarId, category.categoryId, periodDate, category.amount, userId]
        );
      }

      return this.list(calendarId, userId, period);
    },
  };
}
