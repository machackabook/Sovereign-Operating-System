/**
 * GAIA / NEXUS logical execution mesh contracts.
 * These are protocol contracts, not a claim that physical nodes are enrolled.
 */
export const MESH_CONTRACT_VERSION = "1.0.0" as const;

export type MeshQuadrant = "ingress" | "compute" | "shadow" | "recovery";
export type LaneHealth = "healthy" | "degraded" | "unavailable" | "unknown";
export type IntegrityState = "verified" | "invalid" | "unknown";
export type CircuitState = "closed" | "open" | "half-open";

export interface MeasuredAlgorithmMetric {
  algorithmId: string;
  operationsPerSecond: number;
  latencyMs: number;
  observedAtMonotonicMs: number;
}

export interface MeshLaneObservation {
  laneId: string;
  deviceId: string;
  failureDomain: string;
  quadrant: MeshQuadrant;
  health: LaneHealth;
  /** Age computed by the observing coordinator's monotonic clock. */
  heartbeatAgeMs: number;
  manifestIntegrity: IntegrityState;
  receiptChainIntegrity: IntegrityState;
  circuit: CircuitState;
  manifestApiVersion: string;
  capabilities: readonly string[];
  algorithms: readonly string[];
  availableConcurrency: number;
  availableMemoryBytes: number;
  metrics: readonly MeasuredAlgorithmMetric[];
}

export interface MeshWorkloadRequest {
  operationId: string;
  idempotencyKey: string;
  capability: string;
  algorithmId: string;
  requiredConcurrency: number;
  requiredMemoryBytes: number;
  preferredLaneId?: string;
  excludedFailureDomains?: readonly string[];
  maxHeartbeatAgeMs: number;
  maxMetricAgeMs: number;
  nowMonotonicMs: number;
}

export type LaneSelection =
  | {
      status: "selected";
      route: "primary" | "failover";
      lane: MeshLaneObservation;
      measuredOperationsPerSecond: number;
      measuredLatencyMs: number;
      reason: string;
    }
  | {
      status: "hold";
      reason: string;
      rejectedLaneIds: readonly string[];
    };
