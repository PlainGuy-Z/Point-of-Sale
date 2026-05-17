import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '../types';
import { http, ApiError } from './api';

export interface LoginData {
  email: string;
  password: string;
}

export const authApi = {
  login: async (data: LoginData): Promise<{ user: AuthUser; token: string }> => {
    const result = await http<{ user: AuthUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Store token securely
    if (result.token) {
      await SecureStore.setItemAsync('auth_token', result.token);
    }
    return result;
  },

  logout: async (): Promise<void> => {
    try {
      await http<{ message: string }>('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout API failed:', err);
    } finally {
      await SecureStore.deleteItemAsync('auth_token');
    }
  },

  me: async (): Promise<{ user: AuthUser }> =>
    http<{ user: AuthUser }>('/auth/me'),
};

export { ApiError };
