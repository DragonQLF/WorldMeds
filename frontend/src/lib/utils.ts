
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
