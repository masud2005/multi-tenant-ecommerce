import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const DEFAULT_KEY_HEX = '9f8b2c4e1a7d5f0e3b6a9c2d4f8a1e5b7c0d3e6f9a2b5c8e1d4f7a0b3c6e9d2f';

function getEncryptionKey(): Buffer {
  const keyHex = process.env.CHAT_ENCRYPTION_KEY || DEFAULT_KEY_HEX;
  if (keyHex.length === 64) {
    return Buffer.from(keyHex, 'hex');
  }
  // Fallback: create 32-byte sha256 hash if raw string is provided
  return crypto.createHash('sha256').update(keyHex).digest();
}

/**
 * 🔒 Encrypts plain text using AES-256-CBC with a random Initialization Vector (IV).
 * Returns both the encrypted cipher text and the IV (hex string).
 */
export function encryptMessage(plainText: string): { encryptedText: string; iv: string } {
  if (!plainText) {
    return { encryptedText: '', iv: '' };
  }

  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encryptedText: encrypted,
    iv: iv.toString('hex'),
  };
}

/**
 * 🔓 Decrypts AES-256-CBC encrypted text using the corresponding IV.
 * Returns the original plain text string.
 */
export function decryptMessage(encryptedText: string, ivHex: string): string {
  if (!encryptedText || !ivHex) {
    return encryptedText || '';
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // If decryption fails (e.g. legacy plain text or corrupted iv), return gracefully
    return encryptedText;
  }
}
