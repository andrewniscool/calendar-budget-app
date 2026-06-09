import { conflict, notFound } from '../errors.js';

function translateDatabaseError(error) {
  if (error.code === '23505') throw conflict('Category name already exists in this calendar');
  throw error;
}

export function createCategoryService(repository) {
  return {
    async list(userId, calendarId) {
      const exists = await repository.calendarExists(calendarId, userId);
      if (!exists) throw notFound('Calendar not found');
      return repository.list(calendarId, userId);
    },

    async create(userId, data) {
      try {
        const created = await repository.create({ ...data, userId });
        if (!created) throw notFound('Calendar not found');
        return created;
      } catch (error) {
        return translateDatabaseError(error);
      }
    },

    async update(userId, categoryId, data) {
      try {
        const updated = await repository.update(categoryId, { ...data, userId });
        if (!updated) throw notFound('Category not found');
        return updated;
      } catch (error) {
        return translateDatabaseError(error);
      }
    },

    async remove(userId, categoryId) {
      const deleted = await repository.remove(categoryId, userId);
      if (!deleted) throw notFound('Category not found');
      return deleted;
    },

    async removeAll(userId, calendarId) {
      const exists = await repository.calendarExists(calendarId, userId);
      if (!exists) throw notFound('Calendar not found');
      const deletedCount = await repository.removeAll(calendarId, userId);
      return { message: 'All categories deleted', deletedCount };
    },
  };
}
