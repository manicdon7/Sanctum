// Sanctum Animation Constants
// Duration, easing, and spring configurations

import { Easing } from 'react-native-reanimated';

export const animations = {
  // Duration constants
  duration: {
    fast: 200,
    normal: 350,
    slow: 500,
    breathing: 1500,    // for audio fade in/out
    thinking: 800,      // Juliet's thinking pause
    julietPulse: 4000,  // normal Juliet dot pulse cycle
    julietActive: 1200, // Juliet processing pulse cycle
    julietWaiting: 6000, // when user hasn't spoken in 48h
  },
  
  // Easing curves
  easing: {
    standard: Easing.out(Easing.cubic),
    gentle: Easing.inOut(Easing.cubic),
    bounce: Easing.elastic(1.2),
    breathe: Easing.inOut(Easing.sin),
  },
  
  // Spring configurations for reanimated
  spring: {
    gentle: {
      damping: 20,
      stiffness: 200,
    },
    bouncy: {
      damping: 15,
      stiffness: 400,
    },
    soft: {
      damping: 25,
      stiffness: 150,
    },
  },
} as const;

export type AnimationDuration = keyof typeof animations.duration;
export type AnimationEasing = keyof typeof animations.easing;