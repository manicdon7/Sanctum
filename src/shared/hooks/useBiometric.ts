import { useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricResult =
  | { success: true }
  | { success: false; reason: 'not_available' | 'not_enrolled' | 'cancelled' | 'failed' };

export function useBiometric() {
  const authenticate = useCallback(async (
    promptMessage = 'Unlock Sanctum',
  ): Promise<BiometricResult> => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return { success: false, reason: 'not_available' };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return { success: false, reason: 'not_enrolled' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });

    if (result.success) return { success: true };
    if (result.error === 'user_cancel' || result.error === 'system_cancel') {
      return { success: false, reason: 'cancelled' };
    }
    return { success: false, reason: 'failed' };
  }, []);

  return { authenticate };
}
