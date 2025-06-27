import axios from "axios";

const API_URL = "http://localhost:3001/categories";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

export const fetchCategories = async (calendarId) => {
  if (!calendarId) {
    throw new Error("calendarId is required to fetch categories");
  }
  
  try {
    const response = await axios.get(`${API_URL}?calendarId=${calendarId}`, {
      headers: getAuthHeaders(),
    });
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
    const response = await axios.post(API_URL, categoryData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error creating category:", error);
    throw new Error(error.response?.data?.error || "Failed to create category");
  }
};

export const deleteAllCategories = async (calendarId) => {
  if (!calendarId) {
    throw new Error("calendarId is required to delete all categories");
  }
  
  try {
    const response = await axios.delete(`${API_URL}/all?calendarId=${calendarId}`, {
      headers: getAuthHeaders(),
    });
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
    const response = await axios.delete(`${API_URL}/${id}`, { 
      headers: getAuthHeaders() 
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error(error.response?.data?.error || "Failed to delete category");
  }
};
