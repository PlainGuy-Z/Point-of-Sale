/**
 * Currency Formatter Utilities
 * Format, parse, and validate currency values based on application settings
 */

// Type definitions for formatter
export interface CurrencyFormatOptions {
  currency?: string;
  currencyPosition?: 'before' | 'after' | 'before-space' | 'after-space';
  decimalPlaces?: number;
  thousandsSeparator?: 'comma' | 'dot' | 'space' | 'none';
}

// Default format options
export const DEFAULT_OPTIONS: Required<CurrencyFormatOptions> = {
  currency: 'IDR',
  currencyPosition: 'before',
  decimalPlaces: 0,
  thousandsSeparator: 'comma'
};

// Currency symbols mapping
export const CURRENCY_SYMBOLS: Record<string, string> = {
  'IDR': 'Rp',
  'USD': '$',
  'EUR': '€',
  'SGD': 'S$',
  'GBP': '£',
  'JPY': '¥',
  'AUD': 'A$',
  'CAD': 'C$',
  'CHF': 'CHF',
  'CNY': '¥',
  'KRW': '₩',
  'MYR': 'RM',
  'THB': '฿',
  'VND': '₫',
  'PHP': '₱',
  'INR': '₹',
  'BRL': 'R$',
  'RUB': '₽',
  'MXN': '$',
  'ZAR': 'R',
  'AED': 'د.إ',
  'SAR': '﷼'
} as const;

/**
 * Get currency symbol for a given currency code
 */
export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency] || currency;
};

/**
 * Format a number as currency string
 */
export const formatCurrency = (
  amount: number,
  currency: string = DEFAULT_OPTIONS.currency,
  currencyPosition: string = DEFAULT_OPTIONS.currencyPosition,
  decimalPlaces: number = DEFAULT_OPTIONS.decimalPlaces,
  thousandsSeparator: string = DEFAULT_OPTIONS.thousandsSeparator
): string => {
  // Validate input
  if (typeof amount !== 'number' || isNaN(amount)) {
    return formatCurrency(0, currency, currencyPosition, decimalPlaces, thousandsSeparator);
  }

  // Handle negative numbers
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);

  // Format number based on decimal places
  let numberString: string;
  
  if (decimalPlaces === 0) {
    // Round to nearest integer
    numberString = Math.round(absoluteAmount).toString();
  } else {
    // Fixed decimal places
    numberString = absoluteAmount.toFixed(decimalPlaces);
  }

  // Apply thousands separator
  if (thousandsSeparator !== 'none') {
    const parts = numberString.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '';

    // Determine separator character
    let separator: string;
    switch (thousandsSeparator) {
      case 'dot':
        separator = '.';
        break;
      case 'space':
        separator = ' ';
        break;
      default:
        separator = ',';
    }

    // Format integer part with thousands separator
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    numberString = decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  }

  // Get currency symbol
  const symbol = getCurrencySymbol(currency);

  // Apply symbol position
  let formattedCurrency: string;
  
  switch (currencyPosition) {
    case 'before':
      formattedCurrency = `${symbol}${numberString}`;
      break;
    case 'after':
      formattedCurrency = `${numberString}${symbol}`;
      break;
    case 'before-space':
      formattedCurrency = `${symbol} ${numberString}`;
      break;
    case 'after-space':
      formattedCurrency = `${numberString} ${symbol}`;
      break;
    default:
      formattedCurrency = `${symbol}${numberString}`;
  }

  // Add negative sign if needed
  if (isNegative) {
    formattedCurrency = `-${formattedCurrency}`;
  }

  return formattedCurrency;
};

/**
 * Parse currency input string to number
 * Removes formatting and converts to number
 */
export const parseCurrencyInput = (
  value: string,
  thousandsSeparator: string = DEFAULT_OPTIONS.thousandsSeparator
): number => {
  if (!value || typeof value !== 'string') {
    return 0;
  }

  let cleanValue = value.trim();

  // Remove all currency symbols and non-numeric characters (keep minus, dot, comma)
  const currencySymbols = /[^\d.,\-\s]/g;
  cleanValue = cleanValue.replace(currencySymbols, '');

  // Remove thousands separators based on current setting
  if (thousandsSeparator !== 'none') {
    switch (thousandsSeparator) {
      case 'dot':
        // Remove dot thousands separators (keep decimal dots)
        cleanValue = cleanValue.replace(/\.(?=\d{3})/g, '');
        break;
      case 'space':
        // Remove space thousands separators
        cleanValue = cleanValue.replace(/\s/g, '');
        break;
      default: // comma
        // Remove comma thousands separators (keep decimal commas)
        cleanValue = cleanValue.replace(/,(?=\d{3})/g, '');
    }
  }

  // Handle decimal separator - standardize to dot
  const hasComma = cleanValue.includes(',');
  const hasDot = cleanValue.includes('.');
  
  if (hasComma && !hasDot) {
    // If only comma exists, treat it as decimal separator
    cleanValue = cleanValue.replace(',', '.');
  } else if (hasComma && hasDot) {
    // If both exist, the last one is decimal separator
    const lastCommaIndex = cleanValue.lastIndexOf(',');
    const lastDotIndex = cleanValue.lastIndexOf('.');
    
    if (lastCommaIndex > lastDotIndex) {
      // Last comma is decimal, remove other commas
      cleanValue = cleanValue.replace(/,/g, '');
      cleanValue = cleanValue.replace('.', '');
      cleanValue = cleanValue.substring(0, lastCommaIndex) + '.' + cleanValue.substring(lastCommaIndex);
    } else {
      // Last dot is decimal, remove other dots
      cleanValue = cleanValue.replace(/\./g, '');
      cleanValue = cleanValue.replace(',', '');
      cleanValue = cleanValue.substring(0, lastDotIndex) + '.' + cleanValue.substring(lastDotIndex);
    }
  }

  // Remove any remaining non-numeric characters except minus and dot
  cleanValue = cleanValue.replace(/[^\d.\-]/g, '');

  // Parse to number
  const number = parseFloat(cleanValue);
  
  // Return 0 if NaN, otherwise the number
  return isNaN(number) ? 0 : number;
};

/**
 * Format value for input field display
 * Useful for showing formatted numbers in input fields
 */
export const formatCurrencyInput = (
  value: string | number,
  decimalPlaces: number = DEFAULT_OPTIONS.decimalPlaces,
  thousandsSeparator: string = DEFAULT_OPTIONS.thousandsSeparator
): string => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  // Convert to number first
  let numValue: number;
  
  if (typeof value === 'string') {
    numValue = parseCurrencyInput(value, thousandsSeparator);
  } else {
    numValue = value;
  }

  if (isNaN(numValue) || numValue === 0) {
    return '';
  }

  // Format number without currency symbol
  let numberString: string;
  
  if (decimalPlaces === 0) {
    numberString = Math.round(numValue).toString();
  } else {
    numberString = numValue.toFixed(decimalPlaces);
  }

  // Apply thousands separator
  if (thousandsSeparator !== 'none') {
    const parts = numberString.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '';

    let separator: string;
    switch (thousandsSeparator) {
      case 'dot':
        separator = '.';
        break;
      case 'space':
        separator = ' ';
        break;
      default:
        separator = ',';
    }

    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    numberString = decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  }

  return numberString;
};

/**
 * Validate if a string is a valid currency value
 */
export const isValidCurrency = (value: string): boolean => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Remove currency symbols and whitespace
  const cleanValue = value.replace(/[^\d.,\-\s]/g, '').trim();
  
  if (!cleanValue) {
    return false;
  }

  // Check if it can be parsed to a valid number
  const num = parseCurrencyInput(value);
  
  // Valid if it's a number, not NaN, and not negative (unless negative allowed)
  return !isNaN(num) && isFinite(num) && num >= 0;
};

/**
 * Format percentage with symbol
 */
export const formatPercentage = (
  value: number,
  decimalPlaces: number = 1,
  includeSymbol: boolean = true
): string => {
  if (isNaN(value)) value = 0;
  
  const formatted = value.toFixed(decimalPlaces);
  return includeSymbol ? `${formatted}%` : formatted;
};

/**
 * Calculate discount/savings amount
 */
export const calculateSavings = (
  originalPrice: number,
  discountPrice: number,
  formatResult: boolean = true,
  formatOptions?: CurrencyFormatOptions
): {
  amount: number;
  percentage: number;
  formattedAmount: string;
  formattedPercentage: string;
} => {
  const amount = Math.max(0, originalPrice - discountPrice);
  const percentage = originalPrice > 0 ? (amount / originalPrice) * 100 : 0;

  const defaultFormatOptions = {
    ...DEFAULT_OPTIONS,
    ...formatOptions
  };

  const formattedAmount = formatResult 
    ? formatCurrency(
        amount,
        defaultFormatOptions.currency,
        defaultFormatOptions.currencyPosition,
        defaultFormatOptions.decimalPlaces,
        defaultFormatOptions.thousandsSeparator
      )
    : amount.toString();

  const formattedPercentage = formatPercentage(percentage);

  return {
    amount,
    percentage,
    formattedAmount,
    formattedPercentage
  };
};

// Default export
export default {
  formatCurrency,
  parseCurrencyInput,
  formatCurrencyInput,
  isValidCurrency,
  formatPercentage,
  calculateSavings,
  getCurrencySymbol,
  DEFAULT_OPTIONS,
  CURRENCY_SYMBOLS
};