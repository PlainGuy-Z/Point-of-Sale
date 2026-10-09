import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser, AuthStatus } from '../types';
import { authApi, RegisterData } from '../services/authApi';

interface AuthContextType {
  user: AuthUser | null;
  status: AuthStatus;
  isOwner: boolean;
  isCashier: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Check existing session on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        const cachedUserStr = await SecureStore.getItemAsync('auth_user');
        let cachedUser: AuthUser | null = null;
        if (cachedUserStr) {
          try {
            cachedUser = JSON.parse(cachedUserStr);
          } catch { /* ignore parse error */ }
        }

        if (!token) {
          if (mounted) {
            setUser(null);
            setStatus('unauthenticated');
          }
          return;
        }

        try {
          const { user: me } = await authApi.me();
          if (mounted) {
            await SecureStore.setItemAsync('auth_user', JSON.stringify(me));
            setUser(me);
            setStatus('authenticated');
          }
        } catch (err: any) {
          const isUnauthorized = err?.status === 401;
          if (isUnauthorized) {
            if (mounted) {
              setUser(null);
              setStatus('unauthenticated');
              await SecureStore.deleteItemAsync('auth_token');
              await SecureStore.deleteItemAsync('auth_user');
            }
          } else {
            // Network error / offline / timeout / server down — fallback to cached user
            if (cachedUser && mounted) {
              console.log('[AuthContext] App is offline — restoring session from cached user profile:', cachedUser.email);
              setUser(cachedUser);
              setStatus('authenticated');
            } else if (mounted) {
              setUser(null);
              setStatus('unauthenticated');
            }
          }
        }
      } catch {
        if (mounted) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const { user: loggedIn } = await authApi.login({ email, password });
    await SecureStore.setItemAsync('auth_user', JSON.stringify(loggedIn));
    setUser(loggedIn);
    setStatus('authenticated');
    return loggedIn;
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<AuthUser> => {
    const { user: created } = await authApi.register(data);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(created));
    setUser(created);
    setStatus('authenticated');
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_refresh_token');
      await SecureStore.deleteItemAsync('auth_user');
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser> => {
    const { user: me } = await authApi.me();
    await SecureStore.setItemAsync('auth_user', JSON.stringify(me));
    setUser(me);
    return me;
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      status,
      isOwner: user?.role === 'owner',
      isCashier: user?.role === 'cashier',
      isAuthenticated: status === 'authenticated',
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, status, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
