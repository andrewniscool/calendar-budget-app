import { api } from "./apiClient";

export function mapEventFromApi(event) {
  return {
    ...event,
    timeStart: event.timeStart ?? event.time_start,
    timeEnd: event.timeEnd ?? event.time_end,
    categoryId: event.categoryId ?? event.category_id ?? "",
    categoryName: event.categoryName ?? event.category_name ?? event.category ?? "Uncategorized",
    categoryColor: event.categoryColor ?? event.category_color ?? "",
  };
}

export const fetchEvents = async (calendarId) => {
  if (!calendarId) {
    throw new Error("calendarId is required to fetch events");
  }
  
  try {
    const response = await api.get(`/events?calendarId=${calendarId}`);
    return response.data.map(mapEventFromApi);
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
    return mapEventFromApi(response.data);
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
