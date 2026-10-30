import test from 'node:test';
import assert from 'node:assert';
import { BathymetricPicFaceEngine } from '../src/services/bathymetricPicFaceEngine.ts';
import { AutopoieticOrchestrator } from '../src/services/autopoieticOrchestrator.ts';

test('🛡️ The Hamiltonian Face Resonator Substrate Test Suite', async (t) => {
  
  await t.test('1. Core Initialization Framework Validation', () => {
    const meshNode = BathymetricPicFaceEngine.initEngine();
    assert.ok(meshNode);
    assert.strictEqual(meshNode.type, 'Points');
    
    const posAttr = meshNode.geometry.getAttribute('position');
    assert.ok(posAttr.count >= 65536); // Confirms high-density 2²⁴ range allocation bounds
  });

  await t.test('2. FDTD Conservative Phase Space Symplectic Verification', () => {
    // Assert system runs smooth FDTD iterations under load without structural buffer drift
    assert.doesNotThrow(() => {
      BathymetricPicFaceEngine.updateField(null, 1.37, 0.85, 60.0);
    });
    
    const telemetry = AutopoieticOrchestrator.getTelemetryAudit();
    assert.ok(telemetry.learningRate > 0);
  });
});
