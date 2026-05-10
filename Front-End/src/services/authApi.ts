import type { AuthUser } from '../types';
import { ApiError } from './appApi';

function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
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

export interface RegisterData {
  shopName: string;
  shopSlug: string;
  ownerName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileData {
  name?: string;
  shop_name?: string;
}

export const authApi = {
  register: async (data: RegisterData): Promise<{ user: AuthUser }> =>
    http<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: async (data: LoginData): Promise<{ user: AuthUser }> =>
    http<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: async (): Promise<void> => {
    await http<{ message: string }>('/auth/logout', { method: 'POST' });
  },

  me: async (): Promise<{ user: AuthUser }> =>
    http<{ user: AuthUser }>('/auth/me'),

  updateProfile: async (data: UpdateProfileData): Promise<{ user: AuthUser }> =>
    http<{ user: AuthUser }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> =>
    http<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
