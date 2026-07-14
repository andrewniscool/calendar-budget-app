import { api } from "./apiClient";
import { USE_MOCK_API } from "../devConfig";

let mockCategories = [
  { category_id: "dev-category-work", name: "Work", color: "#81B2D9" },
  { category_id: "dev-category-food", name: "Food", color: "#FFB88A" },
  { category_id: "dev-category-study", name: "Study", color: "#BBA6DD" },
];

export const fetchCategories = async (calendarId) => {
  if (!calendarId) {
    throw new Error("calendarId is required to fetch categories");
  }

  if (USE_MOCK_API) {
    return mockCategories;
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

  if (USE_MOCK_API) {
    const category = {
      category_id: `dev-category-${Date.now()}`,
      name: categoryData.name,
      color: categoryData.color,
    };
    mockCategories = [...mockCategories, category];
    return category;
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

  if (USE_MOCK_API) {
    const updatedCategory = {
      category_id: id,
      name: categoryData.name,
      color: categoryData.color,
    };
    mockCategories = mockCategories.map((category) =>
      category.category_id === id ? updatedCategory : category
    );
    return updatedCategory;
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

  if (USE_MOCK_API) {
    const deleted = mockCategories.map((category) => ({
      category_id: category.category_id,
    }));
    mockCategories = [];
    return deleted;
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

  if (USE_MOCK_API) {
    mockCategories = mockCategories.filter((category) => category.category_id !== id);
    return { category_id: id };
  }
  
  try {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error(error.response?.data?.error || "Failed to delete category");
  }
};
