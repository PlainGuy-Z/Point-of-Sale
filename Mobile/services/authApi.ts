import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '../types';
import { http, ApiError } from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  shopName: string;
  shopSlug: string;
  ownerName: string;
  email: string;
  password: string;
  licenseToken: string;
}

export const authApi = {
  login: async (data: LoginData): Promise<{ user: AuthUser; token: string }> => {
    const result = await http<{ user: AuthUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Store token and user profile securely
    if (result.token) {
      await SecureStore.setItemAsync('auth_token', result.token);
    }
    if (result.user) {
      await SecureStore.setItemAsync('auth_user', JSON.stringify(result.user));
    }
    return result;
  },

  register: async (data: RegisterData): Promise<{ user: AuthUser; token: string }> => {
    const result = await http<{ user: AuthUser; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (result.token) {
      await SecureStore.setItemAsync('auth_token', result.token);
    }
    if (result.user) {
      await SecureStore.setItemAsync('auth_user', JSON.stringify(result.user));
    }
    return result;
  },

  verifyToken: async (token: string): Promise<{ valid: boolean; message: string }> => {
    return http<{ valid: boolean; message: string }>('/auth/verify-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  logout: async (): Promise<void> => {
    try {
      await http<{ message: string }>('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout API failed:', err);
    } finally {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_user');
    }
  },

  me: async (): Promise<{ user: AuthUser }> =>
    http<{ user: AuthUser }>('/auth/me'),

  updateProfile: async (data: { name?: string; shop_name?: string }): Promise<{ user: AuthUser }> =>
    http<{ user: AuthUser }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export { ApiError };
