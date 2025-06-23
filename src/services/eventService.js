import axios from "axios";

const API_URL = "http://localhost:3001/events";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

export const fetchEvents = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeaders() });
  return response.data;
};

export const saveEvent = async (eventData) => {
  const method = eventData.id ? "PUT" : "POST";
  const url = eventData.id ? `${API_URL}/${eventData.id}` : API_URL;
  const response = await axios({
    method,
    url,
    data: eventData,
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteEvent = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return response.data;
};
