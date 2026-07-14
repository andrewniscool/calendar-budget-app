import { limitReached, notFound } from '../errors.js';

export function createCalendarService(repository) {
  return {
    list: (userId) => repository.list(userId),
    async create(userId, data) {
      const created = await repository.create(userId, data.name);
      if (!created && await repository.count(userId) >= 50) {
        throw limitReached('A user can have at most 50 calendars');
      }
      return created;
    },
    async remove(userId, calendarId) {
      const deleted = await repository.remove(calendarId, userId);
      if (!deleted) throw notFound('Calendar not found');
      return deleted;
    },
  };
}
