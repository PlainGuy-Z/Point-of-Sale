import type { AppDataState, Customer, Transaction, WasteLog } from '../types';

type IsoDateString = string;

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

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
    throw new Error('VITE_API_BASE_URL is not set. Add it to Front-End/.env (e.g. http://localhost:4000).');
  }
  return base.replace(/\/+$/, '');
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = '/login';
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
  get: async <T = any>(path: string): Promise<T> => http<T>(path),
  post: async <T = any>(path: string, body?: any): Promise<T> => http<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: async <T = any>(path: string, body?: any): Promise<T> => http<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: async <T = any>(path: string): Promise<T> => http<T>(path, { method: 'DELETE' }),

  getAppState: async (): Promise<AppDataState> => normalizeState(await http<AppStateWire>(`/app/state`)),
  // Backwards compatibility (existing call sites)
  getState: async (): Promise<AppDataState> => appApi.getAppState(),

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

