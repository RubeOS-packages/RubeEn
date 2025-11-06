
// Constants for cryptographic operations
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits for AES-GCM
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256; // AES-256

/**
 * Derives a cryptographic key from a password and salt using PBKDF2.
 * @param password The user's password.
 * @param salt The salt for key derivation.
 * @returns A promise that resolves to a CryptoKey.
 */
const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const passwordBuffer = new TextEncoder().encode(password);
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts file content using AES-GCM.
 * @param fileContent The raw file content as an ArrayBuffer.
 * @param password The encryption password.
 * @returns A promise that resolves to the encrypted data as an ArrayBuffer.
 * The returned buffer is a concatenation of salt, IV, and ciphertext.
 */
export const encryptFile = async (fileContent: ArrayBuffer, password: string): Promise<ArrayBuffer> => {
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(password, salt);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    fileContent
  );

  const encryptedData = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength);
  encryptedData.set(salt, 0);
  encryptedData.set(iv, SALT_LENGTH);
  encryptedData.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

  return encryptedData.buffer;
};

/**
 * Decrypts file content using AES-GCM.
 * @param encryptedData The encrypted data (salt + IV + ciphertext).
 * @param password The decryption password.
 * @returns A promise that resolves to the decrypted file content as an ArrayBuffer.
 * @throws An error if decryption fails (e.g., wrong password).
 */
export const decryptFile = async (encryptedData: ArrayBuffer, password: string): Promise<ArrayBuffer> => {
  const encryptedBytes = new Uint8Array(encryptedData);

  const salt = encryptedBytes.slice(0, SALT_LENGTH);
  const iv = encryptedBytes.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = encryptedBytes.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt);

  try {
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );
    return decryptedContent;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Decryption failed. Please check your password and file.');
  }
};
