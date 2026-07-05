// Ambiance Hook
// Manages multi-track audio playback with volume control and fade effects

import { useCallback, useEffect, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useAmbianceStore } from '../stores/useAmbianceStore';
import { getTrack, ambianceTracks } from './tracks';
import { animations } from '../theme/animations';

interface AudioInstance {
  sound: Audio.Sound;
  isLoaded: boolean;
  targetVolume: number;
}

export function useAmbiance() {
  const store = useAmbianceStore();
  const audioInstances = useRef<Record<string, AudioInstance>>({});
  const fadeIntervals = useRef<Record<string, NodeJS.Timeout>>({});

  // Initialize audio session
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
    });
  }, []);

  // Load audio file
  const loadSound = useCallback(async (trackId: string): Promise<AudioInstance | null> => {
    try {
      const track = getTrack(trackId);
      if (!track) return null;

      // For now, create a dummy sound object since we don't have actual audio files
      // In production, this would load the actual audio file:
      // const { sound } = await Audio.Sound.createAsync(
      //   require(`../../assets/sounds/${track.file}`),
      //   { shouldPlay: false, isLooping: track.loop, volume: 0 }
      // );
      
      // Temporary mock sound for development
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' }, // Placeholder
        {
          shouldPlay: false,
          isLooping: track.loop,
          volume: 0, // Start at 0 for fade in
        }
      );

      const instance: AudioInstance = {
        sound,
        isLoaded: true,
        targetVolume: 0,
      };

      audioInstances.current[trackId] = instance;
      return instance;
    } catch (error) {
      console.warn(`Failed to load sound ${trackId}:`, error);
      return null;
    }
  }, []);

  // Fade volume smoothly
  const fadeVolume = useCallback(
    (trackId: string, targetVolume: number, duration: number = animations.duration.breathing) => {
      const instance = audioInstances.current[trackId];
      if (!instance?.isLoaded) return;

      // Clear any existing fade
      if (fadeIntervals.current[trackId]) {
        clearInterval(fadeIntervals.current[trackId]);
      }

      instance.targetVolume = targetVolume;

      // Get current volume
      instance.sound.getStatusAsync().then((status) => {
        if (status.isLoaded) {
          const currentVolume = status.volume || 0;
          const volumeDiff = targetVolume - currentVolume;
          const steps = 30; // Number of fade steps
          const stepSize = volumeDiff / steps;
          const stepDelay = duration / steps;

          let step = 0;
          fadeIntervals.current[trackId] = setInterval(() => {
            step++;
            const newVolume = currentVolume + (stepSize * step);

            instance.sound.setVolumeAsync(
              Math.max(0, Math.min(1, newVolume))
            );

            if (step >= steps) {
              clearInterval(fadeIntervals.current[trackId]);
              delete fadeIntervals.current[trackId];

              // Stop sound if volume reached 0
              if (targetVolume === 0) {
                instance.sound.stopAsync();
              }
            }
          }, stepDelay);
        }
      });
    },
    []
  );

  // Toggle sound on/off
  const toggleSound = useCallback(async (trackId: string) => {
    const activeSound = store.activeSounds[trackId];
    
    if (activeSound?.isPlaying) {
      // Turn off - fade out then stop
      fadeVolume(trackId, 0);
      store.toggleSound(trackId);
    } else {
      // Turn on - load if needed, then fade in
      let instance = audioInstances.current[trackId];
      
      if (!instance) {
        instance = await loadSound(trackId);
        if (!instance) return;
      }

      // If not in layer mode, stop all other sounds first
      if (!store.layerMode) {
        Object.keys(store.activeSounds).forEach(otherId => {
          if (otherId !== trackId) {
            fadeVolume(otherId, 0);
          }
        });
      }

      // Start playing and fade in
      await instance.sound.playAsync();
      store.toggleSound(trackId);
      
      const volume = (store.activeSounds[trackId]?.volume || 0.8) * store.masterVolume;
      fadeVolume(trackId, volume);
    }
  }, [store, loadSound, fadeVolume]);

  // Set individual sound volume
  const setSoundVolume = useCallback((trackId: string, volume: number) => {
    store.setSoundVolume(trackId, volume);
    
    const instance = audioInstances.current[trackId];
    if (instance?.isLoaded && store.activeSounds[trackId]?.isPlaying) {
      const actualVolume = volume * store.masterVolume;
      instance.sound.setVolumeAsync(actualVolume);
    }
  }, [store]);

  // Set master volume
  const setMasterVolume = useCallback((volume: number) => {
    store.setMasterVolume(volume);
    
    // Update all active sounds
    Object.entries(store.activeSounds).forEach(([trackId, sound]) => {
      const instance = audioInstances.current[trackId];
      if (instance?.isLoaded && sound.isPlaying) {
        const actualVolume = sound.volume * volume;
        instance.sound.setVolumeAsync(actualVolume);
      }
    });
  }, [store]);

  // Duck audio when Juliet speaks (lower volume temporarily)
  const duckAudio = useCallback((duck: boolean) => {
    store.setDucking(duck);
    
    const duckVolume = duck ? 0.4 : 1.0;
    
    Object.entries(store.activeSounds).forEach(([trackId, sound]) => {
      const instance = audioInstances.current[trackId];
      if (instance?.isLoaded && sound.isPlaying) {
        const baseVolume = sound.volume * store.masterVolume;
        const actualVolume = baseVolume * duckVolume;
        fadeVolume(trackId, actualVolume, 500); // Quick fade for ducking
      }
    });

    // Auto un-duck after 2 seconds if ducking
    if (duck) {
      setTimeout(() => {
        if (store.isDucking) {
          duckAudio(false);
        }
      }, 2000);
    }
  }, [store, fadeVolume]);

  // Stop all sounds
  const stopAllSounds = useCallback(() => {
    Object.keys(store.activeSounds).forEach(trackId => {
      fadeVolume(trackId, 0);
    });
    store.stopAllSounds();
  }, [store, fadeVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all intervals
      Object.values(fadeIntervals.current).forEach(interval => {
        clearInterval(interval);
      });
      
      // Unload all sounds
      Object.values(audioInstances.current).forEach(instance => {
        if (instance.isLoaded) {
          instance.sound.unloadAsync();
        }
      });
    };
  }, []);

  return {
    activeSounds: store.activeSounds,
    masterVolume: store.masterVolume,
    layerMode: store.layerMode,
    isDucking: store.isDucking,
    availableTracks: ambianceTracks,
    toggleSound,
    setSoundVolume,
    setMasterVolume,
    setLayerMode: store.setLayerMode,
    duckAudio,
    stopAllSounds,
  };
}