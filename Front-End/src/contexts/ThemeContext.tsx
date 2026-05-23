/* eslint-disable react-refresh/only-export-components -- Provider + hook in one module */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react'; 

type ThemeMode = 'light' | 'dark' | 'system';
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme; // actual applied theme
  mode: ThemeMode; // user preference
  effectiveTheme: Theme; // alias for applied theme
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('coffee-pos-theme') as ThemeMode;
      if (['light', 'dark', 'system'].includes(saved)) return saved;
    }
    return 'system';
  });

  const [theme, setTheme] = useState<Theme>('dark');
  const [effectiveTheme, setEffectiveTheme] = useState<Theme>('dark');

  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (val: Theme) => {
      root.classList.remove('light', 'dark');
      root.classList.add(val);
      setTheme(val);
      setEffectiveTheme(val);
    };

    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme(mediaQuery.matches ? 'dark' : 'light');
      
      handleChange();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(mode);
    }

    localStorage.setItem('coffee-pos-theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setModeState(prev => {
      if (prev === 'system') {
        return theme === 'dark' ? 'light' : 'dark';
      }
      return prev === 'light' ? 'dark' : 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, effectiveTheme, setMode: setModeState, toggleTheme }}>
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