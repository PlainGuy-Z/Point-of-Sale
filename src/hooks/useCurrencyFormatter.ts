export const useCurrencyFormatter = () => {
  /**
   * Raw Data Policy:
   * - Do NOT add currency symbols or locale formatting (e.g. "Rp", separators).
   * - Keep all price/amount values displayed as raw integers (stringified).
   */
  const format = (amount: number): string => String(Math.trunc(Number(amount) || 0));
  const parse = (value: string): number => {
    const cleaned = String(value ?? '').replace(/[^\d.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    format,
    parse,
    // Backward-compatible no-op helpers (kept so existing calls don't break)
    formatWithConversion: (amount: number) => format(amount),
    formatDualCurrency: (amount: number) => ({ original: format(amount), converted: format(amount) }),
    formatInput: (value: string | number) => String(value ?? ''),
    isValid: (value: string) => /^\d*([.]\d+)?$/.test(String(value ?? '').trim()) || String(value ?? '').trim() === '',
    getCurrencySymbol: () => '',
    getConversionRate: () => 1,
    canConvertTo: () => false,
    getAvailableCurrencies: () => [],
    calculateSavings: (originalPrice: number, discountPrice: number) => ({
      amount: Math.max(0, Math.trunc(originalPrice) - Math.trunc(discountPrice)),
      percent: originalPrice > 0 ? Math.max(0, ((originalPrice - discountPrice) / originalPrice) * 100) : 0,
    }),
    conversionRates: {},
    ratesLoading: false,
    ratesError: null,
    ratesLastUpdated: null,
    refreshRates: async () => {},
    getRate: () => 1,
    settings: {
      currency: '',
      currencyPosition: 'before',
      decimalPlaces: 0,
      thousandsSeparator: 'none',
    },
    rawSettings: {},
  };
};