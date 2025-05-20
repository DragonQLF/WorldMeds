
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get currency symbol for a given currency code
 * @param currencyCode Currency code (e.g., USD, EUR)
 * @returns Currency symbol (e.g., $, €)
 */
export function getCurrencySymbol(currencyCode: string = 'USD'): string {
  const code = currencyCode.toUpperCase();
  const symbols: Record<string, string> = {
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
  
  return symbols[code] || code;
}

/**
 * Format price with proper currency symbol and decimals
 * Always display full package price in given currency
 * @param amount Amount to format (package price)
 * @param currencyCode Currency code (e.g., USD, EUR)
 * @returns Formatted price string
 */
export function formatPrice(amount: number | null | undefined, currencyCode: string = 'USD'): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'N/A';
  }
  
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${Number(amount).toFixed(2)}`;
}

/**
 * Calculate percentage change between two values
 * @param current Current value
 * @param previous Previous value
 * @returns Percentage change or null if calculation isn't possible
 */
export function calculatePercentChange(current?: number, previous?: number): number | null {
  if (typeof current !== 'number' || typeof previous !== 'number' || 
      isNaN(current) || isNaN(previous) || previous === 0) {
    return null;
  }
  
  const change = ((current - previous) / previous) * 100;
  
  // Limit to reasonable values (-50% to +50%)
  if (Math.abs(change) > 50) {
    return null;
  }
  
  return change;
}
