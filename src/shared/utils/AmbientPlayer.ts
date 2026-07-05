import { Audio } from 'expo-av';

export type AmbientTrack = 'rain' | 'lofi' | 'none';

export class AmbientPlayer {
  private static soundInstance: Audio.Sound | null = null;
  private static currentTrack: AmbientTrack = 'none';
  private static volume = 0.6; // 0.0 to 1.0

  /**
   * Plays a selected ambient track bundled locally in assets.
   * Seamless loop enabled. Audio category configured to mix with other apps
   * and respect mute switches if wanted.
   */
  static async play(track: AmbientTrack, volume = 60): Promise<void> {
    this.volume = volume / 100;

    if (this.currentTrack === track && this.soundInstance) {
      await this.soundInstance.setVolumeAsync(this.volume);
      return;
    }

    await this.stop();

    if (track === 'none') return;

    try {
      // Configure audio category for ambient playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
      });

      const soundSource =
        track === 'rain'
          ? require('../../../assets/sounds/rain.mp3')
          : require('../../../assets/sounds/lofi-loop.mp3');

      let sound: Audio.Sound;
      try {
        const result = await Audio.Sound.createAsync(
          soundSource,
          {
            shouldPlay: true,
            isLooping: true,
            volume: this.volume,
          },
          this.onPlaybackStatusUpdate
        );
        sound = result.sound;
      } catch (localErr) {
        console.warn('[AmbientPlayer] Local asset load failed, trying remote fallback...', localErr);
        // Fallback to high-quality remote URL stream
        const fallbackUrl =
          track === 'rain'
            ? 'https://soundbible.com/grab.php?id=2011&type=mp3'
            : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3';

        const result = await Audio.Sound.createAsync(
          { uri: fallbackUrl },
          {
            shouldPlay: true,
            isLooping: true,
            volume: this.volume,
          },
          this.onPlaybackStatusUpdate
        );
        sound = result.sound;
      }

      this.soundInstance = sound;
      this.currentTrack = track;
    } catch (err) {
      console.warn('[AmbientPlayer] Playback initialization failed completely:', err);
    }
  }

  /**
   * Sets the volume of the active ambient sound.
   * 
   * @param volume - Volume percentage (0-100)
   */
  static async setVolume(volume: number): Promise<void> {
    this.volume = volume / 100;
    if (this.soundInstance) {
      await this.soundInstance.setVolumeAsync(this.volume);
    }
  }

  /**
   * Stops and unloads the current playing sound.
   */
  static async stop(): Promise<void> {
    if (this.soundInstance) {
      try {
        await this.soundInstance.stopAsync();
        await this.soundInstance.unloadAsync();
      } catch (err) {
        console.warn('[AmbientPlayer] Failed to unload sound:', err);
      }
      this.soundInstance = null;
    }
    this.currentTrack = 'none';
  }

  private static onPlaybackStatusUpdate = (status: any) => {
    if (status.error) {
      console.warn('[AmbientPlayer] Playback status error:', status.error);
    }
  };
}
