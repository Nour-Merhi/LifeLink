import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true, // 🔥 THIS IS CRITICAL
  headers: {
    Accept: "application/json",
  },
});

// Helper function to get cookie by name
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Request interceptor to add X-XSRF-TOKEN header from cookie
api.interceptors.request.use(
  (config) => {
    const token = getCookie('XSRF-TOKEN');
    if (token) {
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

