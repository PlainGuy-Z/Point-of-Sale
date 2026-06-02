import { useState, useEffect, useCallback } from 'react';
import { aiApi, ForecastResponse, WasteResponse, SummaryResponse } from '../services/aiApi';

export interface BusinessInsightsData {
  summary: SummaryResponse | null;
  forecast: ForecastResponse | null;
  waste: WasteResponse | null;
}

export function useBusinessInsights() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BusinessInsightsData>({
    summary: null,
    forecast: null,
    waste: null
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all three endpoints concurrently
      const [summaryRes, forecastRes, wasteRes] = await Promise.allSettled([
        aiApi.fetchSummary(),
        aiApi.fetchForecast(),
        aiApi.fetchWasteAnalysis(30)
      ]);

      setData({
        summary: summaryRes.status === 'fulfilled' ? summaryRes.value : null,
        forecast: forecastRes.status === 'fulfilled' ? forecastRes.value : null,
        waste: wasteRes.status === 'fulfilled' ? wasteRes.value : null,
      });

      // If all three failed, we can consider it a total error.
      if (
        summaryRes.status === 'rejected' &&
        forecastRes.status === 'rejected' &&
        wasteRes.status === 'rejected'
      ) {
        throw new Error('Gagal memuat data Business Intelligence dari server');
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
