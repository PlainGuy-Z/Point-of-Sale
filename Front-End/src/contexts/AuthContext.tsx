/* eslint-disable react-refresh/only-export-components -- Provider + hook in one module */
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { AuthUser, AuthStatus } from '../types';
import { authApi } from '../services/authApi';
import type { RegisterData } from '../services/authApi';

interface AuthContextType {
  user: AuthUser | null;
  status: AuthStatus;
  isOwner: boolean;
  isCashier: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
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
        const { user: me } = await authApi.me();
        if (mounted) {
          setUser(me);
          setStatus('authenticated');
        }
      } catch {
        // 401 or network error — user is not logged in
        if (mounted) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    })();

    // Listen for unauthorized events from API layer
    const handleUnauthorized = () => {
      if (mounted) {
        setUser(null);
        setStatus('unauthenticated');
      }
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);

    return () => {
      mounted = false;
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedIn } = await authApi.login({ email, password });
    setUser(loggedIn);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout API failed:', err);
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const { user: created } = await authApi.register(data);
    setUser(created);
    setStatus('authenticated');
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      status,
      isOwner: user?.role === 'owner',
      isCashier: user?.role === 'cashier',
      isAuthenticated: status === 'authenticated',
      login,
      logout,
      register,
    }),
    [user, status, login, logout, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

