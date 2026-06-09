import { badRequest, notFound } from '../errors.js';

function translateDatabaseError(error) {
  if (error.code === '23503') {
    throw badRequest('Category must belong to the event calendar');
  }
  if (error.code === '23514') {
    throw badRequest('Event values violate a database constraint');
  }
  throw error;
}

export function createEventService(repository) {
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

    async update(userId, eventId, data) {
      try {
        const updated = await repository.update(eventId, userId, data);
        if (!updated) throw notFound('Event not found');
        return updated;
      } catch (error) {
        return translateDatabaseError(error);
      }
    },

    async remove(userId, eventId) {
      const deleted = await repository.remove(eventId, userId);
      if (!deleted) throw notFound('Event not found');
      return deleted;
    },
  };
}
