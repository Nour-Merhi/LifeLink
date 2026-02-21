import axios from "axios";

export const AUTH_TOKEN_STORAGE_KEY = "lifelink_auth_token";

const api = axios.create({
  // Prefer env in Vercel builds; fall back to Railway URL for local dev.
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://lifelink-laravel-app-production.up.railway.app",
  // We use Bearer tokens for production cross-site auth (Vercel -> Railway),
  // so we do NOT rely on cookies/CSRF.
  withCredentials: false,
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    return Promise.reject(error);
  }
);

export function setAuthToken(token) {
  if (!token) return;
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export default api;

