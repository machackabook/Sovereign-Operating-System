import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Replicating Web Crypto SHA-256 logic used in cryptoStorageService
function computeSha256(data) {
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return `0x${hash}`;
}

test('SHA-256 hash calculation generates consistent 0x-prefixed 64-char hex digest', () => {
  const payload = JSON.stringify({ state: 'torus', speed: 1.05 });
  const hash1 = computeSha256(payload);
  const hash2 = computeSha256(payload);

  assert.equal(hash1, hash2);
  assert.ok(hash1.startsWith('0x'));
  assert.equal(hash1.length, 66); // 0x + 64 hex chars
});

test('Valid receipt passes cryptographic verification', () => {
  const payload = JSON.stringify({ state: 'tesseract', root: '0x999999' });
  const storedHash = computeSha256(payload);

  const receipt = {
    id: '0xRCP-TEST-001',
    receiptId: '0xRCP-TEST-001',
    payload,
    storedHash,
    algorithm: 'SHA-256',
  };

  const recomputed = computeSha256(receipt.payload);
  const isValid = recomputed.toLowerCase() === receipt.storedHash.toLowerCase();

  assert.equal(isValid, true);
  assert.equal(recomputed, receipt.storedHash);
});

test('Tampered payload is immediately detected and flagged as hash mismatch', () => {
  const originalPayload = JSON.stringify({ state: 'torus', role: 'operator' });
  const storedHash = computeSha256(originalPayload);

  // Attacker modifies role to root
  const tamperedPayload = JSON.stringify({ state: 'torus', role: 'unauthorized_root_injected' });

  const receipt = {
    id: '0xRCP-TEST-002',
    receiptId: '0xRCP-TEST-002',
    payload: tamperedPayload,
    storedHash: storedHash, // Stored hash does not match tampered payload
    algorithm: 'SHA-256',
  };

  const recomputed = computeSha256(receipt.payload);
  const isValid = recomputed.toLowerCase() === receipt.storedHash.toLowerCase();

  assert.equal(isValid, false);
  assert.notEqual(recomputed, receipt.storedHash);
});

test('Re-signing a tampered receipt restores cryptographic validity', () => {
  const tamperedPayload = JSON.stringify({ state: 'torus', repaired: true });
  const outdatedHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

  const receipt = {
    id: '0xRCP-TEST-003',
    payload: tamperedPayload,
    storedHash: outdatedHash,
  };

  // Before re-sign
  assert.notEqual(computeSha256(receipt.payload), receipt.storedHash);

  // Re-sign operation
  receipt.storedHash = computeSha256(receipt.payload);

  // After re-sign
  assert.equal(computeSha256(receipt.payload), receipt.storedHash);
});
