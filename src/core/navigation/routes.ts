// Navigation Route Definitions
// All screen names and types

export const routes = {
  // Onboarding flow
  OnboardingWelcome: 'OnboardingWelcome',
  OnboardingName: 'OnboardingName', 
  OnboardingJuliet: 'OnboardingJuliet',
  
  // Main app tabs
  Room: 'Room',
  Juliet: 'Juliet',
  Sounds: 'Sounds',
  Settings: 'Settings',
  
  // Modal screens (if needed)
  BiometricAuth: 'BiometricAuth',
} as const;

export type RouteNames = typeof routes[keyof typeof routes];

// Stack parameter lists
export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingName: undefined;
  OnboardingJuliet: { userName: string };
};

export type MainTabParamList = {
  Room: undefined;
  Juliet: undefined;
  Sounds: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  BiometricAuth: undefined;
};