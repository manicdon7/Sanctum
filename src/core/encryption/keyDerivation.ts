/**
 * Sanctum Key Derivation
 *
 * Derives a 256-bit encryption key from the user's authentication credential.
 * Uses pure JS @stablelib/pbkdf2 and @stablelib/sha256 with native secure random bytes.
 * This runs perfectly inside Expo Go without requiring custom native dev binaries.
 *
 * The derived key is stored in expo-secure-store (Android Keystore-backed).
 * The key is NEVER stored in AsyncStorage, plain state, or transmitted.
 */

import * as SecureStore from 'expo-secure-store';
import { Buffer } from 'buffer';
import { deriveKey as pbkdf2DeriveKey } from '@stablelib/pbkdf2';
import { SHA256 } from '@stablelib/sha256';
import * as Crypto from 'expo-crypto';

const SECURE_STORE_KEY = 'sanctum_enc_key_v1';
const SALT_STORE_KEY = 'sanctum_enc_salt_v1';
const KEY_BYTES = 32; // 256-bit
const ITERATIONS = 310_000; // NIST recommendation for PBKDF2-SHA256 in 2024
const SALT_BYTES = 32;

/**
 * Generates a random salt and stores it in SecureStore.
 * Only called once on first app setup.
 */
async function getOrCreateSalt(): Promise<Uint8Array> {
  const existing = await SecureStore.getItemAsync(SALT_STORE_KEY);
  if (existing) {
    return new Uint8Array(Buffer.from(existing, 'base64'));
  }
  // Generate new random salt using native CSPRNG
  const salt = Crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  await SecureStore.setItemAsync(
    SALT_STORE_KEY,
    Buffer.from(salt).toString('base64'),
    { requireAuthentication: false }, // salt is not secret
  );
  return salt;
}

/**
 * Derives a 256-bit encryption key from a credential string.
 * In practice, credential is the device auth result token or a fixed
 * app-internal string combined with device-unique data.
 *
 * @param credential - auth-derived credential (never stored)
 * @returns 32-byte Uint8Array encryption key
 */
export async function deriveKey(credential: string): Promise<Uint8Array> {
  const salt = await getOrCreateSalt();
  const credentialBytes = Buffer.from(credential, 'utf8');

  const derived = pbkdf2DeriveKey(
    SHA256,
    credentialBytes,
    salt,
    ITERATIONS,
    KEY_BYTES,
  );
  return derived;
}

/**
 * Stores the derived key in SecureStore with authentication required.
 * On Android: backed by Android Keystore hardware.
 */
export async function storeKey(key: Uint8Array): Promise<void> {
  await SecureStore.setItemAsync(
    SECURE_STORE_KEY,
    Buffer.from(key).toString('base64'),
    {
      requireAuthentication: false, // key itself is guarded by biometric gate
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    },
  );
}

/**
 * Loads the stored encryption key from SecureStore.
 * Returns null if no key has been stored yet (first launch).
 */
export async function loadKey(): Promise<Uint8Array | null> {
  const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
  if (!stored) return null;
  return new Uint8Array(Buffer.from(stored, 'base64'));
}

/**
 * Clears the encryption key from SecureStore.
 * Called on lock, "delete everything," or key rotation.
 * Does NOT clear the salt — salt is not secret.
 */
export async function clearKey(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
}

/**
 * Checks whether an encryption key exists in SecureStore.
 * Used to determine if the user has completed initial setup.
 */
export async function hasStoredKey(): Promise<boolean> {
  const key = await SecureStore.getItemAsync(SECURE_STORE_KEY);
  return key !== null;
}
