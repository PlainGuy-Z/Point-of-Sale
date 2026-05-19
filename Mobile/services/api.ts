import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function http<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(0, 'API base URL not configured (EXPO_PUBLIC_API_URL)', 'NO_BASE_URL');
  }

  const token = await SecureStore.getItemAsync('auth_token');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${BASE_URL}${cleanPath}`;

  // Timeout: abort request after 10s to avoid indefinite hanging
  const controller = new AbortController();
  const timeoutMs = 10000; // 10 seconds
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
    if (res.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      throw new ApiError(401, 'Session expired', 'UNAUTHORIZED');
    }
    let message = `HTTP ${res.status}`;
    let code: string | undefined;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
      else if (body?.message) message = body.message;
      if (body?.error?.code) code = body.error.code;
    } catch { /* ignore */ }
    throw new ApiError(res.status, message, code);
  }

  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => http<T>(path),
  post: <T>(path: string, body?: unknown) =>
    http<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    http<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => http<T>(path, { method: 'DELETE' }),
};
