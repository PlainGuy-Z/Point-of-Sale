import type { AppDataState, Customer, Transaction, WasteLog } from '../types';
import { getApiBaseUrl } from './apiBaseUrl';
import { getBearerAuthHeader } from './authHeader';

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

export type AppStateWire = Omit<AppDataState, 'transactions' | 'wasteLogs' | 'customers'> & {
  transactions: TransactionWire[];
  wasteLogs: WasteLogWire[];
  customers: CustomerWire[];
};

/** * Ambil Root URL saja dari .env (Contoh: https://...railway.app)
 * Tanpa tambahan /auth atau /api di ujungnya.
 */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  // Path dipastikan selalu diawali dengan '/'
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${getApiBaseUrl()}${cleanPath}`;
  
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
      ...getBearerAuthHeader(),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Dispatch event instead of hard redirect to let AuthContext handle it
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
    } catch { /* ignore */ }
    throw new ApiError(res.status, message, code, details);
  }

  return (await res.json()) as T;
}

export function normalizeAppStateWire(wire: AppStateWire): AppDataState {
  return {
    ...wire,
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
  // Method dasar untuk custom call
  get: async <T = any>(path: string): Promise<T> => http<T>(path),
  post: async <T = any>(path: string, body?: any): Promise<T> => 
    http<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: async <T = any>(path: string, body?: any): Promise<T> => 
    http<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: async <T = any>(path: string): Promise<T> => http<T>(path, { method: 'DELETE' }),
  
  /** * KHUSUS LOGIN/REGISTER 
   * Pakai prefix /auth secara eksplisit agar masuk ke authRouter di backend
   */
  login: async (credentials: any) => appApi.post('/auth/login', credentials),
  register: async (data: any) => appApi.post('/auth/register', data),
  logout: async () => appApi.post('/auth/logout'),

  // Rute yang membutuhkan token (Protected) - Semua pakai prefix /app
  getAppState: async (): Promise<AppDataState> => 
    normalizeAppStateWire(await http<AppStateWire>(`/app/state`)),
  
  getState: async (): Promise<AppDataState> => appApi.getAppState(),

  addProduct: async (product: any): Promise<AppDataState> => 
    normalizeAppStateWire(await http<AppStateWire>(`/app/products`, { method: 'POST', body: JSON.stringify(product) })),
  
  updateProduct: async (product: any): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>(`/app/products/${encodeURIComponent(product.id)}`, { method: 'PUT', body: JSON.stringify(product) })),
  
  deleteProduct: async (id: string): Promise<AppDataState> =>
  // Gunakan AppStateWire di dalam http, bukan AppDataState
  normalizeAppStateWire(await http<AppStateWire>(`/app/products/${encodeURIComponent(id)}`, { method: 'DELETE' })),

  addCustomer: async (customer: any): Promise<AppDataState> => 
    normalizeAppStateWire(await http<AppStateWire>(`/app/customers`, { method: 'POST', body: JSON.stringify(customer) })),
  
  updateCustomer: async (customer: any): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>(`/app/customers/${encodeURIComponent(customer.id)}`, { method: 'PUT', body: JSON.stringify(customer) })),
  
  deleteCustomer: async (id: string): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>(`/app/customers/${encodeURIComponent(id)}`, { method: 'DELETE' })),

  addWasteLog: async (waste: any): Promise<AppDataState> => 
    normalizeAppStateWire(await http<AppStateWire>(`/app/waste-logs`, { method: 'POST', body: JSON.stringify(waste) })),

  updateSettings: async (settings: any): Promise<AppDataState> => 
    normalizeAppStateWire(await http<AppStateWire>(`/app/settings`, { method: 'PUT', body: JSON.stringify(settings) })),

  addCategory: async (name: string): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>(`/app/categories`, { method: 'POST', body: JSON.stringify({ name }) })),
  
  deleteCategory: async (name: string): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>(`/app/categories/${encodeURIComponent(name)}`, { method: 'DELETE' })),

  clearOldData: async (): Promise<AppDataState> => 
    normalizeAppStateWire(await http<AppStateWire>(`/app/maintenance/clear-old-data`, { method: 'POST' })),
  
  resetAllData: async (): Promise<AppDataState> => 
    normalizeAppStateWire(await http<AppStateWire>(`/app/maintenance/reset-all`, { method: 'POST' })),

  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return http<{ url: string }>('/app/upload', {
      method: 'POST',
      body: formData,
    });
  },

  resetTransactions: async (): Promise<AppDataState> =>
    normalizeAppStateWire(await http<AppStateWire>(`/app/data/transactions`, { method: 'DELETE' })),
};