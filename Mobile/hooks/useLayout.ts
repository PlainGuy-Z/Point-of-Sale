import { useWindowDimensions } from 'react-native';

export type LayoutMode = 
  | 'phone-portrait'
  | 'phone-landscape' 
  | 'tablet-portrait'
  | 'tablet-landscape';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  
  const isLandscape = width > height;
  const minDimension = Math.min(width, height);
  const isTablet = minDimension >= 768;
  
  const mode: LayoutMode = 
    isTablet && isLandscape  ? 'tablet-landscape' :
    isTablet && !isLandscape ? 'tablet-portrait'  :
    !isTablet && isLandscape ? 'phone-landscape'  :
                               'phone-portrait';
  
  return {
    width,
    height,
    isLandscape,
    isTablet,
    mode,
    // Column helpers
    numStatColumns: 
      mode === 'tablet-landscape' ? 4 :
      mode === 'tablet-portrait'  ? 4 :
      mode === 'phone-landscape'  ? 4 :
      2,  // phone-portrait
    // Split layout for tablet landscape
    showSplitLayout: 
      mode === 'tablet-landscape' || 
      mode === 'tablet-portrait',
    // Spacing scale
    spacing: isTablet ? 16 : 12,
    cardPadding: isTablet ? 20 : 14,
    titleSize: isTablet ? 24 : 18,
    statSize: isTablet ? 28 : 22,
    labelSize: isTablet ? 12 : 10,
  };
}
