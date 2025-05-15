import axios, { AxiosError, AxiosHeaders } from "axios";

// Use the environment variable defined in the .env file
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const CURRENCY_API_URL = import.meta.env.VITE_CURRENCY_API_URL || 'https://latest.currency-api.pages.dev/v1/currencies/usd.json';

console.log('Using API URL:', API_BASE_URL);
console.log('Using Currency API URL:', CURRENCY_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cache for currency rates to avoid repeated API calls
let currencyRatesCache: {
  timestamp: number;
  rates: Record<string, number>;
} | null = null;

// Cache duration in milliseconds (4 hours)
const CACHE_DURATION = 4 * 60 * 60 * 1000;

// Static currency rates for fallback when API is unavailable
const STATIC_CURRENCY_RATES: Record<string, number> = {
  'usd': 1,
  'eur': 0.89075882,
  'gbp': 0.75310784,
  'jpy': 146.11858687,
  'cad': 1.39367599,
  'aud': 1.55672563,
  'inr': 84.96747214,
  'cny': 7.22856714,
  'brl': 5.65050165,
  'mxn': 19.45792876,
  'clp': 934.00426292,
  'ars': 1128.98263533,
  'dzd': 133.95,
  'aoa': 825.00,
  'rub': 92.50,
  'krw': 1350.40
};

// Function to get currency rates from the new API endpoint - export for use in other components
export const fetchCurrencyRates = async (): Promise<Record<string, number>> => {
  try {
    // Check if we have valid cached rates
    if (currencyRatesCache && (Date.now() - currencyRatesCache.timestamp < CACHE_DURATION)) {
      console.log('Using cached currency rates (frontend)');
      return currencyRatesCache.rates;
    }
    
    // If no valid cache, fetch from the API
    console.log('Fetching currency rates: Trying backend first (frontend)');
    
    try {
      const backendResponse = await api.get('/currency-rates');
      if (backendResponse.data && Object.keys(backendResponse.data).length > 0) {
        currencyRatesCache = {
          timestamp: Date.now(),
          rates: backendResponse.data
        };
        console.log('Updated currency rate cache from backend (frontend)');
        return backendResponse.data;
      }
      console.warn('Backend returned no/empty data for currency rates (frontend).');
    } catch (backendError) {
      console.warn('Failed to fetch rates from backend, trying direct API (frontend). Error:', backendError);
    }
    
    console.log('Fetching fresh currency rates from direct API (frontend)');
    const response = await axios.get(CURRENCY_API_URL);
    
    if (response.data && response.data.usd) {
      const normalizedRates: Record<string, number> = {};
      Object.entries(response.data.usd).forEach(([key, value]) => {
        normalizedRates[key.toLowerCase()] = value as number;
      });
      
      currencyRatesCache = {
        timestamp: Date.now(),
        rates: normalizedRates
      };
      
      console.log('Updated currency rate cache from direct API (frontend)');
      return normalizedRates;
    } else {
      throw new Error('Invalid response format from direct currency API (frontend)');
    }
  } catch (error) {
    console.error('Error fetching currency rates (frontend):', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Axios error details (frontend):', {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data,
      });
      if (axiosError.response?.status === 401) {
        console.error("Received 401 Unauthorized from direct currency API. Check if API key/access changed.");
      }
    }
    
    console.warn('Falling back to static currency rates (frontend)');
    return STATIC_CURRENCY_RATES;
  }
};

// Function to get currency conversion rate with better handling of lower/uppercase
export const getCurrencyRate = async (fromCurrency: string, toCurrency: string): Promise<number> => {
  try {
    // Standard format for currency codes - use lowercase for API compatibility
    const from = fromCurrency.toLowerCase();
    const to = toCurrency.toLowerCase();
    
    // If same currency, return 1
    if (from === to) {
      return 1;
    }
    
    // Fetch rates from the API or cache
    const rates = await fetchCurrencyRates();
    
    // For USD to any currency, we can use rates directly
    if (from === 'usd') {
      // Check both lowercase and uppercase variations in case API returns mixed case
      if (rates[to]) {
        return rates[to];
      } else if (STATIC_CURRENCY_RATES[to]) {
        console.warn(`No API rate found for USD to ${to}, using static fallback`);
        return STATIC_CURRENCY_RATES[to];
      } else {
        console.warn(`No conversion rate found for USD to ${to}, using 1:1 rate`);
        return 1;
      }
    }
    
    // For any currency to USD, we invert the rate
    if (to === 'usd') {
      // Try to find rate using lowercase key
      const rate = rates[from] || STATIC_CURRENCY_RATES[from];
      
      if (rate) {
        // Need to invert since rates are in terms of USD
        return 1 / rate;
      } else {
        console.warn(`No conversion rate found for ${from} to USD, using 1:1 rate`);
        return 1;
      }
    }
    
    // For cross-currency (neither is USD), convert through USD
    let fromRate = rates[from];
    let toRate = rates[to];
    
    // Fall back to static rates if needed
    if (!fromRate) {
      fromRate = STATIC_CURRENCY_RATES[from];
      console.warn(`Using static rate for ${from}: ${fromRate}`);
    }
    
    if (!toRate) {
      toRate = STATIC_CURRENCY_RATES[to];
      console.warn(`Using static rate for ${to}: ${toRate}`);
    }
    
    if (fromRate && toRate) {
      // Convert from source currency to USD, then USD to target currency
      return toRate / fromRate;
    } else {
      console.warn(`Missing rates for ${from} or ${to}, using 1:1 rate`);
      return 1;
    }
  } catch (error) {
    console.error('Error in currency conversion:', error);
    return 1; // Safe default
  }
};

// Improved function to convert currency with better error handling
export const convertCurrency = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    console.warn('Invalid amount for conversion:', amount);
    return 0;
  }
  
  // Force numeric conversion to avoid string concatenation issues
  const numericAmount = Number(amount);
  
  if (!fromCurrency || !toCurrency) {
    console.warn('Missing currency code for conversion');
    return numericAmount;
  }
  
  if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) {
    return numericAmount;
  }
  
  try {
    const rate = await getCurrencyRate(fromCurrency, toCurrency);
    const convertedAmount = numericAmount * rate;
    // Format to 2 decimal places and convert back to number
    return parseFloat(convertedAmount.toFixed(2));
  } catch (error) {
    console.error('Error converting currency:', error);
    return numericAmount; // Return original amount if conversion fails
  }
};

// Improved function to convert to USD with better handling for all currencies
export const convertToUSD = async (amount: number, fromCurrency: string): Promise<number> => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    console.warn('Invalid amount for conversion:', amount);
    return 0;
  }
  
  // Force numeric conversion to avoid string concatenation issues
  const numericAmount = Number(amount);
  
  if (!fromCurrency || !fromCurrency.trim()) {
    console.warn('Missing source currency for conversion');
    return numericAmount;
  }
  
  // Standardize currency code - use lowercase for API compatibility
  const currency = fromCurrency.toLowerCase();
  
  // If already USD, return original amount
  if (currency === 'usd') {
    return numericAmount;
  }
  
  try {
    const rate = await getCurrencyRate(currency, 'usd');
    const convertedAmount = numericAmount * rate;
    return parseFloat(convertedAmount.toFixed(2));
  } catch (error) {
    console.error('Error converting currency:', error);
    return numericAmount; // Return original amount if conversion fails
  }
};

// Helper function to determine if a currency is USD or USD equivalent
export const isUSDEquivalent = (currency: string | undefined): boolean => {
  if (!currency) return false;
  const usdEquivalents = ['USD', 'US$', '$', 'usd'];
  return usdEquivalents.includes(currency.toUpperCase()) || usdEquivalents.includes(currency.toLowerCase());
};

// Helper function to format currency with symbol
export const formatCurrencyWithSymbol = (amount: number, currency: string): string => {
  if (isNaN(amount)) return 'N/A';
  
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'BRL': 'R$',
    'MXN': '$',
    'ARS': '$',
    'CLP': '$',
    'CAD': 'C$',
    'AUD': 'A$'
  };
  
  const symbol = currencySymbols[currency.toUpperCase()] || currency;
  return `${symbol}${amount.toFixed(2)}`;
};

// Function to get available months for the date picker
export const getAvailableMonths = async (): Promise<string[]> => {
  try {
    const response = await api.get('/available-months');
    if (response.data && Array.isArray(response.data)) {
      return response.data.sort((a, b) => b.localeCompare(a)); // Sort in descending order (newest first)
    }
    return [];
  } catch (error) {
    console.error('Error fetching available months:', error);
    // Return current month as fallback
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return [`${year}-${month}`];
  }
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      // Create a properly typed header
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors globally
    if (error.response && error.response.status === 401) {
      // Redirect to login or refresh token
      localStorage.removeItem("auth_token");
      // window.location.href = "/login"; // Commenting out for now to avoid refresh loops during debugging
      console.error("Global 401 Error: Auth token removed. User should be redirected to login.");
    }
    return Promise.reject(error);
  }
);

export { api };
