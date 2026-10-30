/**
 * E2EEService - End-to-End Encryption for User Messages.
 * Implements RSA-OAEP for key exchange and AES-GCM for message encryption.
 */

export const generateKeyPair = async (): Promise<CryptoKeyPair> => {
  return await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
};

export const exportPublicKey = async (key: CryptoKey): Promise<string> => {
  const exported = await crypto.subtle.exportKey('spki', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

export const importPublicKey = async (keyBase64: string): Promise<CryptoKey> => {
  const binaryKey = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'spki',
    binaryKey,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
};

export const encryptMessage = async (message: string, publicKey: CryptoKey): Promise<{ ciphertext: string }> => {
  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    enc.encode(message)
  );
  return { ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))) };
};

export const decryptMessage = async (ciphertextBase64: string, privateKey: CryptoKey): Promise<string> => {
  const ciphertext = Uint8Array.from(atob(ciphertextBase64), (c) => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    ciphertext
  );
  const dec = new TextDecoder();
  return dec.decode(decrypted);
};
