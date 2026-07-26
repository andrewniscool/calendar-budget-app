import { withTransaction } from '../db.js';

function periodStart(period) {
  return `${period}-01`;
}

function mapBudgetLimit(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    category_id: row.category_id,
    period_start: row.period_start,
    amount: row.amount,
  };
}

export function createBudgetLimitRepository(db) {
  async function listWith(queryable, userId, period) {
    const result = await queryable.query(
      `SELECT bl.id, bl.user_id, bl.category_id, bl.period_start, bl.amount
       FROM budget_limits bl
       WHERE bl.user_id = $1
         AND bl.period_start = $2
       ORDER BY bl.category_id NULLS FIRST`,
      [userId, periodStart(period)]
    );
    return result.rows.map(mapBudgetLimit);
  }

  return {
    async list(userId, period) {
      return listWith(db, userId, period);
    },

    async upsertMany(userId, { period, overall, categories }) {
      return withTransaction(db, async (client) => {
        await client.query('SELECT pg_advisory_xact_lock(1004, $1)', [userId]);

        const categoryIds = categories.map((category) => category.categoryId);
        if (categoryIds.length) {
          const ownedCategories = await client.query(
            `SELECT COUNT(*)::integer AS count
             FROM categories
             WHERE user_id = $1 AND category_id = ANY($2::integer[])`,
            [userId, categoryIds]
          );
          if (ownedCategories.rows[0].count !== categoryIds.length) {
            const error = new Error('Budget category does not belong to the user');
            error.code = '23503';
            throw error;
          }
        }

        const periodDate = periodStart(period);
        if (overall !== null && overall !== undefined) {
          await client.query(
            `INSERT INTO budget_limits (user_id, category_id, period_start, amount)
           VALUES ($1, NULL, $2, $3)
           ON CONFLICT (user_id, period_start)
             WHERE category_id IS NULL
             DO UPDATE SET amount = EXCLUDED.amount, updated_at = CURRENT_TIMESTAMP`,
            [userId, periodDate, overall]
          );
        }
        if (categories.length) {
          await client.query(
            `INSERT INTO budget_limits (user_id, category_id, period_start, amount)
           SELECT $1, input.category_id, $2, input.amount
           FROM UNNEST($3::integer[], $4::numeric[]) AS input(category_id, amount)
           ON CONFLICT (user_id, category_id, period_start)
             WHERE category_id IS NOT NULL
             DO UPDATE SET amount = EXCLUDED.amount, updated_at = CURRENT_TIMESTAMP`,
            [
              userId,
              periodDate,
              categoryIds,
              categories.map((category) => category.amount),
            ]
          );
        }

        return listWith(client, userId, period);
      });
    },
  };
}
