import test from 'node:test';
import assert from 'node:assert';
import { VfsStorageAccessService } from '../src/services/vfsStorageAccessService.ts';

test('📁 Storage Engine Block Allocation & Navigation Verification Matrix', async (t) => {
  await t.test('1. Hardware Block Volume Attestation', () => {
    const topology = VfsStorageAccessService.getBlockTopology();
    assert.ok(topology["/"]);
    assert.strictEqual(topology["/"].deviceNode, "/dev/nvme0n1p2");
    assert.strictEqual(topology["/"].filesystemType, "ext4");
  });

  await t.test('2. Directory Query Parameter Parsing Checks', () => {
    const rootNodes = VfsStorageAccessService.queryDirectoryContents("/");
    const systemSubdirectories = rootNodes.map(node => node.name);
    assert.ok(systemSubdirectories.includes("sys"));
    assert.ok(systemSubdirectories.includes("docs"));
  });

  await t.test('3. Raw Buffer Extractor Flow Stability', () => {
    const welcomePayload = VfsStorageAccessService.readRawFileBuffer("/root/welcome.txt");
    assert.ok(welcomePayload.includes("OMNI-NEXUS SYSTEM WELCOME"));
  });
});
