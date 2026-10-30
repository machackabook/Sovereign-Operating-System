import test from 'node:test';
import assert from 'node:assert';
import { SovereignSentinelCore } from '../src/services/sovereignSentinelCore.ts';
import { AutopoieticOrchestrator } from '../src/services/autopoieticOrchestrator.ts';
import { SymplecticEngine } from '../src/services/symplecticEngine.ts';
import { BathymetricPicFaceEngine } from '../src/services/bathymetricPicFaceEngine.ts';

test('🛡️ Sovereign Sentinel Autonomic Security Tests', async (t) => {

  await t.test('1. Malicious Input & Null-Byte Defenses', () => {
    const toxicInput = '\0../../sys/kernel/override_script.sh<script>alert(1)</script>';
    const cleanOutput = SovereignSentinelCore.scrubIncomingPayload(toxicInput);

    assert.ok(!cleanOutput.includes('\0'));
    assert.ok(!cleanOutput.includes('../../'));
    assert.ok(!cleanOutput.includes('<script>'));
    assert.strictEqual(cleanOutput, 'sys/kernel/override_script.sh');
  });

  await t.test('2. Micro-Percentile State Extraction and Reconstitution', () => {
    const survivalToken = SovereignSentinelCore.serializeSurvivalState();
    assert.strictEqual(typeof survivalToken, 'string');
    assert.ok(survivalToken.length > 0);

    const recoverySuccess = SovereignSentinelCore.reconstituteFromToken(survivalToken);
    assert.strictEqual(recoverySuccess, true);
  });

  await t.test('3. Deterministic Quine Integrity & Uint8Array Buffer Verification', () => {
    const selfSource = SovereignSentinelCore.generateSelfSource();
    assert.ok(selfSource.includes('SovereignSentinelCore'));

    const rawBuffer = SovereignSentinelCore.generateSelfSourceBuffer();
    assert.ok(rawBuffer instanceof Uint8Array);
    assert.ok(rawBuffer.length > 0);

    const overloadedBuffer = SovereignSentinelCore.generateSelfSource(true);
    assert.ok(overloadedBuffer instanceof Uint8Array);
    assert.strictEqual(overloadedBuffer.length, rawBuffer.length);
  });

  await t.test('4. ReadableStream & Uint8Array Buffer Quine Streaming Verification', async () => {
    const stream = SovereignSentinelCore.generateSelfSourceStream();
    assert.ok(stream instanceof ReadableStream);

    const reader = stream.getReader();
    const { value, done } = await reader.read();
    assert.ok(!done);
    assert.ok(value instanceof Uint8Array);

    const decoded = new TextDecoder().decode(value);
    assert.ok(decoded.includes('SovereignSentinelCore'));
  });

  await t.test('5. Mathematica Systemic Decay/Growth & Uncapped AI Learning Rate Verification', () => {
    const primeLogSum = SovereignSentinelCore.calculatePrimeLogSum(50);
    assert.ok(primeLogSum > 0);

    const result = SovereignSentinelCore.calculateSystemicFactors({
      alpha: 0.15,
      t: 2.0,
      gapWeight: 0.1,
      zetaWeight: 1.414,
      decay: 0.05,
      baseLearningRate: 0.01,
    });

    assert.ok(typeof result.factor === 'number' && !isNaN(result.factor));
    assert.ok(typeof result.integratedFactor === 'number' && !isNaN(result.integratedFactor));
    assert.ok(result.uncappedLearningRate > 0);
    assert.ok(result.mathematicaFormula.includes('Exp['));
    assert.ok(result.integralFormula.includes('Integrate['));

    const quickLR = SovereignSentinelCore.calibrateUncappedLearningRate(0.05, 3.0);
    assert.ok(quickLR > 0);
  });
});

test('🚀 AutopoieticOrchestrator Dynamic Learning Rate Scaling Suite', async (t) => {
  await t.test('Validates uncapped dynamic learning rate acceleration factors based on 60.0 FPS homeostatic target', () => {
    const initialAudit = AutopoieticOrchestrator.getTelemetryAudit();
    assert.ok(typeof initialAudit.learningRate === 'number');

    // Execute multiple homeostatic 60 FPS heartbeat pulses
    AutopoieticOrchestrator.processAutopoieticHeartbeat(60.0);
    AutopoieticOrchestrator.processAutopoieticHeartbeat(60.0);
    AutopoieticOrchestrator.processAutopoieticHeartbeat(60.0);

    const acceleratedAudit = AutopoieticOrchestrator.getTelemetryAudit();

    assert.strictEqual(acceleratedAudit.unboundState, true);
    // Confirms exponential acceleration with zero upper ceiling limits (1.05^3 multiplier)
    assert.ok(acceleratedAudit.learningRate >= initialAudit.learningRate * 1.15);
    assert.ok(acceleratedAudit.adaptivePingIntervalMs <= 1000);
  });
});

test('The Hamiltonian Test', async (t) => {
  await t.test('Verifies dynamic creation of Hamiltonian shapes including Treyarch within Bitwise RGBA collision Octave trace', () => {
    const engine = new SymplecticEngine('const state = 1;');
    const initialState = engine.getState();
    assert.strictEqual(initialState.kinetic, 0);

    const testCode = 'const state = 2; console.log("Phase space evolution");';
    const result = engine.attemptMutation(testCode, 0.05);

    assert.strictEqual(result.accepted, true);
    const newState = engine.getState();
    assert.ok(newState.hamiltonian >= 0);
    assert.ok(result.energyDrift >= 0);

    // Initialize PIC Bathymetric Face Resonator
    const picMesh = BathymetricPicFaceEngine.initEngine();
    assert.ok(picMesh);
    const material = picMesh.material;
    // In NodeMaterial mode, we check for vertexNode existence
    assert.ok(material.vertexNode);
    assert.ok(material.fragmentNode);
  });
});
