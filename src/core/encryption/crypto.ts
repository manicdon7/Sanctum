/**
 * Sanctum Crypto Utilities
 *
 * AES-256-GCM application-layer encryption for all journal/note content.
 * Uses pure JS @stablelib/aes and @stablelib/gcm with native secure random bytes.
 * This runs perfectly inside Expo Go without requiring custom native dev binaries.
 *
 * Ciphertext format: base64( iv[12] || ciphertext || authTag[16] )
 * Total overhead per value: ~40 bytes (base64-encoded).
 */

import { Buffer } from 'buffer';
import { AES } from '@stablelib/aes';
import { GCM } from '@stablelib/gcm';
import * as Crypto from 'expo-crypto';

const IV_BYTES = 12;   // 96-bit IV, required for GCM

/**
 * Encrypts a UTF-8 string using AES-256-GCM.
 *
 * @param plaintext - the raw string to encrypt
 * @param key - 32-byte Uint8Array encryption key
 * @returns base64-encoded string: iv || ciphertext || authTag
 */
export async function encrypt(plaintext: string, key: Uint8Array): Promise<string> {
  const iv = Crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const plaintextBytes = Buffer.from(plaintext, 'utf8');

  // AES-256 block cipher instance
  const aes = new AES(key);
  const gcm = new GCM(aes);

  // seal returns ciphertext || authTag
  const encryptedAndTag = gcm.seal(iv, plaintextBytes);

  // Pack: iv (12) + ciphertext + authTag (16)
  const combined = new Uint8Array(iv.length + encryptedAndTag.length);
  combined.set(iv, 0);
  combined.set(encryptedAndTag, iv.length);

  return Buffer.from(combined).toString('base64');
}

/**
 * Decrypts an AES-256-GCM base64 ciphertext string.
 *
 * @param ciphertextB64 - base64 string produced by encrypt()
 * @param key - 32-byte Uint8Array encryption key
 * @returns original plaintext UTF-8 string
 * @throws if authentication tag verification fails (tampered data)
 */
export async function decrypt(ciphertextB64: string, key: Uint8Array): Promise<string> {
  const combined = Buffer.from(ciphertextB64, 'base64');

  const iv = combined.subarray(0, IV_BYTES);
  const encryptedAndTag = combined.subarray(IV_BYTES);

  const aes = new AES(key);
  const gcm = new GCM(aes);

  // open returns decrypted bytes or null if tag fails
  const decryptedBytes = gcm.open(iv, encryptedAndTag);
  if (!decryptedBytes) {
    throw new Error('[Crypto] Authenticated decryption failed (data may be tampered or key is incorrect)');
  }
  return Buffer.from(decryptedBytes).toString('utf8');
}

/**
 * Encrypts a value only if a key is present.
 * Returns plaintext unchanged when key is null (development / key not yet set).
 */
export async function safeEncrypt(
  plaintext: string,
  key: Uint8Array | null,
): Promise<string> {
  if (!key) return plaintext;
  return encrypt(plaintext, key);
}

/**
 * Decrypts a value only if a key is present.
 * Returns the value unchanged when key is null.
 */
export async function safeDecrypt(
  value: string,
  key: Uint8Array | null,
): Promise<string> {
  if (!key) return value;
  try {
    return await decrypt(value, key);
  } catch {
    // If decryption fails (e.g., legacy unencrypted data), return as-is
    return value;
  }
}

/**
 * File encryption stub.
 * Full streaming XChaCha20-Poly1305 implementation via react-native-libsodium
 * will be added when the custom dev build (expo-dev-client) is integrated.
 *
 * For MVP: copies the file as-is (the DB metadata is still encrypted).
 * TODO: Swap out with libsodium streaming encryption before production release.
 */
export async function encryptFile(
  _sourceUri: string,
  _key: Uint8Array,
  _destUri: string,
): Promise<void> {
  const FileSystem = await import('expo-file-system');
  await FileSystem.copyAsync({ from: _sourceUri, to: _destUri });
  // TODO: Replace with react-native-libsodium XChaCha20-Poly1305 streaming encryption
  console.warn('[Sanctum] File encryption: using copy stub — replace with libsodium before production');
}

/**
 * File decryption stub. See encryptFile note above.
 */
export async function decryptFile(
  _sourceUri: string,
  _key: Uint8Array,
  _destUri: string,
): Promise<void> {
  const FileSystem = await import('expo-file-system');
  await FileSystem.copyAsync({ from: _sourceUri, to: _destUri });
  // TODO: Replace with react-native-libsodium XChaCha20-Poly1305 streaming decryption
}
