// src/models/categoryModel.js (Backend)

const { Pool } = require('pg');
const db = new Pool({
  connectionString: process.env.DATABASE_URL, // Load connection string from .env
});

// Get all categories from the database
const getCategories = async () => {
  try {
    const result = await db.query('SELECT * FROM categories');
    return result.rows;  // Return the categories as an array of objects
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error; // Throw the error to be handled by the controller
  }
};

// Create a new category in the database
const createCategory = async (categoryData) => {
  const { name, color } = categoryData;

  try {
    const result = await db.query(
      'INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING *', // Insert category into the database
      [name, color]  // Values for name and color
    );
    return result.rows[0]; // Return the newly created category
  } catch (error) {
    console.error('Error creating category:', error);
    throw error; // Throw the error to be handled by the controller
  }
};

// Delete a category from the database
const deleteCategory = async (id) => {
  try {
    const result = await db.query('DELETE FROM categories WHERE category_id = $1 RETURNING *', [id]); // Delete category by ID
    return result.rows[0]; // Return the deleted category (if any)
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error; // Throw the error to be handled by the controller
  }
};

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
};
