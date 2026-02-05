import { useState, useEffect, useCallback } from 'react';

// Exchange rates fallback (static) untuk jika API gagal
const STATIC_EXCHANGE_RATES: Record<string, number> = {
  // Base: IDR (Indonesian Rupiah)
  'IDR': 1,
  'USD': 0.000064,
  'EUR': 0.000059,
  'SGD': 0.000087,
  'GBP': 0.000050,
  'JPY': 0.0097,
  'AUD': 0.000098,
  'CAD': 0.000088,
  'CHF': 0.000057,
  'CNY': 0.00046,
  'KRW': 0.086,
  'MYR': 0.00030,
  'THB': 0.0023,
  'VND': 1.55,
  'PHP': 0.0036,
  'INR': 0.0053,
  'BRL': 0.00032,
  'RUB': 0.0058,
};

// Local storage keys
const RATES_CACHE_KEY = 'coffee_pos_exchange_rates_cache';
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 jam
const LAST_FETCH_KEY = 'coffee_pos_exchange_last_fetch';

// Helper: Get cached rates
export const getCachedRates = (): { rates: Record<string, number>; timestamp: number } | null => {
  try {
    const cached = localStorage.getItem(RATES_CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached);
    
    // Check if cache is still valid
    const now = Date.now();
    if (now - data.timestamp > CACHE_DURATION_MS) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading cached rates:', error);
    return null;
  }
};

// Helper: Save rates to cache
export const saveRatesToCache = (rates: Record<string, number>): void => {
  try {
    const cacheData = {
      rates,
      timestamp: Date.now()
    };
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(LAST_FETCH_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error saving rates to cache:', error);
  }
};

// Helper: Get last fetch time
export const getLastFetchTime = (): Date | null => {
  try {
    const lastFetch = localStorage.getItem(LAST_FETCH_KEY);
    return lastFetch ? new Date(lastFetch) : null;
  } catch (error) {
    console.error('Error getting last fetch time:', error);
    return null;
  }
};

// Main function to fetch exchange rates
export const fetchExchangeRates = async (baseCurrency: string = 'IDR'): Promise<Record<string, number> | null> => {
  console.log('Fetching exchange rates for base:', baseCurrency);
  
  // Check cache first
  const cached = getCachedRates();
  if (cached) {
    console.log('Using cached exchange rates');
    return cached.rates;
  }

  // Try free API
  try {
    // Menggunakan Frankfurter API yang gratis dan tidak perlu API key
    const apiUrl = `https://api.frankfurter.app/latest?from=${baseCurrency}&to=USD,EUR,GBP,JPY,AUD,CAD,CHF,CNY,IDR,SGD,MYR,THB`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid API response format');
    }

    // Start with base currency rate = 1
    const rates: Record<string, number> = { [baseCurrency]: 1 };
    
    // Add rates from API
    Object.entries(data.rates).forEach(([currency, rate]) => {
      if (typeof rate === 'number') {
        rates[currency] = rate;
      }
    });

    // Add static rates for missing currencies
    Object.entries(STATIC_EXCHANGE_RATES).forEach(([currency, staticRate]) => {
      if (!rates[currency] && baseCurrency === 'IDR') {
        rates[currency] = staticRate;
      }
    });

    saveRatesToCache(rates);
    console.log('Successfully fetched exchange rates');
    return rates;

  } catch (error) {
    console.warn('Failed to fetch exchange rates from API:', error);
    
    // Use static rates as fallback
    console.log('Using static exchange rates as fallback');
    
    if (baseCurrency === 'IDR') {
      saveRatesToCache(STATIC_EXCHANGE_RATES);
      return STATIC_EXCHANGE_RATES;
    }

    // Convert static rates to different base currency
    const baseToIDR = 1 / (STATIC_EXCHANGE_RATES[baseCurrency] || 1);
    const convertedRates: Record<string, number> = {};
    
    Object.keys(STATIC_EXCHANGE_RATES).forEach(currency => {
      convertedRates[currency] = STATIC_EXCHANGE_RATES[currency] * baseToIDR;
    });
    convertedRates[baseCurrency] = 1;

    saveRatesToCache(convertedRates);
    return convertedRates;
  }
};

// Currency conversion function
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = STATIC_EXCHANGE_RATES
): number => {
  if (isNaN(amount)) return 0;
  if (fromCurrency === toCurrency) return amount;
  
  // Ensure we have rates for both currencies
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];
  
  if (!fromRate || !toRate) {
    console.warn(`Missing exchange rate for ${fromCurrency} or ${toCurrency}`);
    return amount;
  }
  
  // Standard conversion: amount * (toRate / fromRate)
  const result = amount * (toRate / fromRate);
  return parseFloat(result.toFixed(6));
};

// React Hook for currency conversion
export const useCurrencyConverter = () => {
  const [rates, setRates] = useState<Record<string, number>>(STATIC_EXCHANGE_RATES);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(getLastFetchTime());

  // Load rates on mount
  useEffect(() => {
    const loadRates = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const cached = getCachedRates();
        if (cached) {
          setRates(cached.rates);
          setLastUpdated(new Date(cached.timestamp));
        }
        
        // Fetch fresh rates
        const freshRates = await fetchExchangeRates('IDR');
        if (freshRates) {
          setRates(freshRates);
          setLastUpdated(new Date());
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to load exchange rates:', errorMessage);
        setError('Failed to update exchange rates. Using cached rates.');
      } finally {
        setLoading(false);
      }
    };

    loadRates();

    // Refresh every hour
    const interval = setInterval(loadRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Convert function
  const convert = useCallback((
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number => {
    return convertCurrency(amount, fromCurrency, toCurrency, rates);
  }, [rates]);

  // Refresh rates manually
  const refreshRates = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const newRates = await fetchExchangeRates('IDR');
      if (newRates) {
        setRates(newRates);
        setLastUpdated(new Date());
        return true;
      }
      return false;
    } catch (err) {
      setError('Failed to refresh exchange rates');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get conversion rate between two currencies
  const getRate = useCallback((fromCurrency: string, toCurrency: string): number => {
    return convert(1, fromCurrency, toCurrency);
  }, [convert]);

  return {
    // State
    rates,
    loading,
    error,
    lastUpdated,
    
    // Methods
    convert,
    refreshRates,
    getRate,
    
    // Helper properties
    isUsingCachedRates: lastUpdated && (Date.now() - lastUpdated.getTime() > CACHE_DURATION_MS),
    cacheAge: lastUpdated ? Date.now() - lastUpdated.getTime() : null,
  };
};

// Default export
export default {
  convertCurrency,
  fetchExchangeRates,
  getCachedRates,
  saveRatesToCache,
  useCurrencyConverter,
  STATIC_EXCHANGE_RATES,
};