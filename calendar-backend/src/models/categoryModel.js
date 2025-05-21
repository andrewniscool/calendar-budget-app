// src/models/categoryModel.js
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const getCategories = async () => {
  try {
    const result = await db.query('SELECT * FROM categories');
    return result.rows;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const createCategory = async ({ name, color }) => {
  try {
    const result = await db.query(
      'INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING *',
      [name, color]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const result = await db.query(
      'DELETE FROM categories WHERE category_id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};
