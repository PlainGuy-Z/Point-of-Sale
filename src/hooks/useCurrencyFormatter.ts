import { useApp } from '../contexts/AppContext';
import { useCurrencyConverter } from '../utils/currencyConverter';
import { 
  formatCurrency, 
  parseCurrencyInput, 
  formatCurrencyInput, 
  isValidCurrency,
  calculateSavings as calculateSavingsUtil,
  CURRENCY_SYMBOLS
} from '../utils/currencyFormatter';

export const useCurrencyFormatter = () => {
  const { settings } = useApp();
  const converter = useCurrencyConverter();
  
  // Helper untuk mendapatkan settings dengan defaults
  const getSafeSettings = () => {
    return {
      currency: settings.currency || 'IDR',
      currencyPosition: settings.currencyPosition || 'before',
      decimalPlaces: settings.decimalPlaces ?? 0,
      thousandsSeparator: settings.thousandsSeparator || 'comma'
    };
  };

  const safeSettings = getSafeSettings();
  
  const format = (amount: number): string => {
    return formatCurrency(
      amount,
      safeSettings.currency,
      safeSettings.currencyPosition,
      safeSettings.decimalPlaces,
      safeSettings.thousandsSeparator
    );
  };
  
  // Format dengan konversi ke mata uang lain
  const formatWithConversion = (
    amount: number, 
    targetCurrency?: string, 
    fromCurrency?: string
  ): string => {
    const target = targetCurrency || safeSettings.currency;
    const source = fromCurrency || safeSettings.currency;
    
    if (target === source) {
      return format(amount);
    }
    
    try {
      // Konversi ke mata uang target
      const converted = converter.convert(amount, source, target);
      
      // Format untuk target currency
      return formatCurrency(
        converted,
        target,
        safeSettings.currencyPosition,
        safeSettings.decimalPlaces,
        safeSettings.thousandsSeparator
      );
    } catch (error) {
      console.error('Currency conversion failed:', error);
      // Fallback ke format biasa
      return format(amount);
    }
  };
  
  // Format untuk display dengan dual currency (original + converted)
  const formatDualCurrency = (
    amount: number,
    showCurrency: string = 'USD'
  ): { original: string; converted: string } => {
    const original = format(amount);
    
    if (safeSettings.currency === showCurrency) {
      return { original, converted: original };
    }
    
    const converted = formatWithConversion(amount, showCurrency);
    return { original, converted };
  };
  
  const parse = (value: string): number => {
    return parseCurrencyInput(value, safeSettings.thousandsSeparator);
  };
  
  const formatInput = (value: string | number): string => {
    return formatCurrencyInput(value, safeSettings.decimalPlaces, safeSettings.thousandsSeparator);
  };
  
  const isValid = (value: string): boolean => {
    return isValidCurrency(value);
  };
  
  const getCurrencySymbol = (currency?: string): string => {
    const currencyCode = currency || safeSettings.currency;
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  };
  
  // Mendapatkan rate konversi
  const getConversionRate = (targetCurrency: string, fromCurrency?: string): number => {
    return converter.convert(1, fromCurrency || safeSettings.currency, targetCurrency);
  };
  
  // Check if conversion is available
  const canConvertTo = (currency: string): boolean => {
    return !!converter.rates[currency];
  };
  
  // Get available currencies
  const getAvailableCurrencies = (): string[] => {
    return Object.keys(converter.rates);
  };

  // Calculate savings
  const calculateSavings = (
    originalPrice: number,
    discountPrice: number
  ) => {
    return calculateSavingsUtil(
      originalPrice, 
      discountPrice, 
      true, 
      {
        currency: safeSettings.currency,
        currencyPosition: safeSettings.currencyPosition,
        decimalPlaces: safeSettings.decimalPlaces,
        thousandsSeparator: safeSettings.thousandsSeparator
      }
    );
  };
  
  return { 
    // Basic formatting
    format, 
    formatWithConversion,
    formatDualCurrency,
    
    // Input handling
    parse, 
    formatInput, 
    isValid,
    
    // Currency info
    getCurrencySymbol,
    getConversionRate,
    canConvertTo,
    getAvailableCurrencies,
    
    // Savings calculation
    calculateSavings,
    
    // Converter state
    conversionRates: converter.rates,
    ratesLoading: converter.loading,
    ratesError: converter.error,
    ratesLastUpdated: converter.lastUpdated,
    refreshRates: converter.refreshRates,
    getRate: converter.getRate,
    
    // Settings
    settings: safeSettings,
    rawSettings: settings
  };
};