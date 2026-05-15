/* eslint-disable react-refresh/only-export-components -- Provider + hook in one module */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react'; 

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark'; // The actual theme being applied
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('coffee-pos-theme') as Theme;
      if (['light', 'dark', 'system'].includes(saved)) return saved;
    }
    return 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (val: 'light' | 'dark') => {
      root.classList.remove('light', 'dark');
      root.classList.add(val);
      setEffectiveTheme(val);
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme(mediaQuery.matches ? 'dark' : 'light');
      
      handleChange();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(theme);
    }

    localStorage.setItem('coffee-pos-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => {
      if (prev === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
      return prev === 'light' ? 'dark' : 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme: setThemeState, toggleTheme }}>
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