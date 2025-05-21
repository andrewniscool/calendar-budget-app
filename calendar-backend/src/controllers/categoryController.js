// src/controllers/categoryController.js (Backend)
import * as categoryModel from '../models/categoryModel.js';

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.getCategories();  // Get categories from the model
    res.json(categories);  // Send the categories as the response
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });  // Handle errors
  }
};

// Create a new category
export const createCategory = async (req, res) => {
  const { name, color } = req.body;  // Get category data from the request body
  try {
    const newCategory = await categoryModel.createCategory({ name, color });  // Create category using the model
    res.status(201).json(newCategory);  // Send the newly created category as the response
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });  // Handle errors
  }
};

// Delete a category
export const deleteCategory = async (req, res) => {
  const { id } = req.params;  // Get category ID from the URL
  try {
    const deletedCategory = await categoryModel.deleteCategory(id);  // Delete category using the model
    res.json(deletedCategory);  // Send the deleted category as the response
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });  // Handle errors
  }
};

