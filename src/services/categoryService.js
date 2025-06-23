import axios from "axios";

const API_URL = "http://localhost:3001/categories";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

export const fetchCategories = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeaders() });
  return response.data;
};

export const createCategory = async (categoryData) => {
  const response = await axios.post(API_URL, categoryData, { headers: getAuthHeaders() });
  return response.data;
};

export const deleteAllCategories = async () => {
  const response = await axios.delete(`${API_URL}/all`, { headers: getAuthHeaders() });
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return response.data;
};
