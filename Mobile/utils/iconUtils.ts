// Icon utilities for React Native
import * as Icons from 'lucide-react-native';

export type IconName = keyof typeof Icons;

export function getIconComponent(iconName: string): React.ComponentType<any> | null {
  const icon = (Icons as any)[iconName];
  if (icon && typeof icon === 'function') {
    return icon;
  }
  return null;
}
