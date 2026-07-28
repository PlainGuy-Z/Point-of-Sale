/**
 * History API Service
 * Dedicated API module for transaction history endpoints.
 * Uses the existing `http` helper — no duplicate client.
 */
import { http } from './api';
import type {
  TransactionsListResponse,
  TxSummaryToday,
  TxSummaryMonth,
  HistoryTransaction,
} from '../types/historyTransaction';

export interface HistoryFilters {
  page?: number;
  limit?: number;
  sort?: 'desc' | 'asc';
  status?: 'completed' | 'pending_void' | 'voided';
  q?: string;
  date_from?: string;
  date_to?: string;
  cashier_id?: string;
  payment_method?: string;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      q.set(k, String(v));
    }
  }
  return q.toString();
}

export const historyApi = {
  /**
   * GET /transactions — list transactions with filters & pagination
   */
  getTransactions: async (filters: HistoryFilters = {}): Promise<TransactionsListResponse> => {
    const query = buildQuery({
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      sort: filters.sort ?? 'desc',
      status: filters.status,
      q: filters.q?.trim() || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      cashier_id: filters.cashier_id || undefined,
      payment_method: filters.payment_method || undefined,
    });
    return http<TransactionsListResponse>(`/transactions?${query}`);
  },

  /**
   * GET /transactions/summary?scope=today
   */
  getSummaryToday: async (cashierId?: string): Promise<TxSummaryToday> => {
    const extra = cashierId ? `&cashier_id=${encodeURIComponent(cashierId)}` : '';
    return http<TxSummaryToday>(`/transactions/summary?scope=today${extra}`);
  },

  /**
   * GET /transactions/summary?scope=month
   */
  getSummaryMonth: async (cashierId?: string): Promise<TxSummaryMonth> => {
    const extra = cashierId ? `&cashier_id=${encodeURIComponent(cashierId)}` : '';
    return http<TxSummaryMonth>(`/transactions/summary?scope=month${extra}`);
  },

  /**
   * GET /transactions/void-requests
   */
  getVoidRequests: async (): Promise<{ data: HistoryTransaction[]; total: number }> => {
    return http<{ data: HistoryTransaction[]; total: number }>('/transactions/void-requests');
  },

  /**
   * POST /transactions/:id/void-request
   */
  submitVoidRequest: async (id: string, reason: string): Promise<void> => {
    await http(`/transactions/${encodeURIComponent(id)}/void-request`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * POST /transactions/:id/void-approve
   */
  approveVoid: async (id: string, note?: string): Promise<void> => {
    await http(`/transactions/${encodeURIComponent(id)}/void-approve`, {
      method: 'POST',
      body: JSON.stringify({ note: note?.trim() || undefined }),
    });
  },

  /**
   * POST /transactions/:id/void-reject
   */
  rejectVoid: async (id: string, note: string): Promise<void> => {
    await http(`/transactions/${encodeURIComponent(id)}/void-reject`, {
      method: 'POST',
      body: JSON.stringify({ note: note.trim() }),
    });
  },

  /**
   * POST /transactions/:id/void-direct
   */
  directVoid: async (id: string, reason: string): Promise<void> => {
    await http(`/transactions/${encodeURIComponent(id)}/void-direct`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason.trim() }),
    });
  },

  /**
   * GET /users — list cashiers for owner filter dropdown
   */
  getCashiers: async (): Promise<Array<{ id: string; name: string; email?: string; role?: string }>> => {
    return http<Array<{ id: string; name: string; email?: string; role?: string }>>('/users');
  },
  /**
   * GET /transactions/needs-review — List transactions flagged for owner review
   */
  getNeedsReview: async (): Promise<{ data: HistoryTransaction[]; total: number }> => {
    return http<{ data: HistoryTransaction[]; total: number }>('/transactions/needs-review');
  },

  /**
   * POST /transactions/:id/resolve-review — Resolve stock conflict (accept or void)
   */
  resolveReview: async (id: string, action: 'accept' | 'void', note?: string): Promise<HistoryTransaction> => {
    return http<HistoryTransaction>(`/transactions/${id}/resolve-review`, {
      method: 'POST',
      body: JSON.stringify({ action, note }),
    });
  },
};
