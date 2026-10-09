import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
let refreshPromise: Promise<string | null> | null = null;
const AUTH_PATHS_WITHOUT_REFRESH = new Set(['/auth/login', '/auth/register', '/auth/verify-token', '/auth/refresh']);

export class ApiError {
  name = 'ApiError';
  message: string;
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    this.message = message;
    this.status = status;
    this.code = code;
  }
}

export async function http<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = 10000,
  allowRefresh = true
): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(0, 'API base URL not configured (EXPO_PUBLIC_API_URL)', 'NO_BASE_URL');
  }

  const token = await SecureStore.getItemAsync('auth_token');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${BASE_URL}${cleanPath}`;
  
  console.log("MOBILE API BASE URL:", process.env.EXPO_PUBLIC_API_URL);
  console.log("REQUEST URL:", url);

  // Timeout: abort request after the configured interval to avoid indefinite hanging
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      signal: controller.signal as any,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ApiError(0, `Network request timed out after ${timeoutMs / 1000}s`, 'TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let code: string | undefined;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
      else if (body?.message) message = body.message;
      if (body?.error?.code) code = body.error.code;
    } catch { /* ignore */ }

    if (res.status === 401 && allowRefresh && !AUTH_PATHS_WITHOUT_REFRESH.has(path)) {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const refreshedToken = await refreshPromise;
      if (refreshedToken) {
        return http<T>(path, init, timeoutMs, false);
      }
    }

    if (res.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_refresh_token');
      await SecureStore.deleteItemAsync('auth_user');
      // If message is still generic or is the default backend token error, rewrite it for UX
      if (message === 'HTTP 401' || message === 'Invalid or expired token') {
        message = 'Sesi telah berakhir, silakan login kembali.';
      }
      throw new ApiError(401, message, code || 'UNAUTHORIZED');
    }

    throw new ApiError(res.status, message, code);
  }

  return (await res.json()) as T;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync('auth_refresh_token');
  if (!refreshToken || !BASE_URL) return null;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return null;

    const data = await response.json() as { token?: string };
    if (!data.token) return null;
    await SecureStore.setItemAsync('auth_token', data.token);
    return data.token;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // A temporary network failure must not destroy an otherwise recoverable session.
    throw new ApiError(0, 'Tidak dapat memperbarui sesi. Periksa koneksi internet.', 'REFRESH_NETWORK_ERROR');
  }
}

export const api = {
  get: <T>(path: string, timeoutMs?: number) => http<T>(path, {}, timeoutMs),
  post: <T>(path: string, body?: unknown, timeoutMs?: number) =>
    http<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }, timeoutMs),
  put: <T>(path: string, body?: unknown, timeoutMs?: number) =>
    http<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }, timeoutMs),
  delete: <T>(path: string, timeoutMs?: number) => http<T>(path, { method: 'DELETE' }, timeoutMs),
};
