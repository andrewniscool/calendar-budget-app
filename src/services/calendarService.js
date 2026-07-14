import { api } from './apiClient';
import { DEV_CALENDAR, USE_MOCK_API } from '../devConfig';

let mockCalendars = [DEV_CALENDAR];

export const fetchCalendars = async () => {
  if (USE_MOCK_API) {
    return mockCalendars;
  }

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

  if (USE_MOCK_API) {
    const calendar = {
      calendar_id: `dev-calendar-${Date.now()}`,
      name: name.trim(),
    };
    mockCalendars = [...mockCalendars, calendar];
    return calendar;
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

  if (USE_MOCK_API) {
    mockCalendars = mockCalendars.filter((calendar) => calendar.calendar_id !== id);
    return { calendar_id: id };
  }
  
  try {
    const response = await api.delete(`/calendars/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting calendar:", error);
    throw new Error(error.response?.data?.error || "Failed to delete calendar");
  }
};
