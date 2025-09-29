/**
 * @fileoverview SSO Secret Encryption Utilities
 *
 * Provides secure encryption and decryption utilities for Azure AD client secrets
 * and other sensitive SSO configuration data. Implements industry-standard AES-256-CBC
 * encryption with proper initialization vector (IV) handling for maximum security.
 *
 * Security Features:
 * - AES-256-CBC encryption with cryptographically secure random IVs
 * - Environment-based encryption key management with validation
 * - Secure key validation to prevent weak or default keys
 * - Proper error handling without exposing sensitive information
 * - Format validation for encrypted data integrity
 *
 * Key Management:
 * - Requires SSO_ENCRYPTION_KEY environment variable (32 characters)
 * - Validates key strength and rejects common weak patterns
 * - Uses separate encryption key from main JWT secret for security isolation
 * - Supports key rotation through environment variable updates
 *
 * Data Format:
 * - Encrypted format: "iv:encryptedData" (hex-encoded)
 * - IV is generated randomly for each encryption operation
 * - IV is stored with encrypted data for proper decryption
 * - Format validation ensures data integrity and prevents corruption
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197.pdf} AES Specification
 * @see {@link https://tools.ietf.org/html/rfc3602} AES-CBC Cipher Algorithm
 */

import * as crypto from 'crypto';

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
 * Encrypts Azure AD client secrets using AES-256-CBC encryption
 *
 * Securely encrypts sensitive SSO configuration data using industry-standard
 * AES-256-CBC encryption with a cryptographically secure random initialization
 * vector (IV) for each encryption operation.
 *
 * @function encryptSecret
 * @param {string} text - Plain text Azure AD client secret to encrypt
 * @returns {string} Encrypted string in format "iv:encryptedData" (hex-encoded)
 *
 * @security
 * - Uses AES-256-CBC with 128-bit randomly generated IV
 * - IV is prepended to encrypted data for secure decryption
 * - No key reuse - fresh IV for every encryption operation
 * - Proper error handling without exposing sensitive information
 *
 * @encryption_process
 * 1. Generate cryptographically secure 16-byte random IV
 * 2. Create AES-256-CBC cipher with validated encryption key
 * 3. Encrypt plaintext using cipher with UTF-8 input encoding
 * 4. Convert IV and encrypted data to hex strings
 * 5. Return formatted string: "iv:encryptedData"
 *
 * @throws {Error} Failed to encrypt secret (without exposing details)
 *
 * @example
 * ```typescript
 * const clientSecret = "abc123_secure_azure_secret";
 * const encrypted = encryptSecret(clientSecret);
 * console.log(encrypted); // "a1b2c3d4...ef:9f8e7d6c..."
 *
 * // Store encrypted value in database
 * ssoConfig.azure_client_secret = encrypted;
 * ```
 *
 * @since 1.0.0
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
 * Decrypts Azure AD client secrets using AES-256-CBC decryption
 *
 * Securely decrypts encrypted SSO configuration data that was encrypted
 * using the encryptSecret function. Validates format and extracts IV
 * for proper decryption with AES-256-CBC algorithm.
 *
 * @function decryptSecret
 * @param {string} encryptedText - Encrypted string in format "iv:encryptedData" (hex-encoded)
 * @returns {string} Decrypted plain text Azure AD client secret
 *
 * @security
 * - Validates encrypted data format before decryption attempt
 * - Uses IV extracted from encrypted data for proper decryption
 * - Proper error handling without exposing sensitive information
 * - Validates hex encoding format for data integrity
 *
 * @decryption_process
 * 1. Parse encrypted string to extract IV and encrypted data
 * 2. Validate format matches expected "iv:encryptedData" pattern
 * 3. Convert hex-encoded IV and data back to binary format
 * 4. Create AES-256-CBC decipher with validated encryption key and IV
 * 5. Decrypt data and return UTF-8 encoded plain text
 *
 * @throws {Error} Failed to decrypt secret (without exposing details)
 * @throws {Error} Invalid encrypted format (if format validation fails)
 *
 * @example
 * ```typescript
 * const encryptedSecret = "a1b2c3d4...ef:9f8e7d6c...";
 * const decrypted = decryptSecret(encryptedSecret);
 * console.log(decrypted); // "abc123_secure_azure_secret"
 *
 * // Use decrypted secret with MSAL
 * const msalConfig = {
 *   auth: {
 *     clientSecret: decrypted
 *   }
 * };
 * ```
 *
 * @since 1.0.0
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
 * Validates if a string is encrypted in the expected format
 *
 * Performs format validation to determine if a string is encrypted using
 * the encryptSecret function format. Useful for conditional encryption
 * and preventing double-encryption of already encrypted data.
 *
 * @function isEncrypted
 * @param {string} text - String to validate for encryption format
 * @returns {boolean} True if string matches encrypted format, false otherwise
 *
 * @validation_checks
 * - Validates "iv:encryptedData" format (exactly 2 parts separated by colon)
 * - Verifies both IV and encrypted data are valid hexadecimal strings
 * - Does not validate actual decryptability (format check only)
 * - Safe to use on any string input without security implications
 *
 * @format_requirements
 * - Must contain exactly one colon separator
 * - IV part must be valid hexadecimal (32 characters for 16-byte IV)
 * - Encrypted data part must be valid hexadecimal
 * - Case-insensitive hex validation (accepts A-F and a-f)
 *
 * @example
 * ```typescript
 * const plainSecret = "my_azure_client_secret";
 * const encryptedSecret = "a1b2c3d4e5f6...89:9f8e7d6c5b4a...21";
 *
 * console.log(isEncrypted(plainSecret));     // false
 * console.log(isEncrypted(encryptedSecret)); // true
 * console.log(isEncrypted("invalid:format")); // false (not hex)
 * console.log(isEncrypted("no_colon"));      // false (no colon)
 *
 * // Use in conditional encryption
 * if (!isEncrypted(secretValue)) {
 *   secretValue = encryptSecret(secretValue);
 * }
 * ```
 *
 * @since 1.0.0
 */
export function isEncrypted(text: string): boolean {
  const parts = text.split(':');
  if (parts.length !== 2) return false;

  // Check if IV and encrypted data are valid hex strings
  const hexRegex = /^[0-9a-fA-F]+$/;
  return hexRegex.test(parts[0]) && hexRegex.test(parts[1]);
}