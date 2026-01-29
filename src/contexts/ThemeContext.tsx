import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react'; 

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Cek localStorage atau default ke light
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('coffee-pos-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Hapus class lama
    root.classList.remove('light', 'dark');
    
    // Tambah class baru
    root.classList.add(theme);
    
    // Simpan ke localStorage
    localStorage.setItem('coffee-pos-theme', theme);
    
    console.log('Theme changed to:', theme); // Debug
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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