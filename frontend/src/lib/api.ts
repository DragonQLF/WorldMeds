import axios from "axios";

// Local utility function to avoid circular dependency with auth.ts
const clearAuthAndRedirect = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
  window.location.href = "/auth/login";
};

// Define which endpoints should be considered protected (require authentication)
const protectedEndpoints = [
  '/profile',
  '/change-password',
  '/upload-profile-picture'
  // Add other protected endpoints here
];

// Check if a URL path is for a protected endpoint
const isProtectedEndpoint = (url: string): boolean => {
  if (!url) return false;
  return protectedEndpoints.some(endpoint => url.includes(endpoint));
};

export const api = axios.create({
  baseURL: "http://localhost:3001/api",
  timeout: 10000,
  withCredentials: true, // This is fine, but the backend needs to set specific CORS headers
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 for protected endpoints
    if (error.response?.status === 401 && error.config && isProtectedEndpoint(error.config.url)) {
      clearAuthAndRedirect();
    }
    return Promise.reject(error);
  }
);