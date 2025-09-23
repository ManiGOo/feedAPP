// src/utils/api.js
import axios from "axios";

// Base URL from environment variable (includes /api)
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Attach access token automatically to all requests
api.interceptors.request.use((config) => {
  const access = localStorage.getItem("accessToken");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Handle token expiration → refresh & retry once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

        // Save new access token
        localStorage.setItem("accessToken", res.data.accessToken);

        // Retry original request with new token
        original.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(original);
      } catch (err) {
        console.error("Token refresh failed:", err);
        // Clear tokens & redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Fetch another user's profile by ID
 * @param {string | number} userId
 * @returns {Promise} resolves with { user, posts }
 */
api.getUserProfile = async (userId) => {
  try {
    const res = await api.get(`/users/${userId}`);
    return res.data; // { user, posts }
  } catch (err) {
    console.error("Failed to fetch user profile:", err);
    throw err;
  }
};

export default api;
