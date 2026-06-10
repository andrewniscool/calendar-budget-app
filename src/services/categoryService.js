import { api } from "./apiClient";

export const fetchCategories = async (calendarId) => {
  if (!calendarId) {
    throw new Error("calendarId is required to fetch categories");
  }
  
  try {
    const response = await api.get(`/categories?calendarId=${calendarId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch categories");
  }
};

export const createCategory = async (categoryData) => {
  if (!categoryData.calendarId) {
    throw new Error("calendarId is required when creating a category");
  }
  if (!categoryData.name) {
    throw new Error("name is required when creating a category");
  }

  try {
    const response = await api.post('/categories', categoryData);
    return response.data;
  } catch (error) {
    console.error("Error creating category:", error);
    throw new Error(error.response?.data?.error || "Failed to create category");
  }
};

export const updateCategory = async (id, categoryData) => {
  if (!id) {
    throw new Error("Category ID is required to update a category");
  }
  if (!categoryData.calendarId) {
    throw new Error("calendarId is required when updating a category");
  }
  if (!categoryData.name) {
    throw new Error("name is required when updating a category");
  }

  try {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error("Error updating category:", error);
    throw new Error(error.response?.data?.error || "Failed to update category");
  }
};

export const deleteAllCategories = async (calendarId) => {
  if (!calendarId) {
    throw new Error("calendarId is required to delete all categories");
  }
  
  try {
    const response = await api.delete(`/categories/all?calendarId=${calendarId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting all categories:", error);
    throw new Error(error.response?.data?.error || "Failed to delete all categories");
  }
};

export const deleteCategory = async (id) => {
  if (!id) {
    throw new Error("Category ID is required to delete a category");
  }
  
  try {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error(error.response?.data?.error || "Failed to delete category");
  }
};
