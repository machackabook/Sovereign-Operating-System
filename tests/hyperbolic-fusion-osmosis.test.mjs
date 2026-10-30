import test from 'node:test';
import assert from 'node:assert/strict';
import { hyperbolicFusionOsmosisEngine } from '../src/services/hyperbolicFusionOsmosisEngine.js';

test('Hyperbolic Poincaré distance metric is positive-definite and symmetric', () => {
  const origin = [0, 0, 0, 0];
  const p1 = [0.2, 0.3, 0.1, 0.4];
  const p2 = [0.1, 0.2, 0.3, 0.2];

  const dZero = hyperbolicFusionOsmosisEngine.computePoincareDistance(p1, p1);
  assert.equal(dZero, 0);

  const d12 = hyperbolicFusionOsmosisEngine.computePoincareDistance(p1, p2);
  const d21 = hyperbolicFusionOsmosisEngine.computePoincareDistance(p2, p1);
  assert.ok(d12 > 0);
  assert.equal(Math.abs(d12 - d21) < 1e-10, true);
});

test('Hyperbolic Fusion Compression performs lossless roundtrip reconstruction with Fermat token', () => {
  const samplePayload = JSON.stringify({
    architecture: 'Polyglot SOS',
    languages: ['TypeScript', 'Python', 'Rust', 'WASM'],
    hyperbolicCurvature: -1.0,
    timestamp: 1729900000000,
  });

  const compressed = hyperbolicFusionOsmosisEngine.compressHyperbolic(samplePayload);
  assert.ok(compressed.fusedBytes > 0);
  assert.ok(compressed.hyperbolicDistance >= 0);
  assert.match(compressed.osmoticToken, /^0xOSMOSIS-H/);
  assert.match(compressed.fermatResidue, /^0x/);

  const reconstructed = hyperbolicFusionOsmosisEngine.decompressHyperbolic(compressed.payload);
  assert.equal(reconstructed.valid, true);
  assert.equal(reconstructed.text, samplePayload);
});

test('Interoperable Osmosis arbitrates conflicts to guarantee operational status', () => {
  // Normal event
  const evNormal = hyperbolicFusionOsmosisEngine.diffuseOsmosis('VFS', 'write_event', { file: '/root/test.txt' });
  assert.equal(evNormal.sourceSubsystem, 'VFS');
  assert.equal(evNormal.resolvedConflict, false);

  // Fault conflict injection
  const evConflict = hyperbolicFusionOsmosisEngine.diffuseOsmosis('FAULT_INJECTOR', 'corrupt_param', null);
  assert.equal(evConflict.resolvedConflict, true);
  assert.equal(evConflict.value, 'DEFAULT_OPERATIONAL_FALLBACK');
});

test('System Automated Self-Evaluation Check passes 100% across all 9 diagnostic checks', () => {
  const report = hyperbolicFusionOsmosisEngine.runSelfEvalCheck();
  assert.equal(report.passed, true);
  assert.equal(report.scorePercent, 100);
  assert.equal(report.overallStatus, 'OPERATIONAL');
  assert.equal(report.checks.length, 9);
  assert.match(report.verificationDigest, /^0xSELFEVAL-SCORE100/);

  for (const check of report.checks) {
    assert.equal(check.passed, true, `Diagnostic check ${check.name} failed: ${check.details}`);
  }
});
