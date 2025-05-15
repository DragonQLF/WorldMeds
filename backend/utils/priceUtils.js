/**
 * Utility functions for price calculations across the application
 */

// Import node-fetch properly for Node.js environment
//  const fetch = require('node-fetch'); // Ensure node-fetch is used

/**
 * Formats the price with proper decimal places
 * @param {number} price - The price to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number|null} Formatted price or null if price is invalid
 */
const formatPrice = (price, decimals = 2) => {
  if (price === null || price === undefined || isNaN(parseFloat(price))) {
    return null;
  }
  // Convert to number, fix decimal places, then convert back to number
  return parseFloat(parseFloat(price).toFixed(decimals));
};

/**
 * Cache for currency rates to avoid repeated API calls
 */
let currencyRatesCache = {
  timestamp: 0,
  rates: {}
};

/**
 * Cache duration in milliseconds (4 hours)
 */
const CACHE_DURATION = 4 * 60 * 60 * 1000;

/**
 * Fetches currency rates from the API
 * @returns {Promise<Object>} Object with currency rates
 */
const fetchCurrencyRates = async () => {
  try {
    // Check if we have valid cached rates
    if (currencyRatesCache.timestamp && (Date.now() - currencyRatesCache.timestamp < CACHE_DURATION)) {
      console.log('Using cached currency rates (backend)');
      return currencyRatesCache.rates;
    }
    
    console.log('Fetching fresh currency rates from API (backend using node-fetch)');
    // Use node-fetch
    const response = await fetch('https://latest.currency-api.pages.dev/v1/currencies/usd.json');
    
    if (!response.ok) {
      throw new Error(`API response error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data && data.usd) {
      // Store in cache
      currencyRatesCache = {
        timestamp: Date.now(),
        rates: data.usd
      };
      console.log('Updated currency rate cache (backend)');
      
      // Update the static rates with the new data for those currencies that exist
      Object.keys(STATIC_CURRENCY_RATES).forEach(currency => {
        if (data.usd[currency.toLowerCase()]) {
          STATIC_CURRENCY_RATES[currency.toLowerCase()] = data.usd[currency.toLowerCase()];
        }
      });
      
      return data.usd;
    } else {
      throw new Error('Invalid response format from currency API (backend)');
    }
  } catch (error) {
    console.error('Error in fetchCurrencyRates (backend):', error.message, error.stack);
    
    // Fall back to static rates if API call fails
    console.log('Falling back to static currency rates due to fetch error (backend).');
    return STATIC_CURRENCY_RATES;
  }
};

/**
 * Static currency rates for fallback when API is unavailable
 */
const STATIC_CURRENCY_RATES = {
  usd: 1,
  eur: 0.89075882,
  gbp: 0.75310784,
  jpy: 146.11858687,
  cad: 1.39367599,
  aud: 1.55672563,
  inr: 84.96747214,
  cny: 7.22856714,
  brl: 5.65050165,
  mxn: 19.45792876,
  clp: 934.00426292,
  ars: 1128.98263533,
  dzd: 133.95,
  aoa: 825.00,
  rub: 92.50,
  krw: 1350.40
};

/**
 * Prepares price data for frontend display with both local and USD values
 * Always uses package price, not per-pill pricing
 * @param {number} price - Original price in local currency
 * @param {string} localCurrency - Local currency code
 * @returns {object} Object with price data ready for frontend
 */
const preparePriceData = async (price, localCurrency) => {
  // Ensure we have valid inputs
  const validPrice = price !== undefined && price !== null && !isNaN(parseFloat(price));
  
  // Default response when inputs are invalid
  if (!validPrice) {
    return {
      originalPrice: validPrice ? formatPrice(parseFloat(price)) : null,
      localCurrency: localCurrency || 'USD',
      needsConversion: localCurrency && localCurrency.toLowerCase() !== 'usd'
    };
  }

  // Calculate price using validated values
  const numericPrice = parseFloat(price);
  
  // Always include USD converted price in the response
  const usdPrice = localCurrency && localCurrency.toLowerCase() !== 'usd' ? 
    await convertToUSD(numericPrice, localCurrency) : numericPrice;
  
  return {
    originalPrice: formatPrice(numericPrice),
    usdPrice: formatPrice(usdPrice),
    localCurrency: localCurrency || 'USD',
    needsConversion: localCurrency && localCurrency.toLowerCase() !== 'usd'
  };
};

/**
 * Performs currency conversion from local currency to USD
 * @param {number} amount - Amount in local currency
 * @param {string} fromCurrency - Source currency code
 * @returns {number} Converted amount in USD
 */
const convertToUSD = async (amount, fromCurrency) => {
  // Currency codes should always be lowercase for consistency with the API
  const currency = (fromCurrency?.toLowerCase() || 'usd');
  
  // Validate inputs
  if (amount === null || amount === undefined || isNaN(parseFloat(amount))) {
    console.warn('Invalid amount for conversion (backend):', amount);
    return 0;
  }
  
  // Force numeric conversion
  const numericAmount = parseFloat(amount);
  
  // If already USD, return original amount
  if (currency === 'usd') {
    return numericAmount;
  }
  
  try {
    // Get the latest rates from the API
    const rates = await fetchCurrencyRates();
    
    // If currency not found, return original amount with warning
    if (!rates[currency]) {
      console.warn(`Currency conversion rate not found for ${currency} (backend), using 1:1 rate`);
      return numericAmount;
    }
    
    // The API provides values from USD to other currencies
    // So to convert from other currencies to USD, we need to divide by the rate
    const convertedAmount = numericAmount / rates[currency];
    return formatPrice(convertedAmount);
    
  } catch (error) {
    console.error('Error in currency conversion (backend):', error);
    
    // Fall back to static rates
    if (STATIC_CURRENCY_RATES[currency]) {
      const convertedAmount = numericAmount / STATIC_CURRENCY_RATES[currency];
      return formatPrice(convertedAmount);
    }
    
    return numericAmount; // Return original amount if conversion fails
  }
};

module.exports = {
  formatPrice,
  preparePriceData,
  convertToUSD,
  fetchCurrencyRates
};
