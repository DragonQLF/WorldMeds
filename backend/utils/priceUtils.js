/**
 * Utility functions for price calculations across the application
 */

// Import node-fetch properly for Node.js environment
// const fetch = require('node-fetch'); // Ensure node-fetch is used (v2 for CJS)

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
  rates: {},
  cacheHits: 0
};

/**
 * Cache duration in milliseconds (4 hours)
 */
const CACHE_DURATION = 4 * 60 * 60 * 1000;

/**
 * Fetches currency rates from the API
 * @param {string} [date] - Optional date in YYYY-MM-DD format. If not provided, uses latest rates
 * @returns {Promise<Object>} Object with currency rates
 */
const fetchCurrencyRates = async (date) => {
  try {
    // Check if we have valid cached rates for the requested date
    if (currencyRatesCache.timestamp && 
        (Date.now() - currencyRatesCache.timestamp < CACHE_DURATION) && 
        (!date || currencyRatesCache.date === date)) {
      currencyRatesCache.cacheHits++;
      process.stdout.write(`\rUsing cached currency rates (${currencyRatesCache.cacheHits} times)`);
      return currencyRatesCache.rates;
    }
    
    // Reset cache hits counter when fetching new rates
    currencyRatesCache.cacheHits = 0;
    process.stdout.write('\rFetching fresh currency rates from API...');
    
    // Primary URL using jsdelivr
    const primaryUrl = date 
      ? `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/usd.json`
      : 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
    
    // Fallback URL using Cloudflare
    const fallbackUrl = date 
      ? `https://${date}.currency-api.pages.dev/v1/currencies/usd.json`
      : 'https://latest.currency-api.pages.dev/v1/currencies/usd.json';
    
    // Try primary URL first
    try {
      const response = await fetch(primaryUrl);
      if (response.ok) {
        const data = await response.json();
        if (data && data.usd) {
          // Store in cache
          currencyRatesCache = {
            timestamp: Date.now(),
            rates: data.usd,
            cacheHits: 0,
            date: date || 'latest'
          };
          process.stdout.write('\rCurrency rates updated successfully from primary API\n');
          return data.usd;
        }
      }
      throw new Error(`Primary API response error: ${response.status} ${response.statusText}`);
    } catch (primaryError) {
      console.warn('Primary API failed, trying fallback...', primaryError.message);
      
      // Try fallback URL
      const fallbackResponse = await fetch(fallbackUrl);
      if (!fallbackResponse.ok) {
        throw new Error(`Fallback API response error: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      if (fallbackData && fallbackData.usd) {
        // Store in cache
        currencyRatesCache = {
          timestamp: Date.now(),
          rates: fallbackData.usd,
          cacheHits: 0,
          date: date || 'latest'
        };
        process.stdout.write('\rCurrency rates updated successfully from fallback API\n');
        return fallbackData.usd;
      }
      throw new Error('Invalid response format from fallback API');
    }
  } catch (error) {
    process.stdout.write('\rError in fetchCurrencyRates\n');
    console.error('Error details:', error.message);
    
    // Fall back to static rates if both APIs fail
    process.stdout.write('\rFalling back to static currency rates\n');
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
 * Converts a single amount to USD using cached rates
 * @param {number} amount - Amount in local currency
 * @param {string} fromCurrency - Source currency code
 * @param {string} [date] - Optional date for historical rates
 * @returns {Promise<number>} Converted amount in USD
 */
const convertToUSD = async (amount, fromCurrency, date) => {
  try {
    // Get rates once for the conversion
    const rates = await fetchCurrencyRates(date);
    
    const currency = (fromCurrency?.toLowerCase() || 'usd');
    const numericAmount = parseFloat(amount);
    
    if (numericAmount === null || numericAmount === undefined || isNaN(numericAmount)) {
      console.warn('Invalid amount for conversion:', amount);
      return 0;
    }
    
    if (currency === 'usd') return numericAmount;
    
    if (!rates[currency]) {
      console.warn(`Currency conversion rate not found for ${currency}, using 1:1 rate`);
      return numericAmount;
    }
    
    // Since rates are USD to currency, we divide to get currency to USD
    return formatPrice(numericAmount / rates[currency]);
  } catch (error) {
    console.error('Error in currency conversion:', error);
    return parseFloat(amount) || 0;
  }
};

module.exports = {
  formatPrice,
  preparePriceData,
  convertToUSD,
  fetchCurrencyRates
};

