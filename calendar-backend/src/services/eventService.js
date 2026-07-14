import { badRequest, dateRangeRequired, notFound } from '../errors.js';

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
    async list(userId, { calendarId, startDate, endDate }) {
      const exists = await repository.calendarExists(calendarId, userId);
      if (!exists) throw notFound('Calendar not found');
      const events = await repository.list(calendarId, userId, { startDate, endDate });
      if ((!startDate || !endDate) && events.length > 1000) {
        throw dateRangeRequired('This calendar has too many events; provide startDate and endDate');
      }
      return events;
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
