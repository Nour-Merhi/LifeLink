// API configuration - uses environment variable or falls back to Railway URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://lifelink-laravel-app-production.up.railway.app';

// Ensure it doesn't end with a slash
export const getApiBaseUrl = () => {
  const url = API_BASE_URL.replace(/\/$/, '');
  return url;
};
