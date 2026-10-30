/**
 * CryptoStorageService - IndexedDB wrapper for keys and integrity hash receipts.
 * Supports tamper detection with cryptographic SHA-256 recalculation.
 */

export interface HashReceipt {
  id: string;
  receiptId: string;
  label: string;
  timestamp: string;
  type: 'STATE_SNAPSHOT' | 'ARX_COMPUTE' | 'AUTH_GATE' | 'KEY_EVENT' | 'CONFIG_SEAL';
  payload: string; // Serialized state or telemetry payload
  storedHash: string; // The cryptographic hash stamped into the record
  algorithm: 'SHA-256' | 'ARX-256';
  author: string;
  merkleDigest?: string;
  tampered?: boolean;
}

const DB_NAME = 'SOS_CryptoVault';
const STORE_KEYS = 'keys';
const STORE_RECEIPTS = 'receipts';

const memoryReceiptStore = new Map<string, HashReceipt>();

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB unavailable in non-browser runtime environment'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_KEYS)) {
        db.createObjectStore(STORE_KEYS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_RECEIPTS)) {
        db.createObjectStore(STORE_RECEIPTS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Standard Web Crypto API SHA-256 hash calculation (hex with 0x prefix)
 */
export const computeSha256 = async (data: string): Promise<string> => {
  const enc = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', enc.encode(data));
  const hex = Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
};

/**
 * Verifies a stored hash receipt by re-hashing its current payload and comparing
 */
export const verifyReceiptIntegrity = async (receipt: HashReceipt): Promise<{
  isValid: boolean;
  computedHash: string;
  storedHash: string;
}> => {
  const computedHash = await computeSha256(receipt.payload);
  const isValid = computedHash.toLowerCase() === (receipt.storedHash || '').toLowerCase();
  return {
    isValid,
    computedHash,
    storedHash: receipt.storedHash,
  };
};

/* --- Vault Lock & Volatile Memory State --- */

let _isVaultLocked = false;
const _volatileKeyMemoryCache = new Map<string, any>();

export const isVaultLocked = (): boolean => _isVaultLocked;

export const lockVault = (): void => {
  _isVaultLocked = true;
  clearVolatileMemory();
};

export const unlockVault = (): void => {
  _isVaultLocked = false;
};

export const clearVolatileMemory = (): void => {
  _volatileKeyMemoryCache.clear();
};

/* --- Key Store Operations --- */

export const saveKey = async (keyData: any): Promise<void> => {
  if (_isVaultLocked) {
    throw new Error('VAULT_LOCKED: Access to IndexedDB cryptographic keys is locked. Unlock vault to continue.');
  }
  _volatileKeyMemoryCache.set(keyData.id, keyData);
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_KEYS, 'readwrite');
    tx.objectStore(STORE_KEYS).put(keyData);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getKey = async (id: string): Promise<any> => {
  if (_isVaultLocked) {
    throw new Error('VAULT_LOCKED: Access to IndexedDB cryptographic keys is locked. Unlock vault to continue.');
  }
  if (_volatileKeyMemoryCache.has(id)) {
    return _volatileKeyMemoryCache.get(id);
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KEYS, 'readonly');
    const request = tx.objectStore(STORE_KEYS).get(id);
    request.onsuccess = () => {
      if (request.result) {
        _volatileKeyMemoryCache.set(id, request.result);
      }
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getAllKeys = async (): Promise<any[]> => {
  if (_isVaultLocked) {
    throw new Error('VAULT_LOCKED: Access to IndexedDB cryptographic keys is locked. Unlock vault to continue.');
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KEYS, 'readonly');
    const request = tx.objectStore(STORE_KEYS).getAll();
    request.onsuccess = () => {
      const keys = request.result || [];
      keys.forEach((k) => _volatileKeyMemoryCache.set(k.id, k));
      resolve(keys);
    };
    request.onerror = () => reject(request.error);
  });
};

/* --- Receipt Store Operations --- */

export const saveReceipt = async (receiptData: HashReceipt): Promise<void> => {
  const id = receiptData.id || receiptData.receiptId;
  const record = { ...receiptData, id, receiptId: id };
  memoryReceiptStore.set(id, record);

  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_RECEIPTS, 'readwrite');
      const store = tx.objectStore(STORE_RECEIPTS);
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // In-memory fallback active in Node headless test environments
  }
};

export const getReceipt = async (id: string): Promise<HashReceipt | undefined> => {
  if (memoryReceiptStore.has(id)) {
    return memoryReceiptStore.get(id);
  }
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RECEIPTS, 'readonly');
      const request = tx.objectStore(STORE_RECEIPTS).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return memoryReceiptStore.get(id);
  }
};

export const getAllReceipts = async (): Promise<HashReceipt[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RECEIPTS, 'readonly');
      const request = tx.objectStore(STORE_RECEIPTS).getAll();
      request.onsuccess = () => {
        const records: HashReceipt[] = request.result || [];
        records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    const records = Array.from(memoryReceiptStore.values());
    records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return records;
  }
};

export const deleteReceipt = async (id: string): Promise<void> => {
  memoryReceiptStore.delete(id);
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_RECEIPTS, 'readwrite');
      tx.objectStore(STORE_RECEIPTS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // In-memory fallback
  }
};

export const clearAllReceipts = async (): Promise<void> => {
  memoryReceiptStore.clear();
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_RECEIPTS, 'readwrite');
      tx.objectStore(STORE_RECEIPTS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // In-memory fallback
  }
};

/**
 * Creates and stores a fresh hash receipt of the current environment state or arbitrary payload
 */
export const createStateReceipt = async (
  stateData: any,
  label: string = 'Local State Snapshot',
  type: HashReceipt['type'] = 'STATE_SNAPSHOT',
  author: string = 'Sovereign Operator'
): Promise<HashReceipt> => {
  let cleanPayload = '';
  let receiptLabel = label;

  if (typeof stateData === 'string' && typeof label === 'string' && label.trim().startsWith('{')) {
    receiptLabel = stateData;
    cleanPayload = label;
  } else {
    cleanPayload = typeof stateData === 'string' ? stateData : JSON.stringify(stateData, null, 2);
  }

  const hash = await computeSha256(cleanPayload);
  const receiptId = `0xRCP-${Date.now().toString(16).toUpperCase()}-${Math.floor(Math.random() * 0xffff).toString(16).toUpperCase()}`;

  const receipt: HashReceipt = {
    id: receiptId,
    receiptId,
    label: receiptLabel,
    timestamp: new Date().toISOString(),
    type,
    payload: cleanPayload,
    storedHash: hash,
    algorithm: 'SHA-256',
    author,
    merkleDigest: `0xMK-${hash.slice(2, 18).toUpperCase()}-${hash.slice(-16).toUpperCase()}`,
  };

  await saveReceipt(receipt);
  return receipt;
};

/**
 * Simulates state tampering by modifying the stored payload without updating the stored hash.
 * This triggers immediate visual confirmation of tampering in the Integrity Ledger.
 */
export const simulateReceiptTamper = async (receiptId: string): Promise<boolean> => {
  const receipt = await getReceipt(receiptId);
  if (!receipt) return false;

  // Corrupt the payload by modifying or injecting a malicious byte/directive
  let corruptedPayload = receipt.payload;
  try {
    const parsed = JSON.parse(receipt.payload);
    parsed._tamper_injection = 'UNAUTHORIZED_PRIVILEGE_OVERRIDE_ROOT_EXPLOIT';
    parsed.topology = 'corrupted_singularity_breach';
    corruptedPayload = JSON.stringify(parsed, null, 2);
  } catch {
    corruptedPayload = `${receipt.payload}\n[TAMPERED_INJECTED_STRING_0xDEADC0DE]`;
  }

  receipt.payload = corruptedPayload;
  receipt.tampered = true;
  await saveReceipt(receipt);
  return true;
};

/**
 * Restores or re-signs a tampered receipt by recomputing its stored hash to match its current state
 */
export const repairReceiptHash = async (receiptId: string): Promise<boolean> => {
  const receipt = await getReceipt(receiptId);
  if (!receipt) return false;

  const validHash = await computeSha256(receipt.payload);
  receipt.storedHash = validHash;
  receipt.tampered = false;
  receipt.merkleDigest = `0xMK-${validHash.slice(2, 18).toUpperCase()}-${validHash.slice(-16).toUpperCase()}`;
  await saveReceipt(receipt);
  return true;
};

/**
 * Seeds verifiable initial receipts into IndexedDB if empty
 */
export const seedInitialReceiptsIfEmpty = async (currentState?: any): Promise<HashReceipt[]> => {
  const existing = await getAllReceipts();
  if (existing.length > 0) return existing;

  const initialPayloads: {
    label: string;
    type: HashReceipt['type'];
    data: any;
    author: string;
  }[] = [
    {
      label: 'Genesis Kernel Seal',
      type: 'CONFIG_SEAL',
      data: {
        kernelVersion: 'S.O.S-6.1-HARDENED-TAV1',
        architecture: 'WebAssembly/Three.js/IndexedDB',
        securityLevel: '7777-ROOT-SOVEREIGN',
        timestamp: new Date().toISOString(),
      },
      author: 'Kernel Enclave',
    },
    {
      label: 'Baseline Environment State',
      type: 'STATE_SNAPSHOT',
      data: currentState || {
        topology: 'torus',
        sentiment: 'creative',
        primaryColor: '#c084fc',
        secondaryColor: '#00f2ff',
        speed: 1.05,
      },
      author: 'machackabook@gmail.com',
    },
    {
      label: 'ARX-256 Symplectic Miner Root',
      type: 'ARX_COMPUTE',
      data: {
        roundIndex: 100,
        bijectiveInverseVerified: true,
        schedulerModule: '§-ROUTER-PHASE-Ω+2',
        seedHex: '5555555555555555555555555555555555555555555555555555555555555555',
      },
      author: 'ARX Engine',
    },
    {
      label: 'Cryptographic Auth Gate Cert',
      type: 'AUTH_GATE',
      data: {
        enclaveScope: '0-999999',
        networkGates: 'ALL_GATES_OPEN',
        voiceBiometrics: 'VERIFIED_OPERATOR',
      },
      author: 'ABDCA Policy Enforcer',
    },
  ];

  const created: HashReceipt[] = [];
  for (const item of initialPayloads) {
    const r = await createStateReceipt(item.data, item.label, item.type, item.author);
    created.push(r);
  }

  return created;
};

export const cryptoStorageService = {
  createStateReceipt,
  getAllReceipts,
  verifyReceiptIntegrity,
  computeSha256,
};
