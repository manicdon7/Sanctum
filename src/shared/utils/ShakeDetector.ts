import { Accelerometer } from 'expo-sensors';

const SHAKE_THRESHOLD = 2.0; // G-force threshold (1.0 is gravity, > 2.0 is quick motion)

export class ShakeDetector {
  private static subscription: any = null;

  /**
   * Starts listening to accelerometer sensors to detect shake gestures.
   * Calls the provided trigger function when a shake is detected.
   * 
   * @param onShake - Callback function triggered on shake
   */
  static async startListening(onShake: () => void): Promise<void> {
    if (this.subscription) return;

    try {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable) {
        console.log('[ShakeDetector] Accelerometer not available on this device/platform.');
        return;
      }

      Accelerometer.setUpdateInterval(100); // Check every 100ms
      this.subscription = Accelerometer.addListener((data) => {
        const { x, y, z } = data;
        // G-force magnitude calculation
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        if (magnitude > SHAKE_THRESHOLD) {
          console.log('[ShakeDetector] Shake detected, force magnitude:', magnitude);
          onShake();
        }
      });
    } catch (err) {
      console.warn('[ShakeDetector] Failed to bind shake accelerometer:', err);
    }
  }

  /**
   * Stops listening to the sensors to save battery.
   */
  static stopListening(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
}
