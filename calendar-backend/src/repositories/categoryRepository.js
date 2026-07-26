import { withTransaction } from '../db.js';

export function createCategoryRepository(db) {
  return {
    async list(userId) {
      const result = await db.query(
        `SELECT c.category_id, c.name, c.color
         FROM categories c
         WHERE c.user_id = $1
         ORDER BY c.name`,
        [userId]
      );
      return result.rows;
    },

    async create({ name, color, userId }) {
      return withTransaction(db, async (client) => {
        await client.query('SELECT pg_advisory_xact_lock(1002, $1)', [userId]);
        const result = await client.query(
          `INSERT INTO categories (user_id, name, color)
           SELECT $1, $2, $3
           WHERE (SELECT COUNT(*) FROM categories WHERE user_id = $1) < 500
           RETURNING category_id, name, color`,
          [userId, name, color]
        );
        return result.rows[0];
      });
    },

    async update(categoryId, { name, color, userId }) {
      const result = await db.query(
        `UPDATE categories c
         SET name = $1, color = $2, updated_at = CURRENT_TIMESTAMP
         WHERE c.category_id = $3
           AND c.user_id = $4
         RETURNING category_id, name, color`,
        [name, color, categoryId, userId]
      );
      return result.rows[0];
    },

    async remove(categoryId, userId) {
      const result = await db.query(
         `DELETE FROM categories c
         WHERE c.category_id = $1
           AND c.user_id = $2
         RETURNING category_id, name, color`,
        [categoryId, userId]
      );
      return result.rows[0];
    },

    async count(userId) {
      const result = await db.query(
        'SELECT COUNT(*)::integer AS count FROM categories WHERE user_id = $1',
        [userId]
      );
      return result.rows[0].count;
    },
  };
}
