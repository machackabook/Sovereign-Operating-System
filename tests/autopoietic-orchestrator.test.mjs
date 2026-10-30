import test from 'node:test';
import assert from 'node:assert';
import { AutopoieticOrchestrator } from '../src/services/autopoieticOrchestrator.ts';
import { SovereignSentinelCore } from '../src/services/sovereignSentinelCore.ts';

test('🚀 Autopoietic Boundless Orchestrator & Genetic Quine Tests', async (t) => {

  await t.test('1. Autopoietic Heartbeat & Goal Metrics Scaling', () => {
    const initialAudit = AutopoieticOrchestrator.getTelemetryAudit();
    assert.ok(typeof initialAudit.learningRate === 'number');

    // High FPS heartbeat: unlocks matrix capacity & accelerates learning rate
    AutopoieticOrchestrator.processAutopoieticHeartbeat(60.0);
    const acceleratedAudit = AutopoieticOrchestrator.getTelemetryAudit();

    assert.strictEqual(acceleratedAudit.unboundState, true);
    assert.ok(acceleratedAudit.learningRate > initialAudit.learningRate);
    assert.ok(acceleratedAudit.adaptivePingIntervalMs < 8000);
  });

  await t.test('2. Polymorphic Genetic Quine Mutation Buffer Verification', () => {
    const normalBuf = SovereignSentinelCore.generateSelfSourceBuffer();
    const unrolledBuf = SovereignSentinelCore.generateSelfSourceBuffer('LOOP_UNROLL');
    const cachedBuf = SovereignSentinelCore.generateSelfSourceBuffer('ADAPTIVE_CACHE');

    assert.ok(normalBuf instanceof Uint8Array);
    assert.ok(unrolledBuf instanceof Uint8Array);
    assert.ok(cachedBuf instanceof Uint8Array);

    const unrolledStr = new TextDecoder().decode(unrolledBuf);
    assert.ok(unrolledStr.includes('Genetic Mutation: Unrolled Loop Factor x4 Active'));
  });
});
