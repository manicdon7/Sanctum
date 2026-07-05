/**
 * Sanctum Spacing & Shape System
 * Use only values from this scale. No arbitrary numbers elsewhere.
 */

/** Spacing scale in dp */
export const spacing = {
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type SpacingKey = keyof typeof spacing;

/** Border radii */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

/**
 * Elevation / shadow tokens
 * Avoid Material-style drop shadows. Instead: subtle border + slightly
 * different background. The border color values are applied as the
 * `borderColor` prop on Card components.
 */
export const elevation = {
  none: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  low: {
    borderWidth: 0.5,
    // Colors provided at usage time from theme (light vs dark differ)
  },
  medium: {
    borderWidth: 1,
  },
} as const;

/** Hit slop — ensures comfortable tap targets (min 44×44 per HIG) */
export const hitSlop = {
  sm: { top: 8, bottom: 8, left: 8, right: 8 },
  md: { top: 12, bottom: 12, left: 12, right: 12 },
  lg: { top: 16, bottom: 16, left: 16, right: 16 },
} as const;

/**
 * Layout constants — consistent across all screens.
 * Use these instead of ad-hoc padding values.
 */
export const layout = {
  screenPadding:   20,  // horizontal page padding
  sectionGap:      24,  // gap between page sections
  cardGap:         12,  // gap between cards in a list
  headerHeight:    56,  // standard header height
  tabBarHeight:    64,  // floating tab bar height (not counting safe area)
  fab:             56,  // floating action button size
} as const;

/**
 * Card shadow — subtle, warm-toned.
 * Import and spread directly: ...cardShadow
 */
export const cardShadow = {
  shadowColor: '#1A1714',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
  elevation: 3,
} as const;
