import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const getIconComponent = (iconName: string): LucideIcon | null => {
  const IconComponent = (LucideIcons as any)[iconName] as LucideIcon;
  return IconComponent || null;
};