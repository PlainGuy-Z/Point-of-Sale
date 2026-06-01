import { useMemo, useState, useEffect, useCallback } from 'react';
import { aiApi } from '../services/aiApi';
import { PresetKey, DateRange, getDateRange } from './useMobileSalesReport';

export type BIPresetKey = 'this_week' | '7days' | '30days' | 'month' | 'custom';

// Custom getBIDateRange to support 'this_week'
function getBIDateRange(preset: BIPresetKey, customStart?: Date, customEnd?: Date): DateRange {
  const now = new Date();
  
  function startOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
  }
  function endOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(23, 59, 59, 999);
    return r;
  }

  switch (preset) {
    case 'this_week': {
      // Starts from Monday
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(now.setDate(diff));
      return { start: startOfDay(monday), end: endOfDay(new Date()) };
    }
    case '7days': {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { start: startOfDay(s), end: now };
    }
    case '30days': {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { start: startOfDay(s), end: now };
    }
    case 'month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case 'custom':
      return {
        start: customStart ? startOfDay(customStart) : startOfDay(now),
        end: customEnd ? endOfDay(customEnd) : now,
      };
    default:
      return { start: startOfDay(now), end: now };
  }
}

export function useBusinessInsights() {
  const [preset, setPreset] = useState<BIPresetKey>('this_week');
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  
  // Track if user explicitly clicked "Generate AI" for custom range
  const [forceAiForCustom, setForceAiForCustom] = useState(false);

  // Reset force AI flag when preset changes
  useEffect(() => {
    setForceAiForCustom(false);
  }, [preset]);

  const currentRange = useMemo(
    () => getBIDateRange(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const fetchData = useCallback(async (isManualAi = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const startStr = currentRange.start.toISOString().slice(0, 10);
      const endStr = currentRange.end.toISOString().slice(0, 10);
      
      // Skip AI if it's custom range AND user hasn't explicitly requested it
      const skipAi = preset === 'custom' && !isManualAi && !forceAiForCustom;

      const res = await aiApi.fetchBusinessInsights(startStr, endStr, skipAi);
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat Business Intelligence dari server');
      // Only nullify data if we don't have it yet, to preserve numerical data if AI fails on a retry
      if (!data) setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentRange, preset, forceAiForCustom, data]);

  const generateManualAi = useCallback(() => {
    setForceAiForCustom(true);
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    preset,
    setPreset,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    data,
    isLoading,
    error,
    refetch: fetchData,
    generateManualAi
  };
}
