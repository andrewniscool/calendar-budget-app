import { api } from './apiClient';

export const fetchCalendars = async () => {
  try {
    const response = await api.get('/calendars');
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
    const response = await api.post('/calendars', { name: name.trim() });
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
    const response = await api.delete(`/calendars/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting calendar:", error);
    throw new Error(error.response?.data?.error || "Failed to delete calendar");
  }
};
