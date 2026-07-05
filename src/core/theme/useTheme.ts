// Theme Hook
// Provides current theme colors and utilities

import { useColorScheme } from 'react-native';
import { palette, type ColorScheme, type ThemeColors } from './colors';

export function useTheme() {
  const systemColorScheme = useColorScheme();
  
  // For now, always use dark mode as specified (primary experience)
  // Later this will read from user settings
  const colorScheme: ColorScheme = 'dark';
  
  const colors: ThemeColors = palette[colorScheme];
  
  return {
    colors,
    colorScheme,
    isDark: colorScheme === 'dark',
  };
}