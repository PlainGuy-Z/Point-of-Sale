import { useColors as useThemeColors } from '../utils/theme';
import type { ThemeColors } from '../utils/theme';

export function useColors(): { colors: ThemeColors; isDark: boolean } {
  return useThemeColors();
}
