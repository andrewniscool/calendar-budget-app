import * as categoryModel from '../models/categoryModel.js';

export const getCategories = async (req, res) => {
  const userId = req.user.id;
  const { calendarId } = req.query;
  
  if (!calendarId) {
    return res.status(400).json({ error: 'calendarId is required' });
  }
  
  try {
    const categories = await categoryModel.getCategoriesByCalendar(calendarId, userId);
    res.json(categories);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Create category under a calendar
export const createCategory = async (req, res) => {
  const { name, color, calendarId } = req.body;
  const userId = req.user.id;
  
  if (!name || !calendarId) {
    return res.status(400).json({ error: 'Name and calendarId are required' });
  }
  
  try {
    const newCategory = await categoryModel.createCategory({ 
      name, 
      color, 
      calendarId, 
      userId // Fixed parameter order
    });
    res.status(201).json(newCategory);
  } catch (err) {
    console.error('Create category error:', err);
    if (err.message === 'Unauthorized calendar access') {
      return res.status(403).json({ error: 'Unauthorized calendar access' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// Delete one category by ID (only if it belongs to a calendar owned by the user)
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  if (!id) {
    return res.status(400).json({ error: 'Category ID is required' });
  }
  
  try {
    const deletedCategory = await categoryModel.deleteCategory(id, userId);
    
    if (!deletedCategory) {
      return res.status(404).json({ error: 'Category not found or unauthorized' });
    }
    
    res.json(deletedCategory);
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

// Delete all categories in a calendar
export const deleteAllCategories = async (req, res) => {
  const { calendarId } = req.query;
  const userId = req.user.id;
  
  if (!calendarId) {
    return res.status(400).json({ error: 'calendarId is required' });
  }
  
  try {
    await categoryModel.deleteAllCategories(calendarId, userId);
    res.status(200).json({ message: 'All categories deleted' });
  } catch (err) {
    console.error('Delete all categories error:', err);
    res.status(500).json({ error: 'Failed to delete categories' });
  }
};
