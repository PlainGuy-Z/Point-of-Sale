import type { Transaction, TransactionItem } from '../types';
import { ApiError } from './appApi';

/**
 * Backend contract (DTO) — keep frontend payload minimal.
 * - Frontend should NOT send computed totals/profit/tax, nor product price/cost.
 * - Backend must validate stock/pricing and compute totals.
 */
export interface PosCartLineInput {
  productId: string;
  quantity: number;
  note?: string;
  modifiers?: string[];
  // Manual/custom items (productId starts with "manual-")
  price?: number;
}

export interface CreateTransactionRequest {
  cart: PosCartLineInput[];
  paymentMethod: 'cash' | 'card' | 'qris';
  customerId?: string;
  customerName?: string;
  orderType: 'dine-in' | 'take-away';
  tableNumber?: string;
  cashReceived?: number;
  orderNote?: string;
}

/**
 * Backend should return a fully computed transaction. Dates are assumed ISO strings.
 * We normalize to the app's `Transaction` type (with `Date`) here.
 */
type TransactionResponse = Omit<Transaction, 'date' | 'items'> & {
  date: string;
  items: TransactionItem[];
};

function getApiBaseUrl(): string {
  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set. Add it to Front-End/.env (e.g. http://localhost:4000).');
  }
  return base.replace(/\/+$/, '');
}

async function http<T>(path: string, init: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let code: string | undefined;
    let details: unknown;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
      else if (body?.message) message = body.message;
      if (body?.error?.code) code = body.error.code;
      if (body?.error?.details) details = body.error.details;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message, code, details);
  }

  return (await res.json()) as T;
}

export const posApi = {
  /**
   * Optional quote endpoint for UI totals preview. If your backend doesn't support it yet,
   * you can remove this and keep the UI "total" as pending until checkout.
   */
  quote: async (req: Omit<CreateTransactionRequest, 'paymentMethod'>) =>
    http<{ subtotal: number; tax: number; grandTotal: number; taxRate?: number }>(`/pos/quote`, {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  createTransaction: async (req: CreateTransactionRequest): Promise<Transaction> => {
    const data = await http<TransactionResponse>(`/pos/transactions`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
    return { ...data, date: new Date(data.date) };
  },
};

