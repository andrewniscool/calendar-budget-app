import { api } from "./apiClient";
import { USE_MOCK_API } from "../devConfig";

let mockEvents = [
  {
    id: "dev-event-1",
    title: "Design review",
    date: new Date().toISOString().slice(0, 10),
    timeStart: "09:00",
    timeEnd: "10:00",
    categoryId: "dev-category-work",
    categoryName: "Work",
    categoryColor: "#81B2D9",
    budget: 75,
  },
  {
    id: "dev-event-2",
    title: "Lunch",
    date: new Date().toISOString().slice(0, 10),
    timeStart: "12:00",
    timeEnd: "13:00",
    categoryId: "dev-category-food",
    categoryName: "Food",
    categoryColor: "#FFB88A",
    budget: 18,
  },
];

export const fetchEvents = async (calendarId) => {
  if (!calendarId) {
    throw new Error("calendarId is required to fetch events");
  }

  if (USE_MOCK_API) {
    return mockEvents;
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

  if (USE_MOCK_API) {
    const savedEvent = {
      ...eventData,
      id: eventData.id || `dev-event-${Date.now()}`,
      categoryName: "Uncategorized",
      categoryColor: "",
    };

    if (eventData.id) {
      mockEvents = mockEvents.map((event) =>
        event.id === eventData.id ? { ...event, ...savedEvent } : event
      );
    } else {
      mockEvents = [...mockEvents, savedEvent];
    }

    return savedEvent;
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

  if (USE_MOCK_API) {
    mockEvents = mockEvents.filter((event) => event.id !== id);
    return { id };
  }
  
  try {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error(error.response?.data?.error || "Failed to delete event");
  }
};
