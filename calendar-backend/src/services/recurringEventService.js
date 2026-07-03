import { badRequest, notFound } from '../errors.js';

function translateDatabaseError(error) {
  if (error.code === '23503') {
    throw badRequest('Category must belong to the recurring event calendar');
  }
  if (error.code === '23514') {
    throw badRequest('Recurring event values violate a database constraint');
  }
  throw error;
}

export function createRecurringEventService(repository) {
  return {
    async list(userId, calendarId) {
      const exists = await repository.calendarExists(calendarId, userId);
      if (!exists) throw notFound('Calendar not found');
      return repository.list(calendarId, userId);
    },

    async create(userId, data) {
      try {
        const created = await repository.create(data, userId);
        if (!created) throw notFound('Calendar not found');
        return created;
      } catch (error) {
        return translateDatabaseError(error);
      }
    },

    async update(userId, recurringEventId, data) {
      try {
        const updated = await repository.update(recurringEventId, userId, data);
        if (!updated) throw notFound('Recurring event not found');
        return updated;
      } catch (error) {
        return translateDatabaseError(error);
      }
    },

    async remove(userId, recurringEventId) {
      const deleted = await repository.remove(recurringEventId, userId);
      if (!deleted) throw notFound('Recurring event not found');
      return deleted;
    },
  };
}
