/**
 * Sanctum Color System
 *
 * Single source of truth for all colors.
 * Never hardcode hex values outside this file.
 */

export const palette = {
  // ── Warm dark neutrals ────────────────────────────────────────────────────
  espresso:         '#1A1714',   // deepest bg
  darkSurface:      '#211E1A',   // card bg in dark
  darkSurfaceRaised:'#2A2520',   // elevated surface in dark
  darkBorder:       '#3A342E',   // border in dark mode
  darkDivider:      '#2E2922',   // list dividers

  // ── Warm light neutrals ───────────────────────────────────────────────────
  warmWhite:        '#FAF7F2',   // page bg in light
  warmSurface:      '#F3EEE6',   // card bg in light
  warmSurfaceRaised:'#FFFFFF',   // elevated surface in light
  lightBorder:      '#E8E1D6',   // border in light
  lightDivider:     '#EDE8DF',   // list dividers in light

  // ── Room accent colors ────────────────────────────────────────────────────
  amber:      '#D4903A',  // room home / primary action
  dustyBlue:  '#6A8EA4',  // vent corner
  sage:       '#6C9070',  // learning nook
  terracotta: '#A86550',  // creation desk
  deepMoss:   '#3E7267',  // knowledge garden

  // ── Text ─────────────────────────────────────────────────────────────────
  inkDark:          '#22190F',  // primary text, light mode
  inkSecondaryDark: '#6B5C4E',  // secondary text, light mode
  inkMutedDark:     '#9C8E82',  // muted text, light mode

  inkLight:          '#EDE8DF', // primary text, dark mode
  inkSecondaryLight: '#9A8D82', // secondary text, dark mode
  inkMutedLight:     '#6A6057', // muted text, dark mode

  // ── Semantic ─────────────────────────────────────────────────────────────
  crisis:      '#C0392B', // ONLY for crisis resource surfacing
  success:     '#3D8B5C', // success states
  white:       '#FFFFFF',
  transparent: 'transparent',

  // ── Input / Form ─────────────────────────────────────────────────────────
  inputDark:  '#252119',  // text input bg in dark
  inputLight: '#F0EBE2',  // text input bg in light
} as const;

export type ColorTheme = {
  background: string;
  surface: string;
  surfaceRaised: string;
  inputBg: string;
  text: { primary: string; secondary: string; muted: string };
  border: string;
  divider: string;
  rooms: { home: string; vent: string; learning: string; creation: string; garden: string };
  crisis: string;
  success: string;
};

export const lightColors: ColorTheme = {
  background:    palette.warmWhite,
  surface:       palette.warmSurface,
  surfaceRaised: palette.warmSurfaceRaised,
  inputBg:       palette.inputLight,
  text: {
    primary:   palette.inkDark,
    secondary: palette.inkSecondaryDark,
    muted:     palette.inkMutedDark,
  },
  border:  palette.lightBorder,
  divider: palette.lightDivider,
  rooms: {
    home:     palette.amber,
    vent:     palette.dustyBlue,
    learning: palette.sage,
    creation: palette.terracotta,
    garden:   palette.deepMoss,
  },
  crisis:  palette.crisis,
  success: palette.success,
};

export const darkColors: ColorTheme = {
  background:    palette.espresso,
  surface:       palette.darkSurface,
  surfaceRaised: palette.darkSurfaceRaised,
  inputBg:       palette.inputDark,
  text: {
    primary:   palette.inkLight,
    secondary: palette.inkSecondaryLight,
    muted:     palette.inkMutedLight,
  },
  border:  palette.darkBorder,
  divider: palette.darkDivider,
  rooms: {
    home:     palette.amber,
    vent:     palette.dustyBlue,
    learning: palette.sage,
    creation: palette.terracotta,
    garden:   palette.deepMoss,
  },
  crisis:  palette.crisis,
  success: palette.success,
};
