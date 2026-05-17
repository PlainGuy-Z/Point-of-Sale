/**
 * Shared theme color tokens for the SmartPOS mobile app.
 * Mirrors the web design system: dark mode uses amber/stone palette,
 * light mode uses teal/slate palette.
 */

export interface ThemeColors {
  // Backgrounds
  bg: string;
  bgCard: string;
  bgInput: string;
  bgHover: string;
  bgElevated: string;

  // Borders
  border: string;
  borderLight: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Accent (primary action color)
  accent: string;
  accentLight: string;
  accentBg: string;

  // Status colors
  success: string;
  successBg: string;
  error: string;
  errorBg: string;
  warning: string;
  warningBg: string;

  // Gradient pairs
  gradientFrom: string;
  gradientTo: string;

  // Tab / Navigation
  tabActive: string;
  tabInactive: string;
}

export const darkColors: ThemeColors = {
  bg: '#111111',
  bgCard: '#1a1a1a',
  bgInput: '#222222',
  bgHover: '#252525',
  bgElevated: '#1e1e1e',

  border: '#2a2a2a',
  borderLight: '#2e2e2e',

  text: '#ffffff',
  textSecondary: '#a8a29e',
  textMuted: '#78716c',
  textInverse: '#000000',

  accent: '#f59e0b',
  accentLight: '#fbbf24',
  accentBg: 'rgba(245,158,11,0.12)',

  success: '#10b981',
  successBg: 'rgba(16,185,129,0.15)',
  error: '#ef4444',
  errorBg: 'rgba(239,68,68,0.1)',
  warning: '#f59e0b',
  warningBg: 'rgba(245,158,11,0.1)',

  gradientFrom: '#f59e0b',
  gradientTo: '#ea580c',

  tabActive: '#f59e0b',
  tabInactive: '#444444',
};

export const lightColors: ThemeColors = {
  bg: '#ffffff',
  bgCard: '#ffffff',
  bgInput: '#f8fafc',
  bgHover: '#f1f5f9',
  bgElevated: '#f8fafc',

  border: '#e2e8f0',
  borderLight: '#cbd5e1',

  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',

  accent: '#0d9488',
  accentLight: '#14b8a6',
  accentBg: 'rgba(13,148,136,0.08)',

  success: '#059669',
  successBg: 'rgba(5,150,105,0.1)',
  error: '#dc2626',
  errorBg: 'rgba(220,38,38,0.08)',
  warning: '#d97706',
  warningBg: 'rgba(217,119,6,0.08)',

  gradientFrom: '#0d9488',
  gradientTo: '#059669',

  tabActive: '#0d9488',
  tabInactive: '#94a3b8',
};

export function getColors(isDark: boolean): ThemeColors {
  return isDark ? darkColors : lightColors;
}
