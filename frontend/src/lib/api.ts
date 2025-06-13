import axios, { AxiosError, AxiosHeaders } from "axios";

// Use the environment variable defined in the .env file
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Primary and fallback currency API URLs
const PRIMARY_CURRENCY_API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
const FALLBACK_CURRENCY_API_URL = 'https://latest.currency-api.pages.dev/v1/currencies/usd.json';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate instance for public endpoints that don't require authentication
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to format a date string to YYYY-MM-DD
const formatDateForAPI = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
};

// Function to format a month string to YYYY-MM
const formatMonthForAPI = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  return `${year}-${month}`;
};

// Cache for currency rates to avoid repeated API calls
let currencyRatesCache: {
  timestamp: number;
  rates: Record<string, number>;
  date?: string;
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
export const fetchCurrencyRates = async (date?: string): Promise<Record<string, number>> => {
  try {
    // Check if we have valid cached rates for the requested date
    if (currencyRatesCache && 
        (Date.now() - currencyRatesCache.timestamp < CACHE_DURATION) && 
        (!date || currencyRatesCache.date === date)) {
      return currencyRatesCache.rates;
    }
    
    // If no valid cache, fetch from the backend first
    try {
      const response = await api.get('/currency-rates', { params: { date } });
      if (response.data && Object.keys(response.data).length > 0) {
        currencyRatesCache = {
          timestamp: Date.now(),
          rates: response.data,
          date: date || 'latest'
        };
        return response.data;
      }
      console.warn('Backend returned no/empty data for currency rates (frontend).');
    } catch (backendError) {
      console.warn('Backend currency rates fetch failed, trying direct API...', backendError);
    }
    
    // If backend fails, try primary API
    const primaryUrl = date 
      ? `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/usd.json`
      : PRIMARY_CURRENCY_API_URL;
      
    try {
      const primaryResponse = await axios.get(primaryUrl);
      if (primaryResponse.data && primaryResponse.data.usd) {
        const normalizedRates: Record<string, number> = {};
        Object.entries(primaryResponse.data.usd).forEach(([key, value]) => {
          normalizedRates[key.toLowerCase()] = value as number;
        });
        
        currencyRatesCache = {
          timestamp: Date.now(),
          rates: normalizedRates,
          date: date || 'latest'
        };
        
        return normalizedRates;
      }
      throw new Error('Invalid response format from primary currency API');
    } catch (primaryError) {
      console.warn('Primary API failed, trying fallback...', primaryError);
      
      // If primary API fails, try fallback
      const fallbackUrl = date 
        ? `https://${date}.currency-api.pages.dev/v1/currencies/usd.json`
        : FALLBACK_CURRENCY_API_URL;
        
      const fallbackResponse = await axios.get(fallbackUrl);
      if (fallbackResponse.data && fallbackResponse.data.usd) {
        const normalizedRates: Record<string, number> = {};
        Object.entries(fallbackResponse.data.usd).forEach(([key, value]) => {
          normalizedRates[key.toLowerCase()] = value as number;
        });
        
        currencyRatesCache = {
          timestamp: Date.now(),
          rates: normalizedRates,
          date: date || 'latest'
        };
        
        return normalizedRates;
      }
      throw new Error('Invalid response format from fallback currency API');
    }
  } catch (error) {
    console.error('Error fetching currency rates (frontend):', error instanceof Error ? error.message : error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Axios error details (frontend):', {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
      });
    }
    
    console.warn('Falling back to static currency rates (frontend)');
    return STATIC_CURRENCY_RATES;
  }
};

// Function to get currency conversion rate with better handling of lower/uppercase
export const getCurrencyRate = async (fromCurrency: string, toCurrency: string, date?: string): Promise<number> => {
  try {
    // Standard format for currency codes - use lowercase for API compatibility
    const from = fromCurrency.toLowerCase();
    const to = toCurrency.toLowerCase();
    
    // If same currency, return 1
    if (from === to) {
      return 1;
    }
    
    // Fetch rates from the API or cache
    const rates = await fetchCurrencyRates(date);
    
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
export const convertCurrency = async (
  amount: number, 
  fromCurrency: string, 
  toCurrency: string, 
  date?: string
): Promise<number> => {
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
    const rate = await getCurrencyRate(fromCurrency, toCurrency, date);
    const convertedAmount = numericAmount * rate;
    // Format to 2 decimal places and convert back to number
    return parseFloat(convertedAmount.toFixed(2));
  } catch (error) {
    console.error('Error converting currency:', error);
    return numericAmount; // Return original amount if conversion fails
  }
};

// Improved function to convert to USD with better handling for all currencies
export const convertToUSD = async (
  amount: number, 
  fromCurrency: string, 
  date?: string
): Promise<number> => {
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
    return parseFloat((numericAmount * rate).toFixed(2));
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
    const response = await api.get('/comparison/available-months');
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

// --- Public API Calls (no authentication required) ---

// Search countries endpoint - Using the correct backend endpoint /api/search/countries
// and handling date filters
export const searchCountries = async (
  query: string,
  filters: { month?: string | null; date?: string | null; start?: string | null; end?: string | null } = {}
) => {
  try {
    const params: any = {};
    if (query) {
      params.q = query;
    }
    
    // Add date filters if present
    if (filters.date) {
      params.date = formatDateForAPI(filters.date);
    } else if (filters.month) {
      params.month = formatMonthForAPI(filters.month);
    } else if (filters.start) {
        params.start = formatDateForAPI(filters.start);
        if (filters.end) {
            params.end = formatDateForAPI(filters.end);
        }
    }

    const response = await publicApi.get('/search/countries', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching countries:', error);
    throw error; // Re-throw to be handled by calling component
  }
};

// Search medicines endpoint
export const searchMedicines = async (query: string) => {
  try {
    const response = await publicApi.get('/search/medicines', { params: { q: query } });
    return response.data;
  } catch (error) {
    console.error('Error searching medicines:', error);
    throw error;
  }
};

// Get all countries endpoint - also using publicApi and handling date filters
export const getAllCountries = async (
  filters: { month?: string | null; date?: string | null; start?: string | null; end?: string | null } = {}
) => {
  try {
    // The backend /api/countries endpoint already handles month/date filtering
    const params: any = {};
    if (filters.date) {
      params.date = formatDateForAPI(filters.date);
    } else if (filters.month) {
      params.month = formatMonthForAPI(filters.month);
    } else if (filters.start) {
        params.start = formatDateForAPI(filters.start);
        if (filters.end) {
            params.end = formatDateForAPI(filters.end);
        }
    }
    
    // Use publicApi for this endpoint as it does not require authentication
    const response = await publicApi.get('/countries', { params });
    
    // The backend returns country objects with id, name, currency, averagePrice, previousPrice, medicineCount
    // We should add iso_code to this type definition if it's returned by the backend now
    return response.data;
  } catch (error) {
    console.error('Error fetching all countries:', error);
    throw error; // Re-throw to be handled by calling component
  }
};

// Get all medicines endpoint - using publicApi
export const getAllMedicines = async () => {
  try {
    const response = await publicApi.get('/medicines');
    return response.data;
  } catch (error) {
    console.error('Error fetching all medicines:', error);
    throw error;
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
