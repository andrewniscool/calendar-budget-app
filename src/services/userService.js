import { api } from './apiClient';

export async function registerUser(username, email, password) {
  const response = await api.post('/auth/register', { username, email, password });
  return response.data;
}

export async function loginUser(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response.data.user;
}

export async function logoutUser() {
  await api.post('/auth/logout');
}

export async function getSession() {
  const response = await api.get('/auth/session');
  return response.data.user;
}

export async function verifyEmail(token) {
  const response = await api.post('/auth/verify-email', { token });
  return response.data;
}

export async function resendVerification(email) {
  const response = await api.post('/auth/resend-verification', { email });
  return response.data;
}

export async function forgotPassword(email) {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword(token, password) {
  const response = await api.post('/auth/reset-password', { token, password });
  return response.data;
}

export async function enrollLegacyEmail(username, password, email) {
  const response = await api.post('/auth/legacy-email', { username, password, email });
  return response.data;
}
