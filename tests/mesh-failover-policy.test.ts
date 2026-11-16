import test from "node:test";
import assert from "node:assert/strict";
import { selectExecutionLane } from "../src/mesh/failover-policy";
import type { MeshLaneObservation, MeshWorkloadRequest } from "../src/mesh/contracts";

const now = 10_000;

function lane(overrides: Partial<MeshLaneObservation> = {}): MeshLaneObservation {
  return {
    laneId: "lane-q1-01",
    deviceId: "device-a",
    failureDomain: "host-a",
    quadrant: "compute",
    health: "healthy",
    heartbeatAgeMs: 100,
    manifestIntegrity: "verified",
    receiptChainIntegrity: "verified",
    circuit: "closed",
    manifestApiVersion: "1",
    capabilities: ["hash.compute"],
    algorithms: ["sha256"],
    availableConcurrency: 2,
    availableMemoryBytes: 1_000_000,
    metrics: [{
      algorithmId: "sha256",
      operationsPerSecond: 1000,
      latencyMs: 4,
      observedAtMonotonicMs: now - 100,
    }],
    ...overrides,
  };
}

const request: MeshWorkloadRequest = {
  operationId: "op-001",
  idempotencyKey: "idem-001",
  capability: "hash.compute",
  algorithmId: "sha256",
  requiredConcurrency: 1,
  requiredMemoryBytes: 1000,
  preferredLaneId: "lane-q1-01",
  maxHeartbeatAgeMs: 1000,
  maxMetricAgeMs: 1000,
  nowMonotonicMs: now,
};

test("keeps the preferred lane when every admission gate passes", () => {
  const result = selectExecutionLane([lane()], request);
  assert.equal(result.status, "selected");
  if (result.status === "selected") {
    assert.equal(result.route, "primary");
    assert.equal(result.lane.laneId, "lane-q1-01");
  }
});

test("fails over to a verified peer when the preferred lane is unavailable", () => {
  const failed = lane({ laneId: "lane-q1-01", health: "unavailable" });
  const peer = lane({
    laneId: "lane-q2-04",
    deviceId: "device-b",
    failureDomain: "host-b",
    quadrant: "shadow",
    metrics: [{
      algorithmId: "sha256",
      operationsPerSecond: 1800,
      latencyMs: 5,
      observedAtMonotonicMs: now - 80,
    }],
  });
  const result = selectExecutionLane([failed, peer], request);
  assert.equal(result.status, "selected");
  if (result.status === "selected") {
    assert.equal(result.route, "failover");
    assert.equal(result.lane.laneId, "lane-q2-04");
  }
});

test("holds when the only candidate has stale measurements", () => {
  const stale = lane({
    metrics: [{
      algorithmId: "sha256",
      operationsPerSecond: 9000,
      latencyMs: 1,
      observedAtMonotonicMs: now - 5000,
    }],
  });
  const result = selectExecutionLane([stale], request);
  assert.equal(result.status, "hold");
});

test("holds when integrity or receipt-chain verification is unknown", () => {
  const unverified = lane({
    manifestIntegrity: "unknown",
    receiptChainIntegrity: "unknown",
  });
  const result = selectExecutionLane([unverified], request);
  assert.equal(result.status, "hold");
});

test("does not fail over into an excluded failure domain", () => {
  const peer = lane({
    laneId: "lane-q2-04",
    health: "healthy",
    failureDomain: "host-b",
  });
  const result = selectExecutionLane([peer], {
    ...request,
    preferredLaneId: "missing-primary",
    excludedFailureDomains: ["host-b"],
  });
  assert.equal(result.status, "hold");
});

test("ranks eligible peers by measured throughput, then latency", () => {
  const slower = lane({
    laneId: "lane-slower",
    metrics: [{ algorithmId: "sha256", operationsPerSecond: 900, latencyMs: 2, observedAtMonotonicMs: now - 20 }],
  });
  const faster = lane({
    laneId: "lane-faster",
    failureDomain: "host-c",
    metrics: [{ algorithmId: "sha256", operationsPerSecond: 1200, latencyMs: 8, observedAtMonotonicMs: now - 20 }],
  });
  const result = selectExecutionLane([slower, faster], { ...request, preferredLaneId: undefined });
  assert.equal(result.status, "selected");
  if (result.status === "selected") assert.equal(result.lane.laneId, "lane-faster");
});
