// Music Store — queue, playback state
// Handles device music library and playback controls

import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  uri: string;
  albumArt?: string;
}

export interface MusicState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  position: number; // in seconds
  shuffleEnabled: boolean;
  repeatMode: 'off' | 'one' | 'all';
  volume: number;
}

export interface MusicActions {
  setCurrentTrack: (track: Track | null) => void;
  setQueue: (queue: Track[]) => void;
  addToQueue: (track: Track) => void;
  setPlaying: (playing: boolean) => void;
  setPosition: (position: number) => void;
  setShuffle: (enabled: boolean) => void;
  setRepeatMode: (mode: 'off' | 'one' | 'all') => void;
  setVolume: (volume: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  clearQueue: () => void;
}

export type MusicStore = MusicState & MusicActions;

export const useMusicStore = create<MusicStore>()((set, get) => ({
  // Initial state
  currentTrack: null,
  queue: [],
  isPlaying: false,
  position: 0,
  shuffleEnabled: false,
  repeatMode: 'off',
  volume: 0.8,
  
  // Actions
  setCurrentTrack: (track: Track | null) => {
    set({ currentTrack: track, position: 0 });
  },
  
  setQueue: (queue: Track[]) => {
    set({ queue });
  },
  
  addToQueue: (track: Track) => {
    set((state) => ({
      queue: [...state.queue, track],
    }));
  },
  
  setPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  },
  
  setPosition: (position: number) => {
    set({ position: Math.max(0, position) });
  },
  
  setShuffle: (enabled: boolean) => {
    set({ shuffleEnabled: enabled });
  },
  
  setRepeatMode: (mode: 'off' | 'one' | 'all') => {
    set({ repeatMode: mode });
  },
  
  setVolume: (volume: number) => {
    set({ volume: Math.max(0, Math.min(1, volume)) });
  },
  
  playNext: () => {
    const { currentTrack, queue, shuffleEnabled, repeatMode } = get();
    
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(track => track.id === currentTrack.id);
    let nextIndex: number;
    
    if (repeatMode === 'one') {
      // Repeat current track
      return;
    } else if (shuffleEnabled) {
      // Random next track
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      // Sequential next track
      nextIndex = currentIndex + 1;
      
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          // End of queue
          set({ isPlaying: false });
          return;
        }
      }
    }
    
    const nextTrack = queue[nextIndex];
    if (nextTrack) {
      set({ currentTrack: nextTrack, position: 0 });
    }
  },
  
  playPrevious: () => {
    const { currentTrack, queue, position } = get();
    
    if (!currentTrack || queue.length === 0) return;
    
    // If more than 3 seconds into track, restart current track
    if (position > 3) {
      set({ position: 0 });
      return;
    }
    
    const currentIndex = queue.findIndex(track => track.id === currentTrack.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    
    const previousTrack = queue[previousIndex];
    if (previousTrack) {
      set({ currentTrack: previousTrack, position: 0 });
    }
  },
  
  clearQueue: () => {
    set({
      currentTrack: null,
      queue: [],
      isPlaying: false,
      position: 0,
    });
  },
}));