import test from "node:test";
import assert from "node:assert/strict";
import { transitionNodeUpdate } from "../src/mesh/node-update-policy";
import type { NodeUpdateEvidence, NodeUpdateRecord, NodeUpdateStage } from "../src/mesh/node-update-policy";

const base: NodeUpdateRecord = {
  updateId: "update-001",
  nodeId: "node-windows-01",
  fromVersion: "1.0.0",
  toVersion: "1.1.0",
  manifestSha256: "a".repeat(64),
  stage: "prepared",
  revision: 0,
  leaseEpoch: 7,
  updatedAtMonotonicMs: 100,
  evidence: [],
};

const evidence = (kind: NodeUpdateEvidence["kind"]): NodeUpdateEvidence => ({
  kind,
  receiptRef: "receipt:" + kind,
  verified: true,
});

function advance(
  record: NodeUpdateRecord,
  target: NodeUpdateStage,
  kinds: NodeUpdateEvidence["kind"][],
  at = record.updatedAtMonotonicMs + 10,
) {
  return transitionNodeUpdate(record, {
    target,
    expectedRevision: record.revision,
    leaseEpoch: record.leaseEpoch,
    atMonotonicMs: at,
    evidence: kinds.map(evidence),
  });
}

test("requires manifest and compatibility evidence before staging", () => {
  const blocked = advance(base, "staged", ["manifest-digest"]);
  assert.equal(blocked.accepted, false);
  if (!blocked.accepted) assert.equal(blocked.reason, "required_verified_evidence_missing");
  const accepted = advance(base, "staged", ["manifest-digest", "compatibility"]);
  assert.equal(accepted.accepted, true);
});

test("enforces the full self-test, canary, promotion, and ledger sequence", () => {
  let current = base;
  const steps: Array<[NodeUpdateStage, NodeUpdateEvidence["kind"][]]> = [
    ["staged", ["manifest-digest", "compatibility"]],
    ["self-tested", ["known-answer", "dependency-check"]],
    ["canary", ["canary-health"]],
    ["promoted", ["promotion-authorization"]],
    ["reconciled", ["ledger-receipt"]],
  ];
  for (const [target, kinds] of steps) {
    const result = advance(current, target, kinds);
    assert.equal(result.accepted, true);
    if (result.accepted) current = result.record;
  }
  assert.equal(current.stage, "reconciled");
  assert.equal(current.revision, 5);
  assert.equal(current.evidence.length, 7);
});

test("prevents skipping the canary gate", () => {
  const staged = advance(base, "staged", ["manifest-digest", "compatibility"]);
  assert.equal(staged.accepted, true);
  if (!staged.accepted) return;
  const skipped = advance(staged.record, "promoted", ["promotion-authorization"]);
  assert.equal(skipped.accepted, false);
  if (!skipped.accepted) assert.equal(skipped.reason, "illegal_update_stage_transition");
});

test("rejects stale revision and stale fencing epoch", () => {
  const staleRevision = transitionNodeUpdate(base, {
    target: "staged", expectedRevision: 9, leaseEpoch: 7,
    atMonotonicMs: 110,
    evidence: [evidence("manifest-digest"), evidence("compatibility")],
  });
  assert.equal(staleRevision.accepted, false);
  if (!staleRevision.accepted) assert.equal(staleRevision.reason, "revision_conflict");

  const staleLease = transitionNodeUpdate(base, {
    target: "staged", expectedRevision: 0, leaseEpoch: 6,
    atMonotonicMs: 110,
    evidence: [evidence("manifest-digest"), evidence("compatibility")],
  });
  assert.equal(staleLease.accepted, false);
  if (!staleLease.accepted) assert.equal(staleLease.reason, "stale_or_mismatched_fencing_epoch");
});

test("allows verified rollback and makes the update terminal", () => {
  const result = advance(base, "rolled-back", ["rollback-confirmation"]);
  assert.equal(result.accepted, true);
  if (!result.accepted) return;
  assert.equal(result.record.stage, "rolled-back");
  const second = advance(result.record, "staged", ["manifest-digest", "compatibility"]);
  assert.equal(second.accepted, false);
  if (!second.accepted) assert.equal(second.reason, "update_is_terminal_create_new_update_id");
});

test("quarantines only with a persisted failure record", () => {
  const missing = advance(base, "quarantined", []);
  assert.equal(missing.accepted, false);
  const valid = advance(base, "quarantined", ["failure-record"]);
  assert.equal(valid.accepted, true);
});
