import axios from 'axios';

const API_URL = 'http://localhost:3001/calendars';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const fetchCalendars = async () => {
  try {
    const response = await axios.get(API_URL, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching calendars:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch calendars");
  }
};

export const createCalendar = async (name) => {
  if (!name || !name.trim()) {
    throw new Error("Calendar name is required");
  }
  
  try {
    const response = await axios.post(API_URL, { name: name.trim() }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error creating calendar:", error);
    throw new Error(error.response?.data?.error || "Failed to create calendar");
  }
};

export const deleteCalendar = async (id) => {
  if (!id) {
    throw new Error("Calendar ID is required to delete a calendar");
  }
  
  try {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting calendar:", error);
    throw new Error(error.response?.data?.error || "Failed to delete calendar");
  }
};