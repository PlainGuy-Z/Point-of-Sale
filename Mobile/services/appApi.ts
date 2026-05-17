import type { AppDataState, Customer, Transaction, WasteLog } from '../types';
import { http } from './api';

type IsoDateString = string;
type TransactionWire = Omit<Transaction, 'date'> & { date: IsoDateString };
type WasteLogWire = Omit<WasteLog, 'date'> & { date: IsoDateString };
type CustomerWire = Omit<Customer, 'joinDate' | 'lastVisit'> & {
  joinDate: IsoDateString;
  lastVisit?: IsoDateString;
};

export type AppStateWire = Omit<AppDataState, 'transactions' | 'wasteLogs' | 'customers'> & {
  transactions: TransactionWire[];
  wasteLogs: WasteLogWire[];
  customers: CustomerWire[];
};

export function normalizeAppStateWire(wire: AppStateWire): AppDataState {
  return {
    ...wire,
    products: wire.products || [],
    categories: wire.categories || [],
    categoriesWithId: wire.categoriesWithId || [],
    customers: (wire.customers || []).map((c) => {
      const join = c.joinDate ? new Date(c.joinDate) : new Date();
      const visit = c.lastVisit ? new Date(c.lastVisit) : undefined;
      return {
        ...c,
        joinDate: isNaN(join.getTime()) ? new Date() : join,
        lastVisit: visit && !isNaN(visit.getTime()) ? visit : undefined,
      };
    }),
    transactions: (wire.transactions || []).map((t) => {
      const d = t.date ? new Date(t.date) : new Date();
      return { ...t, date: isNaN(d.getTime()) ? new Date() : d };
    }),
    wasteLogs: (wire.wasteLogs || []).map((w) => {
      const d = w.date ? new Date(w.date) : new Date();
      return { ...w, date: isNaN(d.getTime()) ? new Date() : d };
    }),
  };
}

export const appApi = {
  get: async <T = unknown>(path: string): Promise<T> => http<T>(path),
  post: async <T = unknown>(path: string, body?: unknown): Promise<T> =>
    http<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: async <T = unknown>(path: string, body?: unknown): Promise<T> =>
    http<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: async <T = unknown>(path: string): Promise<T> => http<T>(path, { method: 'DELETE' }),

  getAppState: async (): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>('/app/state')),

  getState: async (): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>('/app/state')),

  addProduct: async (product: unknown): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>('/app/products', { method: 'POST', body: JSON.stringify(product) })),

  updateProduct: async (product: { id: string }): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>(`/app/products/${encodeURIComponent(product.id)}`, { method: 'PUT', body: JSON.stringify(product) })),

  deleteProduct: async (id: string): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>(`/app/products/${encodeURIComponent(id)}`, { method: 'DELETE' })),

  addWasteLog: async (waste: unknown): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>('/app/waste-logs', { method: 'POST', body: JSON.stringify(waste) })),

  updateSettings: async (settings: unknown): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>('/app/settings', { method: 'PUT', body: JSON.stringify(settings) })),

  addCategory: async (name: string): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>('/app/categories', { method: 'POST', body: JSON.stringify({ name }) })),

  deleteCategory: async (name: string): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>(`/app/categories/${encodeURIComponent(name)}`, { method: 'DELETE' })),

  addCustomer: async (customer: unknown): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>('/app/customers', { method: 'POST', body: JSON.stringify(customer) })),

  updateCustomer: async (customer: { id: string }): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>(`/app/customers/${encodeURIComponent(customer.id)}`, { method: 'PUT', body: JSON.stringify(customer) })),

  deleteCustomer: async (id: string): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>(`/app/customers/${encodeURIComponent(id)}`, { method: 'DELETE' })),
};
