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
  if (!Array.isArray(lane.metrics)) return undefined;
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

function validLaneEnvelope(lane: MeshLaneObservation): boolean {
  return typeof lane.laneId === "string" && lane.laneId.trim().length > 0 &&
    typeof lane.deviceId === "string" && lane.deviceId.trim().length > 0 &&
    typeof lane.failureDomain === "string" && lane.failureDomain.trim().length > 0 &&
    typeof lane.manifestApiVersion === "string" && lane.manifestApiVersion.trim().length > 0 &&
    Number.isFinite(lane.heartbeatAgeMs) && lane.heartbeatAgeMs >= 0 &&
    Number.isInteger(lane.availableConcurrency) && lane.availableConcurrency >= 0 &&
    validFinite(lane.availableMemoryBytes) &&
    Array.isArray(lane.capabilities) &&
    Array.isArray(lane.algorithms);
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
  if (!request.capability.trim() || !request.algorithmId.trim() || !request.requiredApiVersion.trim()) {
    return { status: "hold", reason: "workload_capability_algorithm_or_api_version_missing", rejectedLaneIds: [] };
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
    if (!validLaneEnvelope(lane)) {
      rejected.push(lane.laneId || "<invalid-lane>");
      continue;
    }
    const metric = eligibleMetric(lane, request);
    const failureDomainExcluded = request.excludedFailureDomains?.includes(lane.failureDomain) ?? false;
    const accepted =
      lane.health === "healthy" &&
      lane.heartbeatAgeMs <= request.maxHeartbeatAgeMs &&
      lane.manifestIntegrity === "verified" &&
      lane.receiptChainIntegrity === "verified" &&
      lane.circuit === "closed" &&
      lane.manifestApiVersion === request.requiredApiVersion &&
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

  const preferredObservation = request.preferredLaneId
    ? lanes.find((lane) => lane.laneId === request.preferredLaneId)
    : undefined;
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

  // A failed preferred host is excluded from automatic failover. A coordinator
  // may provide additional excluded domains when it has wider fault evidence.
  const preferredFailureDomain = preferredObservation?.failureDomain;
  const failoverCandidates = request.preferredLaneId && preferredFailureDomain
    ? candidates.filter((candidate) => candidate.lane.failureDomain !== preferredFailureDomain)
    : candidates;

  if (failoverCandidates.length === 0) {
    return {
      status: "hold",
      reason: "no_fresh_compatible_verified_lane_in_an_independent_failure_domain",
      rejectedLaneIds: rejected,
    };
  }

  failoverCandidates.sort((a, b) =>
    b.operationsPerSecond - a.operationsPerSecond ||
    a.latencyMs - b.latencyMs ||
    b.lane.availableConcurrency - a.lane.availableConcurrency ||
    a.lane.laneId.localeCompare(b.lane.laneId)
  );

  const winner = failoverCandidates[0];
  return {
    status: "selected",
    route: request.preferredLaneId ? "failover" : "primary",
    lane: winner.lane,
    measuredOperationsPerSecond: winner.operationsPerSecond,
    measuredLatencyMs: winner.latencyMs,
    reason: request.preferredLaneId
      ? "preferred_lane_unavailable_or_ineligible; selected_best_verified_cross_domain_peer"
      : "selected_best_verified_lane_by_measured_throughput_then_latency",
  };
}
