import { badRequest, notFound } from '../errors.js';

function formatBudgetLimits(calendarId, period, rows) {
  const overall = rows.find((row) => row.category_id === null);
  return {
    calendarId,
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
    throw badRequest('Category must belong to the budget calendar');
  }
  if (error.code === '23514') {
    throw badRequest('Budget limit values violate a database constraint');
  }
  throw error;
}

export function createBudgetLimitService(repository) {
  return {
    async list(userId, { calendarId, period }) {
      const exists = await repository.calendarExists(calendarId, userId);
      if (!exists) throw notFound('Calendar not found');
      const rows = await repository.list(calendarId, userId, period);
      return formatBudgetLimits(calendarId, period, rows);
    },

    async upsert(userId, data) {
      try {
        const rows = await repository.upsertMany(userId, data);
        if (!rows) throw notFound('Calendar not found');
        return formatBudgetLimits(data.calendarId, data.period, rows);
      } catch (error) {
        return translateDatabaseError(error);
      }
    },
  };
}
