import { createContext } from 'react';
import type { AuthUser, AuthStatus } from '../types';
import type { RegisterData } from '../services/authApi';

export interface AuthContextType {
  user: AuthUser | null;
  status: AuthStatus;
  isOwner: boolean;
  isCashier: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
