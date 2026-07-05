/**
 * Sanctum Theme — single import point
 * import { colors, typography, spacing, radius, animations } from '@/core/theme';
 */

export { lightColors, darkColors, palette } from './colors';
export type { ColorTheme } from './colors';

export { typography, fontFamilies, fontSize, fontWeight, lineHeight, letterSpacing } from './typography';

export { spacing, radius, elevation, hitSlop } from './spacing';
export type { SpacingKey } from './spacing';

export { durations, springs, easings, breathingConfig, nodeDriftConfig } from './animations';
