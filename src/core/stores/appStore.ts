/**
 * Sanctum Global App Store — Zustand
 *
 * Manages: authentication state, encryption key (in-memory only),
 * ambiance settings, reduce-motion preference.
 *
 * The encryption key lives here in memory only during an unlocked session.
 * On lock, it is cleared from state immediately.
 */

import { create } from 'zustand';

export type RoomId = 'vent' | 'learning' | 'creation' | 'garden';

export type AmbientTrack = 'none' | 'rain' | 'lofi';

interface AppState {
  // Auth
  isUnlocked: boolean;
  encryptionKey: Uint8Array | null; // in-memory only, never persisted in this store

  // Ambiance
  ambientTrack: AmbientTrack;
  ambientVolume: number; // 0-100
  reduceMotion: boolean;

  // UI
  colorScheme: 'light' | 'dark' | 'system';
  lastVisitedRooms: Partial<Record<RoomId, number>>; // roomId → timestamp

  // Settings flags (loaded from DB settings table on unlock)
  decoyModeEnabled: boolean;
  decoyActive: boolean;
  biometricEnabled: boolean;
  syncEnabled: boolean;
  aiModelChoice: 'local-gemma' | 'local-phi' | 'cloud' | null;
  aiModelDownloaded: boolean;
  companionUseCloud: boolean;
  hasSeenGrowthDisclosure: boolean;

  // Actions
  unlock: (key: Uint8Array) => void;
  lock: () => void;
  setAmbientTrack: (track: AmbientTrack) => void;
  setAmbientVolume: (volume: number) => void;
  setReduceMotion: (value: boolean) => void;
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
  setLastVisited: (roomId: RoomId) => void;
  setDecoyMode: (enabled: boolean) => void;
  setDecoyActive: (active: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setSyncEnabled: (enabled: boolean) => void;
  setAiModelChoice: (choice: AppState['aiModelChoice']) => void;
  setAiModelDownloaded: (downloaded: boolean) => void;
  setCompanionUseCloud: (useCloud: boolean) => void;
  setHasSeenGrowthDisclosure: (seen: boolean) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  // Auth
  isUnlocked: false,
  encryptionKey: null,

  // Ambiance defaults
  ambientTrack: 'none',
  ambientVolume: 60,
  reduceMotion: false,

  // UI defaults
  colorScheme: 'system',
  lastVisitedRooms: {},

  // Settings defaults
  decoyModeEnabled: false,
  decoyActive: false,
  biometricEnabled: false,
  syncEnabled: false,
  aiModelChoice: null,
  aiModelDownloaded: false,
  companionUseCloud: false,
  hasSeenGrowthDisclosure: false,

  // Auth actions
  unlock: (key) => set({ isUnlocked: true, encryptionKey: key }),
  lock: () => set({ isUnlocked: false, encryptionKey: null, decoyActive: false }),

  // Ambiance actions
  setAmbientTrack: (track) => set({ ambientTrack: track }),
  setAmbientVolume: (volume) => set({ ambientVolume: Math.max(0, Math.min(100, volume)) }),
  setReduceMotion: (value) => set({ reduceMotion: value }),

  // UI actions
  setColorScheme: (scheme) => set({ colorScheme: scheme }),
  setLastVisited: (roomId) =>
    set((state) => ({
      lastVisitedRooms: { ...state.lastVisitedRooms, [roomId]: Date.now() },
    })),

  // Settings actions
  setDecoyMode: (enabled) => set({ decoyModeEnabled: enabled }),
  setDecoyActive: (active) => set({ decoyActive: active }),
  setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),
  setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),
  setAiModelChoice: (choice) => set({ aiModelChoice: choice }),
  setAiModelDownloaded: (downloaded) => set({ aiModelDownloaded: downloaded }),
  setCompanionUseCloud: (useCloud) => set({ companionUseCloud: useCloud }),
  setHasSeenGrowthDisclosure: (seen) => set({ hasSeenGrowthDisclosure: seen }),
}));
