// src/services/userService.js
import axios from 'axios';

const API_URL = 'http://localhost:3001';  // Adjust if needed

// Register a new user
export const registerUser = async (username, password) => {
  const response = await axios.post(`${API_URL}/register`, { username, password });
  return response.data;
};

// Log in an existing user
export const loginUser = async (username, password) => {
  const response = await axios.post(`${API_URL}/login`, { username, password });
  
  // Save token and username in localStorage
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('username', response.data.username);

  return response.data;
};

// Log out the user
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
};

// Get current auth token
export const getToken = () => localStorage.getItem('token');

// Get current username (optional)
export const getUsername = () => localStorage.getItem('username');

// Check if user is logged in
export const isLoggedIn = () => !!localStorage.getItem('token');
