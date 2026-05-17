import type { LucideIcon } from 'lucide-react';

export interface SettingsNavItem {
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  requiresSetup?: boolean;
}
