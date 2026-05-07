import type { AppDataState, Customer, Transaction, WasteLog } from '../types';

type IsoDateString = string;

type TransactionWire = Omit<Transaction, 'date'> & { date: IsoDateString };
type WasteLogWire = Omit<WasteLog, 'date'> & { date: IsoDateString };
type CustomerWire = Omit<Customer, 'joinDate' | 'lastVisit'> & {
  joinDate: IsoDateString;
  lastVisit?: IsoDateString;
};

type AppStateWire = Omit<AppDataState, 'transactions' | 'wasteLogs' | 'customers'> & {
  transactions: TransactionWire[];
  wasteLogs: WasteLogWire[];
  customers: CustomerWire[];
};

function getApiBaseUrl(): string {
  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  if (!base) {
    if (import.meta.env.DEV) {
      console.error('VITE_API_BASE_URL is not set. Please check your .env file.');
      return 'http://localhost:3000'; // Default fallback for local development
    }
    throw new Error('VITE_API_BASE_URL is not set. Configure backend base URL to load app data.');
  }
  return base.replace(/\/+$/, '');
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

function normalizeState(wire: AppStateWire): AppDataState {
  return {
    ...wire,
    customers: wire.customers.map((c) => ({
      ...c,
      joinDate: new Date(c.joinDate),
      lastVisit: c.lastVisit ? new Date(c.lastVisit) : undefined,
    })),
    transactions: wire.transactions.map((t) => ({ ...t, date: new Date(t.date) })),
    wasteLogs: wire.wasteLogs.map((w) => ({ ...w, date: new Date(w.date) })),
  };
}

export const appApi = {
  getState: async (): Promise<AppDataState> => normalizeState(await http<AppStateWire>(`/app/state`)),

  addProduct: async (product: any): Promise<AppDataState> => normalizeState(await http<AppStateWire>(`/app/products`, { method: 'POST', body: JSON.stringify(product) })),
  updateProduct: async (product: any): Promise<AppDataState> =>
    normalizeState(await http<AppStateWire>(`/app/products/${encodeURIComponent(product.id)}`, { method: 'PUT', body: JSON.stringify(product) })),
  deleteProduct: async (id: string): Promise<AppDataState> =>
    normalizeState(await http<AppStateWire>(`/app/products/${encodeURIComponent(id)}`, { method: 'DELETE' })),

  addCustomer: async (customer: any): Promise<AppDataState> => normalizeState(await http<AppStateWire>(`/app/customers`, { method: 'POST', body: JSON.stringify(customer) })),
  updateCustomer: async (customer: any): Promise<AppDataState> =>
    normalizeState(await http<AppStateWire>(`/app/customers/${encodeURIComponent(customer.id)}`, { method: 'PUT', body: JSON.stringify(customer) })),
  deleteCustomer: async (id: string): Promise<AppDataState> =>
    normalizeState(await http<AppStateWire>(`/app/customers/${encodeURIComponent(id)}`, { method: 'DELETE' })),

  addWasteLog: async (waste: any): Promise<AppDataState> => normalizeState(await http<AppStateWire>(`/app/waste-logs`, { method: 'POST', body: JSON.stringify(waste) })),

  updateSettings: async (settings: any): Promise<AppDataState> => normalizeState(await http<AppStateWire>(`/app/settings`, { method: 'PUT', body: JSON.stringify(settings) })),

  addCategory: async (name: string): Promise<AppDataState> =>
    normalizeState(await http<AppStateWire>(`/app/categories`, { method: 'POST', body: JSON.stringify({ name }) })),
  deleteCategory: async (name: string): Promise<AppDataState> =>
    normalizeState(await http<AppStateWire>(`/app/categories/${encodeURIComponent(name)}`, { method: 'DELETE' })),

  clearOldData: async (): Promise<AppDataState> => normalizeState(await http<AppStateWire>(`/app/maintenance/clear-old-data`, { method: 'POST' })),
  resetAllData: async (): Promise<AppDataState> => normalizeState(await http<AppStateWire>(`/app/maintenance/reset-all`, { method: 'POST' })),
};

