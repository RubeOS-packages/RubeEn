// Constants for cryptographic operations
const KDF_SALT_LENGTH = 16;
const KDF_ITERATIONS = 100000;
const KEY_ENCRYPTION_IV_LENGTH = 12;
const FILE_ENCRYPTION_IV_LENGTH = 12;
const KEY_LENGTH_BITS = 256;

// Internal structure for the obfuscated key file
interface EncryptedKeyData {
  s: string; // salt
  i: string; // iv
  k: string; // key
  m: { // metadata
    f: string; // filename
    t: number; // timestamp
    a: string; // user agent
  };
}

// Public interface for the decrypted metadata object
export interface DecryptionResult {
    fileKey: CryptoKey;
    metadata: {
        filename: string;
        encryptedAt: number;
        encryptedBy: string;
    };
}

/**
 * Converts an ArrayBuffer to a Base64 string for JSON storage.
 * @param buffer The ArrayBuffer to convert.
 * @returns A Base64 encoded string.
 */
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

/**
 * Converts a Base64 string back to an ArrayBuffer.
 * @param base64 The Base64 string to convert.
 * @returns The decoded ArrayBuffer.
 */
const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Generates a new random, exportable key for file encryption.
 * @returns A promise that resolves to a CryptoKey.
 */
export const generateFileKey = async (): Promise<CryptoKey> => {
  return window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    true, // Must be exportable
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts file content using a provided file key.
 * @param fileContent The raw file content as an ArrayBuffer.
 * @param fileKey The CryptoKey to use for encryption.
 * @returns A promise that resolves to the encrypted data (IV + ciphertext).
 */
export const encryptFile = async (fileContent: ArrayBuffer, fileKey: CryptoKey): Promise<ArrayBuffer> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(FILE_ENCRYPTION_IV_LENGTH));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    fileKey,
    fileContent
  );
  
  const encryptedData = new Uint8Array(FILE_ENCRYPTION_IV_LENGTH + ciphertext.byteLength);
  encryptedData.set(iv, 0);
  encryptedData.set(new Uint8Array(ciphertext), FILE_ENCRYPTION_IV_LENGTH);

  return encryptedData.buffer;
};

/**
 * Decrypts file content using a provided file key.
 * @param encryptedData The encrypted data (IV + ciphertext).
 * @param fileKey The CryptoKey to use for decryption.
 * @returns A promise that resolves to the decrypted file content.
 */
export const decryptFile = async (encryptedData: ArrayBuffer, fileKey: CryptoKey): Promise<ArrayBuffer> => {
    const encryptedBytes = new Uint8Array(encryptedData);
    const iv = encryptedBytes.slice(0, FILE_ENCRYPTION_IV_LENGTH);
    const ciphertext = encryptedBytes.slice(FILE_ENCRYPTION_IV_LENGTH);

    try {
        return await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv },
          fileKey,
          ciphertext
        );
    } catch (error) {
        console.error('File decryption failed:', error);
        throw new Error('File decryption failed. The key may be incorrect for this file.');
    }
};

/**
 * Derives a key-encryption-key from a password using PBKDF2.
 * @param password The user's password.
 * @param salt The salt for key derivation.
 * @returns A promise that resolves to a CryptoKey for key encryption/decryption.
 */
const deriveKeyEncryptionKey = async (password: string, salt: BufferSource): Promise<CryptoKey> => {
    const passwordBuffer = new TextEncoder().encode(password);
    const baseKey = await window.crypto.subtle.importKey(
        'raw', passwordBuffer, { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: KDF_ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: KEY_LENGTH_BITS },
        false,
        ['encrypt', 'decrypt']
    );
};

/**
 * Encrypts a file key with a password, adds metadata, and formats it for export.
 * @param fileKey The file key to encrypt and export.
 * @param password The password to protect the key with.
 * @param filename The original name of the file being encrypted.
 * @returns A promise that resolves to a Base64 string containing the encrypted key data.
 */
export const exportEncryptedKey = async (fileKey: CryptoKey, password: string, filename: string): Promise<string> => {
    const rawFileKey = await window.crypto.subtle.exportKey('raw', fileKey);

    const salt = window.crypto.getRandomValues(new Uint8Array(KDF_SALT_LENGTH));
    const iv = window.crypto.getRandomValues(new Uint8Array(KEY_ENCRYPTION_IV_LENGTH));
    
    const keyEncryptionKey = await deriveKeyEncryptionKey(password, salt);

    const encryptedFileKey = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        keyEncryptionKey,
        rawFileKey
    );

    const keyData: EncryptedKeyData = {
        s: bufferToBase64(salt),
        i: bufferToBase64(iv),
        k: bufferToBase64(encryptedFileKey),
        m: {
            f: filename,
            t: Date.now(),
            a: navigator.userAgent
        }
    };

    const jsonString = JSON.stringify(keyData);
    return btoa(jsonString); // Base64 encode the final JSON string for obfuscation
};

/**
 * Imports an encoded key file, decrypts the file key, and extracts metadata.
 * @param encodedKeyFile A Base64 string containing the key data.
 * @param password The password to decrypt the key.
 * @returns A promise that resolves to an object containing the decrypted file key and metadata.
 */
export const importAndDecryptKey = async (encodedKeyFile: string, password: string): Promise<DecryptionResult> => {
    try {
        const jsonKeyFile = atob(encodedKeyFile); // Decode Base64 to get the JSON string
        const keyData: EncryptedKeyData = JSON.parse(jsonKeyFile);
        
        const salt = base64ToBuffer(keyData.s);
        const iv = base64ToBuffer(keyData.i);
        const encryptedFileKey = base64ToBuffer(keyData.k);
        
        const keyEncryptionKey = await deriveKeyEncryptionKey(password, salt);
        
        const rawFileKey = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            keyEncryptionKey,
            encryptedFileKey
        );

        const fileKey = await window.crypto.subtle.importKey(
            'raw',
            rawFileKey,
            { name: 'AES-GCM' },
            true,
            ['encrypt', 'decrypt']
        );
        
        return {
            fileKey,
            metadata: {
                filename: keyData.m.f,
                encryptedAt: keyData.m.t,
                encryptedBy: keyData.m.a,
            }
        };

    } catch (error) {
        console.error('Key decryption failed:', error);
        throw new Error('Key decryption failed. Please check your password and key file.');
    }
};
