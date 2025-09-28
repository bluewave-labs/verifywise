import crypto from 'crypto';

/**
 * Utility functions for encrypting and decrypting SSO secrets
 */

const algorithm = 'aes-256-cbc';
const getEncryptionKey = () => {
  const key = process.env.SSO_ENCRYPTION_KEY;

  if (!key) {
    throw new Error('SSO_ENCRYPTION_KEY environment variable is required for SSO functionality. Please set a 32-character encryption key.');
  }

  if (key.length !== 32) {
    throw new Error(`SSO_ENCRYPTION_KEY must be exactly 32 characters. Current length: ${key.length}`);
  }

  // Validate that key is not a weak/default pattern
  if (key.includes('default') || key === '0'.repeat(32) || key === '1'.repeat(32)) {
    throw new Error('SSO_ENCRYPTION_KEY appears to be a default or weak key. Please use a cryptographically secure 32-character key.');
  }

  return Buffer.from(key);
};

/**
 * Encrypts the Azure AD client secret
 * @param text - The plain text secret to encrypt
 * @returns Encrypted string in format: iv:encryptedData
 */
export function encryptSecret(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, getEncryptionKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Store IV with encrypted data for decryption
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt secret');
  }
}

/**
 * Decrypts the Azure AD client secret
 * @param encryptedText - The encrypted string in format: iv:encryptedData
 * @returns Decrypted plain text secret
 */
export function decryptSecret(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, getEncryptionKey(), iv);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt secret');
  }
}

/**
 * Validates if a string is encrypted in our expected format
 * @param text - The string to check
 * @returns boolean indicating if the string is encrypted
 */
export function isEncrypted(text: string): boolean {
  const parts = text.split(':');
  if (parts.length !== 2) return false;

  // Check if IV and encrypted data are valid hex strings
  const hexRegex = /^[0-9a-fA-F]+$/;
  return hexRegex.test(parts[0]) && hexRegex.test(parts[1]);
}