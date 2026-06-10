import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const unsafeMethods = new Set(['post', 'put', 'patch', 'delete']);

function readCookie(name) {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let csrfRequest;
let refreshRequest;

async function ensureCsrf() {
  const current = readCookie('cb_csrf');
  if (current) return current;
  csrfRequest ??= api.get('/auth/csrf', { skipAuthRefresh: true })
    .then((response) => response.data.csrfToken)
    .finally(() => {
      csrfRequest = null;
    });
  return csrfRequest;
}

api.interceptors.request.use(async (config) => {
  if (unsafeMethods.has(config.method) && config.url !== '/auth/csrf') {
    config.headers.set('X-CSRF-Token', await ensureCsrf());
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = original?.url?.startsWith('/auth/login')
      || original?.url?.startsWith('/auth/register')
      || original?.url?.startsWith('/auth/refresh')
      || original?.url?.startsWith('/auth/verify-email')
      || original?.url?.startsWith('/auth/reset-password');

    if (
      error.response?.status !== 401
      || original?._retried
      || original?.skipAuthRefresh
      || isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    original._retried = true;
    try {
      refreshRequest ??= api.post('/auth/refresh', null, { skipAuthRefresh: true })
        .finally(() => {
          refreshRequest = null;
        });
      await refreshRequest;
      return api(original);
    } catch (refreshError) {
      window.dispatchEvent(new Event('auth:expired'));
      return Promise.reject(refreshError);
    }
  }
);
