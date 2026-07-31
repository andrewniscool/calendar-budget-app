import { badRequest } from '../errors.js';

function formatBudgetLimits(period, rows) {
  const overall = rows.find((row) => row.category_id === null);
  return {
    period,
    overall: overall ? Number(overall.amount) : null,
    categories: rows
      .filter((row) => row.category_id !== null)
      .map((row) => ({
        categoryId: row.category_id,
        amount: Number(row.amount),
      })),
  };
}

function translateDatabaseError(error) {
  if (error.code === '23503') {
    throw badRequest('Category must belong to the budget owner');
  }
  if (error.code === '23514') {
    throw badRequest('Budget limit values violate a database constraint');
  }
  throw error;
}

export function createBudgetLimitService(repository) {
  return {
    async list(userId, { period }) {
      const rows = await repository.list(userId, period);
      return formatBudgetLimits(period, rows);
    },

    async upsert(userId, data) {
      try {
        const rows = await repository.upsertMany(userId, data);
        return formatBudgetLimits(data.period, rows);
      } catch (error) {
        return translateDatabaseError(error);
      }
    },
  };
}
