// Sanctum Border Radius System
// Nothing sharp. Nothing that reads "spreadsheet."

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

// Semantic mappings
export const borderRadius = {
  card: radius.lg,        // Cards: 18
  input: radius.md,       // Input fields: 12  
  orb: radius.pill,       // Orbs/dots: 999 (circle)
  button: radius.md,      // Buttons: 12
} as const;

export type RadiusKey = keyof typeof radius;