import { api } from "./apiClient";

export const fetchEvents = async (calendarId) => {
  if (!calendarId) {
    throw new Error("calendarId is required to fetch events");
  }
  
  try {
    const response = await api.get(`/events?calendarId=${calendarId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch events");
  }
};

export const saveEvent = async (eventData) => {
  if (!eventData.title) {
    throw new Error("Event title is required");
  }
  if (!eventData.date) {
    throw new Error("Event date is required");
  }
  if (!eventData.calendarId) {
    throw new Error("calendarId is required");
  }

  try {
    const method = eventData.id ? "PUT" : "POST";
    const url = eventData.id ? `/events/${eventData.id}` : '/events';
    
    const response = await api({
      method,
      url,
      data: eventData,
    });
    return response.data;
  } catch (error) {
    console.error("Error saving event:", error);
    throw new Error(error.response?.data?.error || "Failed to save event");
  }
};

export const deleteEvent = async (id) => {
  if (!id) {
    throw new Error("Event ID is required to delete an event");
  }
  
  try {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error(error.response?.data?.error || "Failed to delete event");
  }
};
