import axios from 'axios';

const API_URL = 'http://localhost:3001/categories';

// Fetch all categories
export const fetchCategories = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Create a new category
export const createCategory = async (categoryData) => {
  const response = await axios.post(API_URL, categoryData);
  return response.data;
};

// Delete a category by ID
export const deleteCategory = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
