// App Store — auth state, room state, ambiance
// One store per domain as specified

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppState {
  // Authentication & onboarding
  isAuthenticated: boolean;
  biometricEnabled: boolean;
  onboardingCompleted: boolean;
  
  // Room state
  currentMoodIndex: number | null;
  lastNoteTimestamp: number | null;
  
  // Theme
  colorScheme: 'light' | 'dark' | 'system';
  timeOfDayBackground: boolean;
  reduceAnimations: boolean;
}

export interface AppActions {
  setAuthenticated: (authenticated: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setCurrentMood: (moodIndex: number) => void;
  setLastNoteTimestamp: (timestamp: number) => void;
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
  setTimeOfDayBackground: (enabled: boolean) => void;
  setReduceAnimations: (reduce: boolean) => void;
}

export type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      biometricEnabled: false,
      onboardingCompleted: false,
      currentMoodIndex: null,
      lastNoteTimestamp: null,
      colorScheme: 'dark', // Dark mode is primary experience
      timeOfDayBackground: true,
      reduceAnimations: false,
      
      // Actions
      setAuthenticated: (authenticated: boolean) => {
        set({ isAuthenticated: authenticated });
      },
      
      setBiometricEnabled: (enabled: boolean) => {
        set({ biometricEnabled: enabled });
      },
      
      setOnboardingCompleted: (completed: boolean) => {
        set({ onboardingCompleted: completed });
      },
      
      setCurrentMood: (moodIndex: number) => {
        set({ 
          currentMoodIndex: moodIndex,
          lastNoteTimestamp: Date.now(),
        });
      },
      
      setLastNoteTimestamp: (timestamp: number) => {
        set({ lastNoteTimestamp: timestamp });
      },
      
      setColorScheme: (scheme: 'light' | 'dark' | 'system') => {
        set({ colorScheme: scheme });
      },
      
      setTimeOfDayBackground: (enabled: boolean) => {
        set({ timeOfDayBackground: enabled });
      },
      
      setReduceAnimations: (reduce: boolean) => {
        set({ reduceAnimations: reduce });
      },
    }),
    {
      name: 'sanctum-app-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);