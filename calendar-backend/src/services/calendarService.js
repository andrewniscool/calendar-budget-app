import { notFound } from '../errors.js';

export function createCalendarService(repository) {
  return {
    list: (userId) => repository.list(userId),
    create: (userId, data) => repository.create(userId, data.name),
    async remove(userId, calendarId) {
      const deleted = await repository.remove(calendarId, userId);
      if (!deleted) throw notFound('Calendar not found');
      return deleted;
    },
  };
}
