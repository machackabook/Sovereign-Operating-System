import test from 'node:test';
import assert from 'node:assert';
import { MiningHashRepairService } from '../src/services/miningHashRepairService.ts';

test('🛡️ Autonomic Mining & Financial Interoperability Tests', async (t) => {
  await t.test('1. Concurrency Lock & Hash Mismatch Repair Validation', async () => {
    const blockId = "0x77446C2E";
    const invalidTargetHash = "0000000000000000000000000000000000000000000000000000000000000000";
    const testPayload = "Sovereign_Mining_Node_Telemetry_Feed_Alpha";

    // Trigger verification on a bad block to force the Mathematica repair engine online
    const reconciledReceipt = await MiningHashRepairService.verifyAndRepairMiningBlock(
      blockId,
      invalidTargetHash,
      testPayload
    );

    assert.ok(reconciledReceipt);
    assert.strictEqual(reconciledReceipt.settlementStatus, 'RECONCILED');
    assert.ok(reconciledReceipt.repairFactor > 0);
    assert.match(reconciledReceipt.receiptId, /^REC_/);
  });
});
