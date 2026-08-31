import CryptoJS from 'crypto-js';

// Key lives in .env as EXPO_PUBLIC_ID_ENCRYPTION_KEY (see .env.example).
// Note: EXPO_PUBLIC_ vars are bundled into the app, so this protects the ID
// at rest in Firestore / from casual DB access - not from someone
// decompiling the app itself. Fine for now, just know what it covers.
const KEY = process.env.EXPO_PUBLIC_ID_ENCRYPTION_KEY;

/**
 * Encrypts a national ID string. Only the ciphertext ever gets written
 * to Firestore - the plaintext ID never leaves this function.
 */
export function encryptNationalId(plainId: string): string {
  if (!KEY) throw new Error('Missing EXPO_PUBLIC_ID_ENCRYPTION_KEY in .env');
  return CryptoJS.AES.encrypt(plainId.trim(), KEY).toString();
}

/**
 * Decrypts a ciphertext previously produced by encryptNationalId.
 * Returns '' if the value is missing, empty, or fails to decrypt
 * (e.g. wrong key, corrupted data) instead of throwing, so screens
 * can just show a blank field rather than crash.
 */
export function decryptNationalId(cipherText: string | undefined | null): string {
  if (!KEY || !cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
}
