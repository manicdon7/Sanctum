// Sanctum Shadow System
// Subtle, warm-tinted shadows (never pure grey)

import { ViewStyle } from 'react-native';

export const shadows: Record<string, ViewStyle> = {
  card: {
    shadowColor: 'rgba(0,0,0,0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8, // Android
  },
  
  elevated: {
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 12, // Android
  },
  
  juliet: {
    shadowColor: 'rgba(155,127,168,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6, // Android
  },
} as const;

export type ShadowVariant = keyof typeof shadows;