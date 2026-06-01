import { api } from './api';

export type ForecastItem = {
  date: string;
  day_name: string;
  predicted_revenue: number;
  predicted_transactions: number;
  confidence: 'high' | 'medium' | 'low';
};

export type ForecastResponse = ForecastItem[];

export type WasteProduct = {
  product_id: string;
  name: string;
  waste_qty: number;
  sold_qty: number;
  waste_ratio: number;
  waste_cost: number;
};

export type WasteResponse = {
  period_days: number;
  total_waste_cost: number;
  previous_period_waste_cost: number;
  trend_percentage: number;
  top_waste_products: WasteProduct[];
};

export type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

export type ChatResponse = {
  reply: string;
  context_snapshot: {
    today_revenue: number;
    this_week_revenue: number;
    total_transactions: number;
  };
};

export type SummaryResponse = {
  today_revenue: number;
  yesterday_revenue: number;
  this_week_revenue: number;
  last_week_revenue: number;
  this_month_revenue: number;
  day_over_day_change_percent: number;
  week_over_week_change_percent: number;
  top_products_today: string;
  low_stock_count: number;
  active_shifts_count: number;
};

export const aiApi = {
  fetchForecast: async (): Promise<ForecastResponse> => {
    try {
      const response = await api.get<{ data: { forecast: ForecastResponse } }>('/api/ai/forecast');
      return response.data.forecast;
    } catch (error) {
      console.error('Forecast error:', error);
      throw error;
    }
  },

  fetchWasteAnalysis: async (days: 7 | 14 | 30 = 30): Promise<WasteResponse> => {
    try {
      const response = await api.get<{ data: WasteResponse }>(`/api/ai/waste-analysis?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Waste analysis error:', error);
      throw error;
    }
  },

  fetchSummary: async (): Promise<SummaryResponse> => {
    try {
      const response = await api.get<{ data: SummaryResponse }>('/api/ai/summary');
      return response.data;
    } catch (error) {
      console.error('Summary error:', error);
      throw error;
    }
  },

  chat: async (
    message: string,
    history: ChatMessage[],
    contextSnapshot?: { today_revenue: number; this_week_revenue: number; total_transactions: number }
  ): Promise<ChatResponse> => {
    try {
      const response = await api.post<{ data: ChatResponse }>('/api/ai/chat', {
        message,
        history,
        context_snapshot: contextSnapshot
      });
      return response.data;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  },

  fetchBusinessInsights: async (from: string, to: string, skipAi: boolean = false): Promise<any> => {
    try {
      const response = await api.get<{ data: any }>(`/reports/business-insights?from=${from}&to=${to}&skip_ai=${skipAi}`);
      return response.data;
    } catch (error) {
      console.error('Business Insights error:', error);
      throw error;
    }
  }
};
