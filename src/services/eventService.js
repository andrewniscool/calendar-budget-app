// src/services/eventService.js
import axios from 'axios';

const API_URL = 'http://localhost:3001/events';

// Fetch events from the backend
export const fetchEvents = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

// Save a new or updated event to the backend
export const saveEvent = async (eventData) => {
  try {
    const method = eventData.id ? 'PUT' : 'POST'; // PUT for update, POST for new event
    const url = eventData.id ? `${API_URL}/${eventData.id}` : API_URL;
    const response = await axios({
      method,
      url,
      data: eventData,
    });
    return response.data;
  } catch (error) {
    console.error("Error saving event:", error);
    throw error;
  }
};

// Delete an event from the backend
export const deleteEvent = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};
