import axios from "axios";

// Local utility function to avoid circular dependency with auth.ts
const clearAuthAndRedirect = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
  
  // Dispatch event to open login modal instead of redirecting
  const event = new CustomEvent('open-auth-modal', { 
    detail: { type: 'login' } 
  });
  window.dispatchEvent(event);
};

// Define which endpoints should be considered protected (require authentication)
const protectedEndpoints = [
  '/profile',
  '/change-password',
  '/upload-profile-picture'
  // Add other protected endpoints here
];

// Define endpoints that require authentication but shouldn't auto-redirect on 401
const apiEndpointsWithAuth = [
  // Removing these endpoints as they should work without authentication
  // '/global-average-medicine-price',
  // '/countries-average-prices'
];

// Check if a URL path is for a protected endpoint
const isProtectedEndpoint = (url: string): boolean => {
  if (!url) return false;
  return protectedEndpoints.some(endpoint => url.includes(endpoint));
};

// Check if a URL is for an endpoint that uses auth but shouldn't redirect
const isAuthEndpoint = (url: string): boolean => {
  if (!url) return false;
  return apiEndpointsWithAuth.some(endpoint => url.includes(endpoint));
};

// Setup default axios instance with base URL
export const api = axios.create({
  baseURL: "http://localhost:3001/api",
  timeout: 10000,
  withCredentials: true
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
    if (error.response?.status === 401 && error.config) {
      // If it's a protected endpoint, redirect to login
      if (isProtectedEndpoint(error.config.url)) {
        clearAuthAndRedirect();
      }
      
      // For auth endpoints that shouldn't redirect, we'll just log and continue
      if (isAuthEndpoint(error.config.url)) {
        console.warn(`Auth error on ${error.config.url} but not redirecting`);
      }
    }
    return Promise.reject(error);
  }
);

// Cache for currency rates
const currencyRateCache: Record<string, { rate: number; timestamp: number }> = {};
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

// Helper function to fetch currency conversion rates
export const getCurrencyRate = async (fromCurrency: string, toCurrency: string = 'USD'): Promise<number> => {
  // Default to 1 if converting to the same currency
  if (fromCurrency === toCurrency) return 1;
  
  // Check cache first
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cachedRate = currencyRateCache[cacheKey];
  const now = Date.now();
  
  if (cachedRate && (now - cachedRate.timestamp < CACHE_EXPIRY)) {
    return cachedRate.rate;
  }
  
  try {
    // Using Open Exchange Rates API (you need to replace with your actual API)
    // Free alternative: https://openexchangerates.org/ (requires registration)
    const response = await axios.get(`https://open.er-api.com/v6/latest/${fromCurrency}`);
    
    if (response.data && response.data.rates && response.data.rates[toCurrency]) {
      const rate = response.data.rates[toCurrency];
      
      // Cache the result
      currencyRateCache[cacheKey] = {
        rate,
        timestamp: now
      };
      
      return rate;
    }
    
    throw new Error(`Could not get conversion rate from ${fromCurrency} to ${toCurrency}`);
  } catch (error) {
    console.error('Currency conversion error:', error);
    // Return a default/fallback rate 
    // For important apps, you might want to throw an error instead
    return 1;
  }
};