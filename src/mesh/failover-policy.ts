import type {
  LaneSelection,
  MeshLaneObservation,
  MeshWorkloadRequest,
} from "./contracts";

function validFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function eligibleMetric(
  lane: MeshLaneObservation,
  request: MeshWorkloadRequest,
) {
  return lane.metrics.find((metric) =>
    metric.algorithmId === request.algorithmId &&
    Number.isFinite(metric.operationsPerSecond) &&
    metric.operationsPerSecond > 0 &&
    validFinite(metric.latencyMs) &&
    Number.isFinite(metric.observedAtMonotonicMs) &&
    metric.observedAtMonotonicMs <= request.nowMonotonicMs &&
    request.nowMonotonicMs - metric.observedAtMonotonicMs <= request.maxMetricAgeMs
  );
}

/**
 * Pure, deterministic admission policy.
 * It chooses only from coordinator-observed, fresh, integrity-verified lanes.
 * It does not dispatch work or perform a hot swap; those effects belong to an
 * authenticated coordinator that enforces leases and fencing tokens.
 */
export function selectExecutionLane(
  lanes: readonly MeshLaneObservation[],
  request: MeshWorkloadRequest,
): LaneSelection {
  if (!request.operationId.trim() || !request.idempotencyKey.trim()) {
    return { status: "hold", reason: "operation_identity_missing", rejectedLaneIds: [] };
  }
  if (!request.capability.trim() || !request.algorithmId.trim()) {
    return { status: "hold", reason: "workload_capability_or_algorithm_missing", rejectedLaneIds: [] };
  }
  if (!Number.isFinite(request.nowMonotonicMs) ||
      !validFinite(request.maxHeartbeatAgeMs) ||
      !validFinite(request.maxMetricAgeMs) ||
      !Number.isInteger(request.requiredConcurrency) ||
      request.requiredConcurrency < 1 ||
      !validFinite(request.requiredMemoryBytes)) {
    return { status: "hold", reason: "invalid_admission_measurements_or_limits", rejectedLaneIds: [] };
  }

  const rejected: string[] = [];
  const candidates: Array<{
    lane: MeshLaneObservation;
    operationsPerSecond: number;
    latencyMs: number;
  }> = [];

  for (const lane of lanes) {
    const metric = eligibleMetric(lane, request);
    const failureDomainExcluded = request.excludedFailureDomains?.includes(lane.failureDomain) ?? false;
    const accepted =
      lane.health === "healthy" &&
      lane.heartbeatAgeMs >= 0 &&
      lane.heartbeatAgeMs <= request.maxHeartbeatAgeMs &&
      lane.manifestIntegrity === "verified" &&
      lane.receiptChainIntegrity === "verified" &&
      lane.circuit === "closed" &&
      lane.manifestApiVersion.length > 0 &&
      lane.capabilities.includes(request.capability) &&
      lane.algorithms.includes(request.algorithmId) &&
      lane.availableConcurrency >= request.requiredConcurrency &&
      lane.availableMemoryBytes >= request.requiredMemoryBytes &&
      !failureDomainExcluded &&
      !!metric;

    if (!accepted || !metric) {
      rejected.push(lane.laneId);
      continue;
    }
    candidates.push({
      lane,
      operationsPerSecond: metric.operationsPerSecond,
      latencyMs: metric.latencyMs,
    });
  }

  if (candidates.length === 0) {
    return {
      status: "hold",
      reason: "no_fresh_compatible_verified_lane_with_measured_capacity",
      rejectedLaneIds: rejected,
    };
  }

  const preferred = request.preferredLaneId
    ? candidates.find((candidate) => candidate.lane.laneId === request.preferredLaneId)
    : undefined;

  if (preferred) {
    return {
      status: "selected",
      route: "primary",
      lane: preferred.lane,
      measuredOperationsPerSecond: preferred.operationsPerSecond,
      measuredLatencyMs: preferred.latencyMs,
      reason: "preferred_lane_passed_all_admission_gates",
    };
  }

  candidates.sort((a, b) =>
    b.operationsPerSecond - a.operationsPerSecond ||
    a.latencyMs - b.latencyMs ||
    b.lane.availableConcurrency - a.lane.availableConcurrency ||
    a.lane.laneId.localeCompare(b.lane.laneId)
  );

  const winner = candidates[0];
  return {
    status: "selected",
    route: request.preferredLaneId ? "failover" : "primary",
    lane: winner.lane,
    measuredOperationsPerSecond: winner.operationsPerSecond,
    measuredLatencyMs: winner.latencyMs,
    reason: request.preferredLaneId
      ? "preferred_lane_unavailable_or_ineligible; selected_best_verified_peer"
      : "selected_best_verified_lane_by_measured_throughput_then_latency",
  };
}
