export const getCurrencySymbol = (currencyCode: string): string => {
  const currencySymbols: Record<string, string> = {
    // Major world currencies
    'USD': '$',        // US Dollar
    'EUR': '€',        // Euro
    'GBP': '£',        // British Pound
    'JPY': '¥',        // Japanese Yen
    'CNY': '¥',        // Chinese Yuan
    
    // Latin America
    'BRL': 'R$',       // Brazilian Real
    'MXN': '$',        // Mexican Peso
    'ARS': '$',        // Argentine Peso
    'CLP': '$',        // Chilean Peso
    'COP': '$',        // Colombian Peso
    'PEN': 'S/',       // Peruvian Sol
    'UYU': '$U',       // Uruguayan Peso
    'VES': 'Bs.',      // Venezuelan Bolivar
    'BOB': 'Bs.',      // Bolivian Boliviano
    'PYG': '₲',        // Paraguayan Guarani
    
    // Other currencies
    'CAD': 'C$',       // Canadian Dollar
    'CHF': 'Fr.',      // Swiss Franc
    'RUB': '₽',        // Russian Ruble
    'PLN': 'zł',       // Polish Zloty
    'TRY': '₺',        // Turkish Lira
    'SEK': 'kr',       // Swedish Krona
    'NOK': 'kr',       // Norwegian Krone
    'DKK': 'kr',       // Danish Krone
    'CZK': 'Kč',       // Czech Koruna
    'HUF': 'Ft',       // Hungarian Forint
    'RON': 'lei',      // Romanian Leu
    'INR': '₹',        // Indian Rupee
    'KRW': '₩',        // South Korean Won
    'AUD': 'A$',       // Australian Dollar
    'NZD': 'NZ$',      // New Zealand Dollar
    'SGD': 'S$',       // Singapore Dollar
    'HKD': 'HK$',      // Hong Kong Dollar
    'THB': '฿',        // Thai Baht
    'PHP': '₱',        // Philippine Peso
    'IDR': 'Rp',       // Indonesian Rupiah
    'MYR': 'RM',       // Malaysian Ringgit
    'VND': '₫',        // Vietnamese Dong
    'ZAR': 'R',        // South African Rand
    'SAR': '﷼',        // Saudi Riyal
    'AED': 'د.إ',      // UAE Dirham
    'EGP': 'E£',       // Egyptian Pound
    'NGN': '₦',        // Nigerian Naira
    'KES': 'KSh',      // Kenyan Shilling
    'MAD': 'د.م.',     // Moroccan Dirham
  };
  
  return currencySymbols[currencyCode] || currencyCode;
};

export const formatPrice = (
  price: number | null | undefined,
  currencyCode: string,
  showLocalCurrency: boolean,
  conversionRate: number = 1
): string => {
  if (price === undefined || price === null) {
    return "N/A";
  }
  
  // Handle non-numeric values
  if (typeof price !== 'number') {
    const numericPrice = parseFloat(String(price));
    if (isNaN(numericPrice)) {
      return "N/A";
    }
    price = numericPrice;
  }
  
  // Apply conversion if needed
  if (!showLocalCurrency && currencyCode !== 'USD') {
    const convertedPrice = price * conversionRate;
    return convertedPrice.toFixed(2);
  }
  
  return price.toFixed(2);
}; 