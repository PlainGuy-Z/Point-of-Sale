import type { Transaction, TransactionItem } from '../types';
import { http } from './api';
import { normalizeAppStateWire, type AppStateWire } from './appApi';

export interface PosCartLineInput {
  productId: string;
  quantity: number;
  note?: string;
  modifiers?: string[];
  description?: string;
  variantName?: string;
  variantPrice?: number;
  price?: number;
}

export interface CreateTransactionRequest {
  cart: PosCartLineInput[];
  paymentMethod: 'cash' | 'card' | 'qris';
  customerId?: string;
  customerName?: string;
  orderType: 'dine-in' | 'take-away';
  tableNumber?: string;
  notes?: string;
  cashReceived?: number;
  orderNote?: string;
  applyTax?: boolean;
}

type TransactionResponse = Omit<Transaction, 'date' | 'items'> & {
  date: string;
  items: TransactionItem[];
};

export interface CheckoutResponse {
  transaction: TransactionResponse;
  appState: AppStateWire;
}

export const posApi = {
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
    }>('/pos/quote', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  createTransaction: async (req: CreateTransactionRequest): Promise<{ transaction: Transaction; appState: AppStateWire }> => {
    const res = await http<CheckoutResponse>('/pos/transactions', {
      method: 'POST',
      body: JSON.stringify(req),
    });

    return {
      transaction: { ...res.transaction, date: new Date(res.transaction.date) },
      appState: res.appState,
    };
  },
};
