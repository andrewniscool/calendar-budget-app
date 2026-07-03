import { notFound } from '../errors.js';

export function createCalendarSettingsService(repository) {
  return {
    async get(userId, calendarId) {
      const settings = await repository.find(calendarId, userId);
      if (!settings) throw notFound('Calendar not found');
      return settings;
    },

    async update(userId, calendarId, data) {
      const settings = await repository.upsert(calendarId, userId, data);
      if (!settings) throw notFound('Calendar not found');
      return settings;
    },
  };
}
