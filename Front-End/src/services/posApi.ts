import type { Transaction, TransactionItem } from '../types';
import { ApiError } from './appApi';
import { getApiBaseUrl } from './apiBaseUrl';
import { getBearerAuthHeader } from './authHeader';

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
  description?: string; // ✅ Per-item custom description
  variantName?: string;
  variantPrice?: number;
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
  notes?: string; // ✅ General order notes (order_description)
  cashReceived?: number;
  orderNote?: string;
  applyTax?: boolean;
}

/**
 * Backend should return a fully computed transaction. Dates are assumed ISO strings.
 * We normalize to the app's `Transaction` type (with `Date`) here.
 */
type TransactionResponse = Omit<Transaction, 'date' | 'items'> & {
  date: string;
  items: TransactionItem[];
};

export interface CheckoutResponse {
  transaction: TransactionResponse;
  appState: any; // Shape of AppDataState
}

async function http<T>(path: string, init: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      ...getBearerAuthHeader(),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('auth-unauthorized'));
      throw new ApiError(401, 'Session expired', 'UNAUTHORIZED');
    }
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
    http<{ 
      subtotal: number; 
      tax: number; 
      serviceCharge: number;
      grandTotal: number; 
      taxRate?: number;
      taxLabel?: string;
      serviceChargeRate?: number;
      serviceChargeLabel?: string;
    }>(`/pos/quote`, {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  createTransaction: async (req: CreateTransactionRequest): Promise<{ transaction: Transaction; appState: any }> => {
    const res = await http<CheckoutResponse>(`/pos/transactions`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
    
    return {
      transaction: { ...res.transaction, date: new Date(res.transaction.date) },
      appState: res.appState
    };
  },
};

