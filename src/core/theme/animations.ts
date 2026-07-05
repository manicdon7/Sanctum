import { Easing } from 'react-native-reanimated';

/**
 * Sanctum Animation Constants
 * All animation durations and easing curves defined here.
 * Never use the core React Native Animated API — use Reanimated v3.
 */

export const durations = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 450,
  flip: 350,       // flashcard 3D flip
  ambient: 6000,   // room prompt breathing cycle
  ambientSlow: 8000, // graph node drift cycle
  gradient: 2000,  // time-of-day gradient transition
} as const;

export const springs = {
  /** Default spring for most UI interactions */
  default: {
    damping: 18,
    stiffness: 180,
    mass: 1,
  },
  /** Overshoot spring for mood emoji bounce */
  overshoot: {
    damping: 12,
    stiffness: 200,
    mass: 0.8,
  },
  /** Gentle spring for card reveals */
  gentle: {
    damping: 24,
    stiffness: 120,
    mass: 1,
  },
} as const;

/**
 * Easing presets using Reanimated's Easing module.
 * These are created lazily to avoid import issues before the
 * Reanimated worklet is set up.
 */
export const easings = {
  /** Default easing for most transitions */
  default: Easing.out(Easing.cubic),
  /** Ease in for close/dismiss transitions */
  close: Easing.in(Easing.cubic),
  /** Overshoot for mood bounce */
  overshoot: Easing.out(Easing.back(1.4)),
  /** Ambient sinusoidal breathing */
  ambient: Easing.inOut(Easing.sin),
  /** Smooth arc fill for skill charts */
  smooth: Easing.out(Easing.cubic),
} as const;

/**
 * Breathing animation config for the prompt card.
 * scale: 1.0 → 1.015 → 1.0 on repeat
 */
export const breathingConfig = {
  minScale: 1.0,
  maxScale: 1.015,
  duration: durations.ambient,
  easing: easings.ambient,
} as const;

/**
 * Node drift config for knowledge garden graph.
 * Each node gets an independent random phase offset on mount.
 */
export const nodeDriftConfig = {
  amplitude: 2.5,        // px
  minPeriod: 6000,       // ms
  maxPeriod: 10000,      // ms
} as const;
