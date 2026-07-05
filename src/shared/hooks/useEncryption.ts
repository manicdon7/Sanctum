/**
 * useEncryption — access current session encryption key
 * and expose typed encrypt/decrypt helpers.
 */

import { useAppStore } from '@/core/stores/appStore';
import { safeEncrypt, safeDecrypt } from '@/core/encryption/crypto';
import { useCallback } from 'react';

export function useEncryption() {
  const key = useAppStore((s) => s.encryptionKey);

  const encryptText = useCallback(
    (plaintext: string) => safeEncrypt(plaintext, key),
    [key],
  );

  const decryptText = useCallback(
    (ciphertext: string) => safeDecrypt(ciphertext, key),
    [key],
  );

  return { encryptText, decryptText, hasKey: key !== null };
}
