// src/controllers/categoryController.js
import * as categoryModel from '../models/categoryModel.js';

// Get all categories for the logged-in user
export const getCategories = async (req, res) => {
  const userId = req.user.id;  // Auth middleware sets this
  try {
    const categories = await categoryModel.getCategoriesByUser(userId);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Create a new category for the user
export const createCategory = async (req, res) => {
  const { name, color } = req.body;
  const userId = req.user.id;
  try {
    const newCategory = await categoryModel.createCategory({ userId, name, color });
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// Delete a specific category (by ID), only if it belongs to the user
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const deletedCategory = await categoryModel.deleteCategory(id, userId);
    res.json(deletedCategory);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

// Delete all categories for the user
export const deleteAllCategories = async (req, res) => {
  const userId = req.user.id;
  try {
    await categoryModel.deleteAllCategories(userId);
    res.status(200).json({ message: 'All categories deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete categories' });
  }
};
