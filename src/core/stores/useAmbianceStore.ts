// Ambiance Store — active sounds, volume levels
// Manages multi-track audio layering and volume controls

import { create } from 'zustand';

export interface ActiveSound {
  id: string;
  volume: number; // 0-1
  isPlaying: boolean;
}

export interface AmbianceState {
  activeSounds: Record<string, ActiveSound>;
  masterVolume: number;
  layerMode: boolean; // true = multiple sounds, false = single sound
  isDucking: boolean; // when Juliet speaks, duck ambient volume
}

export interface AmbianceActions {
  toggleSound: (soundId: string) => void;
  setSoundVolume: (soundId: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  setLayerMode: (enabled: boolean) => void;
  setDucking: (ducking: boolean) => void;
  stopAllSounds: () => void;
  activatePreset: (sounds: Record<string, number>) => void;
}

export type AmbianceStore = AmbianceState & AmbianceActions;

export const useAmbianceStore = create<AmbianceStore>()((set, get) => ({
  // Initial state
  activeSounds: {},
  masterVolume: 0.7,
  layerMode: true,
  isDucking: false,
  
  // Actions
  toggleSound: (soundId: string) => {
    const { activeSounds, layerMode } = get();
    
    if (activeSounds[soundId]?.isPlaying) {
      // Turn off this sound
      set((state) => {
        const newActiveSounds = { ...state.activeSounds };
        delete newActiveSounds[soundId];
        return { activeSounds: newActiveSounds };
      });
    } else {
      // Turn on this sound
      const newSound: ActiveSound = {
        id: soundId,
        volume: 0.8,
        isPlaying: true,
      };
      
      if (!layerMode) {
        // Single sound mode - turn off all others
        set({ activeSounds: { [soundId]: newSound } });
      } else {
        // Layer mode - add to existing sounds
        set((state) => ({
          activeSounds: {
            ...state.activeSounds,
            [soundId]: newSound,
          },
        }));
      }
    }
  },
  
  setSoundVolume: (soundId: string, volume: number) => {
    set((state) => {
      if (state.activeSounds[soundId]) {
        return {
          activeSounds: {
            ...state.activeSounds,
            [soundId]: {
              ...state.activeSounds[soundId],
              volume: Math.max(0, Math.min(1, volume)),
            },
          },
        };
      }
      return state;
    });
  },
  
  setMasterVolume: (volume: number) => {
    set({ masterVolume: Math.max(0, Math.min(1, volume)) });
  },
  
  setLayerMode: (enabled: boolean) => {
    set({ layerMode: enabled });
    
    if (!enabled) {
      // If switching to single mode, keep only the first active sound
      const activeSounds = get().activeSounds;
      const firstSoundId = Object.keys(activeSounds)[0];
      
      if (firstSoundId) {
        set({
          activeSounds: {
            [firstSoundId]: activeSounds[firstSoundId],
          },
        });
      }
    }
  },
  
  setDucking: (ducking: boolean) => {
    set({ isDucking: ducking });
  },
  
  stopAllSounds: () => {
    set({ activeSounds: {} });
  },
  
  activatePreset: (sounds: Record<string, number>) => {
    const newActiveSounds: Record<string, ActiveSound> = {};
    
    Object.entries(sounds).forEach(([soundId, volume]) => {
      newActiveSounds[soundId] = {
        id: soundId,
        volume: Math.max(0, Math.min(1, volume)),
        isPlaying: true,
      };
    });
    
    set({ activeSounds: newActiveSounds });
  },
}));