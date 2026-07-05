// Sanctum Typography System
// Complete scale with Lora (intimate, literary) and DM Sans (humanist, unobtrusive)

import { TextStyle } from 'react-native';

const fontFamilies = {
  lora: 'Lora_400Regular',
  loraBold: 'Lora_700Bold',
  dmSans: 'DMSans_400Regular',
  dmSansMedium: 'DMSans_500Medium',
  dmSansBold: 'DMSans_700Bold',
} as const;

// Display font (Lora) — used for Juliet's messages and room prompts
export const display: Record<string, TextStyle> = {
  xl: {
    fontFamily: fontFamilies.lora,
    fontSize: 26,
    fontWeight: '400',
    lineHeight: 38,
  },
  lg: {
    fontFamily: fontFamilies.lora,
    fontSize: 21,
    fontWeight: '400',
    lineHeight: 32,
  },
  md: {
    fontFamily: fontFamilies.lora,
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 27,
  },
} as const;

// UI font (DM Sans) — used for all interface elements
export const ui: Record<string, TextStyle> = {
  label: {
    fontFamily: fontFamilies.dmSansMedium,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: fontFamilies.dmSans,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  button: {
    fontFamily: fontFamilies.dmSansMedium,
    fontSize: 14,
    fontWeight: '500',
  },
  caption: {
    fontFamily: fontFamilies.dmSans,
    fontSize: 12,
    fontWeight: '400',
  },
  micro: {
    fontFamily: fontFamilies.dmSans,
    fontSize: 11,
    fontWeight: '400',
  },
} as const;

export const typography = {
  display,
  ui,
  fontFamilies,
} as const;

export type DisplayVariant = keyof typeof display;
export type UIVariant = keyof typeof ui;