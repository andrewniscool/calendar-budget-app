import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get all categories for a specific user
export const getCategoriesByUser = async (userId) => {
  try {
    const result = await db.query(
      'SELECT category_id, name, color FROM categories WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Create a category for a user
export const createCategory = async ({ userId, name, color }) => {
  try {
    const result = await db.query(
      `INSERT INTO categories (user_id, name, color) VALUES ($1, $2, $3) RETURNING category_id, name, color`,
      [userId, name, color]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// Delete a category by ID only if it belongs to the user
export const deleteCategory = async (categoryId, userId) => {
  try {
    const result = await db.query(
      `DELETE FROM categories WHERE category_id = $1 AND user_id = $2 RETURNING *`,
      [categoryId, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Delete all categories for a user
export const deleteAllCategories = async (userId) => {
  try {
    await db.query(
      `DELETE FROM categories WHERE user_id = $1`,
      [userId]
    );
  } catch (error) {
    console.error('Error deleting all categories:', error);
    throw error;
  }
};
