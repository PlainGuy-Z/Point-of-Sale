import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, useTransition, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const [theme, setThemeState] = useState<Theme>('light');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadDone = useRef(false);
  const [, startTransition] = useTransition();

  // Load saved theme from AsyncStorage on mount (only once)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('coffee-pos-theme');
        if (mounted) {
          const validTheme = (saved === 'light' || saved === 'dark' || saved === 'system') ? saved : 'light';
          setThemeState(validTheme);
          initialLoadDone.current = true;
        }
      } catch (err) {
        console.error('Failed to load theme:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Update effective theme based on current theme setting and system preference
  useEffect(() => {
    if (theme === 'system') {
      setEffectiveTheme(systemTheme);
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme, systemTheme]);

  // Save theme to AsyncStorage whenever it changes (skip on initial load)
  useEffect(() => {
    if (!initialLoadDone.current || isLoading) return;
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem('coffee-pos-theme', theme);
      } catch (err) {
        console.error('Failed to save theme:', err);
      }
    };
    saveTheme();
  }, [theme, isLoading]);

  const setTheme = useCallback((t: Theme) => {
    startTransition(() => {
      setThemeState(t);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    startTransition(() => {
      setThemeState((prev) => {
        if (prev === 'system') {
          return systemTheme === 'dark' ? 'light' : 'dark';
        }
        return prev === 'light' ? 'dark' : 'light';
      });
    });
  }, [systemTheme]);

  const value = useMemo<ThemeContextType>(
    () => ({ theme, effectiveTheme, setTheme, toggleTheme }),
    [theme, effectiveTheme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
