import { conflict, limitReached, notFound } from '../errors.js';

function translateDatabaseError(error) {
  if (error.code === '23505') throw conflict('Category name already exists');
  throw error;
}

export function createCategoryService(repository) {
  return {
    async list(userId) {
      return repository.list(userId);
    },

    async create(userId, data) {
      try {
        const created = await repository.create({ ...data, userId });
        if (!created) {
          if (await repository.count(userId) >= 500) {
            throw limitReached('A user can have at most 500 categories');
          }
        }
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
  };
}
