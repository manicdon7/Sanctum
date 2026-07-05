// Sanctum Color Palette
// Every color value defined here, never hardcoded

export const palette = {
  // Dark mode (primary experience — build dark first)
  dark: {
    bg_base: '#0F0D0B',       // warm near-black, like a room at night
    bg_surface: '#181511',     // slightly lifted
    bg_card: '#211E19',       // card surfaces
    bg_elevated: '#2A2520',   // toasts, modals
    
    text_primary: '#EDE0CF',   // warm off-white, not glaring
    text_secondary: '#A89880', // muted warm sand
    text_muted: '#6B5C4C',    // very muted, for labels only
    text_ghost: '#3D3329',    // barely visible — timestamps, hints
    
    accent: '#C17F3E',        // warm amber — used sparingly
    accent_dim: '#8A5A2B',    // darker amber for pressed states
    accent_glow: 'rgba(193,127,62,0.15)', // for soft halos
    
    juliet: '#9B7FA8',        // Juliet's presence color — soft purple-lavender
    juliet_dim: 'rgba(155,127,168,0.12)', // her message bg
    
    danger: '#A0523A',        // muted red, for crisis only
    divider: 'rgba(255,255,255,0.06)',
  },
  
  // Light mode (secondary — same structure, warmer)
  light: {
    bg_base: '#F5F0E8',
    bg_surface: '#EDE8DF',
    bg_card: '#E5DFD5',
    bg_elevated: '#DDD7CC',
    
    text_primary: '#1C1714',
    text_secondary: '#5C4E40',
    text_muted: '#9A8878',
    text_ghost: '#C4B5A5',
    
    accent: '#B5722E',
    accent_dim: '#8A5520',
    accent_glow: 'rgba(181,114,46,0.15)',
    
    juliet: '#7B5E8A',
    juliet_dim: 'rgba(123,94,138,0.10)',
    
    danger: '#A0523A',
    divider: 'rgba(0,0,0,0.06)',
  },
  
  // Time-of-day background palette (24-hour cycle)
  timeOfDay: {
    dawn: '#0C0B12',      // 04:00 - 07:00: deep indigo-black
    morning: '#0F0D0B',   // 07:00 - 12:00: warm brown-black, slight amber undertone
    afternoon: '#0F0D0B', // 12:00 - 17:00: neutral dark, most neutral state
    evening: '#1A1611',   // 17:00 - 20:00: deeper amber undertone, golden hour
    night: '#0C0B12',     // 20:00 - 24:00: back to cool indigo depth
  },
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof palette.dark;