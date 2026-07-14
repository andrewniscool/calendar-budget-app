import { withTransaction } from '../db.js';

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
  async function listWith(queryable, calendarId, userId, period) {
    const result = await queryable.query(
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
  }

  return {
    async calendarExists(calendarId, userId) {
      const result = await db.query(
        'SELECT 1 FROM calendars WHERE calendar_id = $1 AND user_id = $2',
        [calendarId, userId]
      );
      return result.rowCount > 0;
    },

    async list(calendarId, userId, period) {
      return listWith(db, calendarId, userId, period);
    },

    async upsertMany(userId, { calendarId, period, overall, categories }) {
      return withTransaction(db, async (client) => {
        const ownedCalendar = await client.query(
          'SELECT 1 FROM calendars WHERE calendar_id = $1 AND user_id = $2 FOR UPDATE',
          [calendarId, userId]
        );
        if (!ownedCalendar.rowCount) return undefined;

        const categoryIds = categories.map((category) => category.categoryId);
        if (categoryIds.length) {
          const ownedCategories = await client.query(
            `SELECT COUNT(*)::integer AS count
             FROM categories
             WHERE calendar_id = $1 AND category_id = ANY($2::integer[])`,
            [calendarId, categoryIds]
          );
          if (ownedCategories.rows[0].count !== categoryIds.length) {
            const error = new Error('Budget category does not belong to the calendar');
            error.code = '23503';
            throw error;
          }
        }

        const periodDate = periodStart(period);
        if (overall !== null && overall !== undefined) {
          await client.query(
          `INSERT INTO budget_limits (calendar_id, category_id, period_start, amount)
           VALUES ($1, NULL, $2, $3)
           ON CONFLICT (calendar_id, period_start)
             WHERE category_id IS NULL
             DO UPDATE SET amount = EXCLUDED.amount, updated_at = CURRENT_TIMESTAMP`,
            [calendarId, periodDate, overall]
          );
        }
        if (categories.length) {
          await client.query(
            `INSERT INTO budget_limits (calendar_id, category_id, period_start, amount)
           SELECT $1, input.category_id, $2, input.amount
           FROM UNNEST($3::integer[], $4::numeric[]) AS input(category_id, amount)
           ON CONFLICT (calendar_id, category_id, period_start)
             WHERE category_id IS NOT NULL
             DO UPDATE SET amount = EXCLUDED.amount, updated_at = CURRENT_TIMESTAMP`,
            [
              calendarId,
              periodDate,
              categoryIds,
              categories.map((category) => category.amount),
            ]
          );
        }

        return listWith(client, calendarId, userId, period);
      });
    },
  };
}
