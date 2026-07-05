/**
 * Sanctum Typography System
 * Font scale, weights, line heights, letter spacing.
 * Never set raw font values outside this file.
 */

export const fontFamilies = {
  ui: 'NunitoSans',           // all chrome, buttons, labels, nav
  journal: 'SourceSerif4',    // journal entries, companion text, prompts
  mono: 'SpaceMono',          // code snippets in knowledge garden only
  uiFallback: 'System',
  journalFallback: 'serif',
} as const;

/** sp = scale-independent pixels */
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  // 700/800 intentionally excluded — feels aggressive against warm palette
} as const;

export const lineHeight = {
  tight: 1.3,
  normal: 1.5,
  body: 1.65,   // journal text needs room to breathe
  loose: 1.8,
} as const;

export const letterSpacing = {
  heading: -0.2,  // headings 20sp+
  body: 0,
  label: 0.2,
} as const;

export const typography = {
  /** Large display headings */
  display: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.regular,
    lineHeight: fontSize['3xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.heading,
  },
  /** Section headings */
  heading: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xl * lineHeight.normal,
    letterSpacing: letterSpacing.heading,
  },
  /** Subheadings / card titles */
  subheading: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.lg * lineHeight.normal,
    letterSpacing: letterSpacing.heading,
  },
  /** Journal / companion body text */
  journalBody: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.md * lineHeight.body,
    letterSpacing: letterSpacing.body,
  },
  /** UI body text */
  body: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.base * lineHeight.normal,
    letterSpacing: letterSpacing.body,
  },
  /** UI labels, buttons, nav */
  label: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.label,
  },
  /** Small captions, timestamps */
  caption: {
    fontFamily: fontFamilies.ui,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.label,
  },
  /** Tab bar labels */
  tabLabel: {
    fontFamily: fontFamilies.ui,
    fontSize: 11,
    fontWeight: fontWeight.medium,
    lineHeight: 14,
    letterSpacing: letterSpacing.label,
  },
  /** Prompt display text */
  prompt: {
    fontFamily: fontFamilies.journal,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.md * lineHeight.body,
    letterSpacing: letterSpacing.body,
  },
  /** Monospace for code */
  mono: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.sm * lineHeight.body,
    letterSpacing: 0,
  },
} as const;
