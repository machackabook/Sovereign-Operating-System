/**
 * Provider-neutral model routing policy for GAIA / NEXUS.
 *
 * This module selects a verified runtime from coordinator observations.
 * It does not download weights, execute inference, or authenticate providers.
 * Those effects belong to server-side adapters with scoped credentials.
 */
export type ModelProvider = "gemini-api" | "local-open-weight";
export type DataSensitivity = "public" | "private" | "restricted";
export type ModelHealth = "healthy" | "degraded" | "unavailable" | "unknown";
export type ModelArtifactFormat = "gguf" | "safetensors" | "litert" | "tflite" | "onnx";

export interface ModelArtifactManifest {
  sha256: string;
  format: ModelArtifactFormat;
  licenseId: string;
  quantization: string;
  bytes: number;
  verified: boolean;
}

export interface ModelRuntimeMetric {
  tokensPerSecond: number;
  timeToFirstTokenMs: number;
  queueDepth: number;
  observedAtMonotonicMs: number;
}

export interface ModelEndpointObservation {
  endpointId: string;
  provider: ModelProvider;
  modelId: string;
  modelRevision: string;
  failureDomain: string;
  health: ModelHealth;
  manifestVerified: boolean;
  capabilities: readonly string[];
  maxContextTokens: number;
  maxConcurrency: number;
  availableConcurrency: number;
  availableMemoryBytes: number;
  warm: boolean;
  metric: ModelRuntimeMetric;
  /** Required for local weights; absent for hosted Gemini API models. */
  artifact?: ModelArtifactManifest;
}

export interface ModelRoutingRequest {
  operationId: string;
  capability: string;
  allowedProviders: readonly ModelProvider[];
  sensitivity: DataSensitivity;
  allowRemoteProcessing: boolean;
  minContextTokens: number;
  requiredConcurrency: number;
  requiredMemoryBytes: number;
  minTokensPerSecond: number;
  maxTimeToFirstTokenMs: number;
  maxMetricAgeMs: number;
  nowMonotonicMs: number;
  preferredEndpointId?: string;
}

export type ModelRouteDecision =
  | {
      status: "selected";
      route: "preferred" | "scaled-peer";
      endpoint: ModelEndpointObservation;
      reason: string;
    }
  | {
      status: "hold";
      reason: string;
      rejectedEndpointIds: readonly string[];
    };

function finiteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function validLocalArtifact(artifact: ModelArtifactManifest | undefined): boolean {
  const formats: readonly string[] = ["gguf", "safetensors", "litert", "tflite", "onnx"];
  return !!artifact &&
    /^[a-f0-9]{64}$/i.test(artifact.sha256) &&
    formats.includes(artifact.format) &&
    typeof artifact.licenseId === "string" &&
    artifact.licenseId.trim().length > 0 &&
    typeof artifact.quantization === "string" &&
    artifact.quantization.trim().length > 0 &&
    Number.isSafeInteger(artifact.bytes) &&
    artifact.bytes > 0 &&
    artifact.verified === true;
}

function validEndpointEnvelope(endpoint: ModelEndpointObservation): boolean {
  if (!endpoint || typeof endpoint !== "object" ||
      !endpoint.metric || typeof endpoint.metric !== "object") return false;

  const metric = endpoint.metric;
  return typeof endpoint.endpointId === "string" && endpoint.endpointId.trim().length > 0 &&
    (endpoint.provider === "gemini-api" || endpoint.provider === "local-open-weight") &&
    typeof endpoint.modelId === "string" && endpoint.modelId.trim().length > 0 &&
    typeof endpoint.modelRevision === "string" && endpoint.modelRevision.trim().length > 0 &&
    typeof endpoint.failureDomain === "string" && endpoint.failureDomain.trim().length > 0 &&
    (endpoint.health === "healthy" || endpoint.health === "degraded" ||
      endpoint.health === "unavailable" || endpoint.health === "unknown") &&
    typeof endpoint.warm === "boolean" &&
    Number.isInteger(endpoint.maxContextTokens) && endpoint.maxContextTokens > 0 &&
    Number.isInteger(endpoint.maxConcurrency) && endpoint.maxConcurrency > 0 &&
    Number.isInteger(endpoint.availableConcurrency) && endpoint.availableConcurrency >= 0 &&
    finiteNonNegative(endpoint.availableMemoryBytes) &&
    Array.isArray(endpoint.capabilities) &&
    endpoint.capabilities.every((capability) => typeof capability === "string") &&
    finiteNonNegative(metric.tokensPerSecond) &&
    finiteNonNegative(metric.timeToFirstTokenMs) &&
    Number.isInteger(metric.queueDepth) && metric.queueDepth >= 0 &&
    Number.isFinite(metric.observedAtMonotonicMs);
}

function eligible(
  endpoint: ModelEndpointObservation,
  request: ModelRoutingRequest,
): boolean {
  if (!validEndpointEnvelope(endpoint)) return false;
  const metric = endpoint.metric;
  const metricFresh =
    metric.observedAtMonotonicMs <= request.nowMonotonicMs &&
    request.nowMonotonicMs - metric.observedAtMonotonicMs <= request.maxMetricAgeMs;

  const privacyAllowed =
    request.allowedProviders.includes(endpoint.provider) &&
    (endpoint.provider !== "gemini-api" ||
      (request.allowRemoteProcessing && request.sensitivity === "public"));

  const artifactAllowed =
    endpoint.provider !== "local-open-weight" || validLocalArtifact(endpoint.artifact);

  return endpoint.health === "healthy" &&
    endpoint.manifestVerified === true &&
    privacyAllowed &&
    artifactAllowed &&
    endpoint.capabilities.includes(request.capability) &&
    endpoint.maxContextTokens >= request.minContextTokens &&
    endpoint.availableConcurrency >= request.requiredConcurrency &&
    endpoint.availableMemoryBytes >= request.requiredMemoryBytes &&
    finiteNonNegative(metric.tokensPerSecond) &&
    metric.tokensPerSecond >= request.minTokensPerSecond &&
    finiteNonNegative(metric.timeToFirstTokenMs) &&
    metric.timeToFirstTokenMs <= request.maxTimeToFirstTokenMs &&
    Number.isInteger(metric.queueDepth) &&
    metric.queueDepth >= 0 &&
    metricFresh;
}

/**
 * Selects only a healthy, fresh, manifest-verified endpoint with sufficient
 * measured throughput, context, concurrency, and memory.
 *
 * Private/restricted inputs are routed only to local open-weight endpoints.
 * A missing or unverified local weight manifest causes HOLD.
 */
export function selectModelEndpoint(
  endpoints: readonly ModelEndpointObservation[],
  request: ModelRoutingRequest,
): ModelRouteDecision {
  if (!request.operationId.trim() || !request.capability.trim()) {
    return { status: "hold", reason: "operation_identity_or_capability_missing", rejectedEndpointIds: [] };
  }

  if (!Array.isArray(request.allowedProviders) || request.allowedProviders.length === 0 ||
      !Number.isInteger(request.minContextTokens) || request.minContextTokens < 1 ||
      !Number.isInteger(request.requiredConcurrency) || request.requiredConcurrency < 1 ||
      !finiteNonNegative(request.requiredMemoryBytes) ||
      !finiteNonNegative(request.minTokensPerSecond) ||
      !finiteNonNegative(request.maxTimeToFirstTokenMs) ||
      !finiteNonNegative(request.maxMetricAgeMs) ||
      !finiteNonNegative(request.nowMonotonicMs)) {
    return { status: "hold", reason: "invalid_model_routing_limits_or_measurements", rejectedEndpointIds: [] };
  }

  const rejected: string[] = [];
  const candidates: ModelEndpointObservation[] = [];

  for (const endpoint of endpoints) {
    if (eligible(endpoint, request)) candidates.push(endpoint);
    else rejected.push(endpoint?.endpointId || "<invalid-endpoint>");
  }

  const preferred = request.preferredEndpointId
    ? candidates.find((endpoint) => endpoint.endpointId === request.preferredEndpointId)
    : undefined;

  if (preferred) {
    return {
      status: "selected",
      route: "preferred",
      endpoint: preferred,
      reason: "preferred_endpoint_passed_all_health_capacity_privacy_and_artifact_gates",
    };
  }

  candidates.sort((a, b) =>
    Number(b.warm) - Number(a.warm) ||
    b.metric.tokensPerSecond - a.metric.tokensPerSecond ||
    a.metric.timeToFirstTokenMs - b.metric.timeToFirstTokenMs ||
    a.metric.queueDepth - b.metric.queueDepth ||
    a.endpointId.localeCompare(b.endpointId)
  );

  const winner = candidates[0];
  if (!winner) {
    return {
      status: "hold",
      reason: "no_eligible_model_endpoint_for_privacy_capacity_and_freshness_requirements",
      rejectedEndpointIds: rejected,
    };
  }

  return {
    status: "selected",
    route: "scaled-peer",
    endpoint: winner,
    reason: "selected_best_eligible_endpoint_by_warmth_throughput_latency_and_queue_depth",
  };
}
