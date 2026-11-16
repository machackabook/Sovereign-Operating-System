import test from "node:test";
import assert from "node:assert/strict";
import { selectModelEndpoint } from "../src/ai/model-routing";
import type {
  ModelEndpointObservation,
  ModelRoutingRequest,
} from "../src/ai/model-routing";

const now = 50_000;

const localArtifact = {
  sha256: "a".repeat(64),
  format: "gguf" as const,
  licenseId: "gemma-terms-v1",
  quantization: "Q4_K_M",
  bytes: 4_000_000_000,
  verified: true,
};

function endpoint(overrides: Partial<ModelEndpointObservation> = {}): ModelEndpointObservation {
  return {
    endpointId: "windows-gemma",
    provider: "local-open-weight",
    modelId: "gemma-local",
    modelRevision: "rev-001",
    failureDomain: "gaiaswindow",
    health: "healthy",
    manifestVerified: true,
    capabilities: ["chat.generate", "code.assist"],
    maxContextTokens: 8192,
    maxConcurrency: 2,
    availableConcurrency: 1,
    availableMemoryBytes: 8_000_000_000,
    warm: true,
    metric: {
      tokensPerSecond: 42,
      timeToFirstTokenMs: 180,
      queueDepth: 0,
      observedAtMonotonicMs: now - 50,
    },
    artifact: localArtifact,
    ...overrides,
  };
}

const request: ModelRoutingRequest = {
  operationId: "model-op-001",
  capability: "chat.generate",
  allowedProviders: ["local-open-weight", "gemini-api"],
  sensitivity: "private",
  allowRemoteProcessing: true,
  minContextTokens: 4096,
  requiredConcurrency: 1,
  requiredMemoryBytes: 2_000_000_000,
  minTokensPerSecond: 10,
  maxTimeToFirstTokenMs: 1000,
  maxMetricAgeMs: 1000,
  nowMonotonicMs: now,
  preferredEndpointId: "windows-gemma",
};

test("selects the preferred local model when its weight manifest is verified", () => {
  const result = selectModelEndpoint([endpoint()], request);
  assert.equal(result.status, "selected");
  if (result.status === "selected") {
    assert.equal(result.route, "preferred");
    assert.equal(result.endpoint.endpointId, "windows-gemma");
  }
});

test("never routes private or restricted data to the hosted Gemini API", () => {
  const remote = endpoint({
    endpointId: "gemini-hosted",
    provider: "gemini-api",
    modelId: "gemini-model",
    failureDomain: "google-hosted",
    artifact: undefined,
  });
  const result = selectModelEndpoint([remote], {
    ...request,
    preferredEndpointId: undefined,
  });
  assert.equal(result.status, "hold");
});

test("requires a verified weight digest and license for local open weights", () => {
  const invalid = endpoint({
    artifact: { ...localArtifact, verified: false },
  });
  const result = selectModelEndpoint([invalid], request);
  assert.equal(result.status, "hold");
});

test("ranks eligible endpoints by warm state, measured throughput, latency, and queue", () => {
  const slower = endpoint({
    endpointId: "local-slower",
    metric: {
      tokensPerSecond: 20,
      timeToFirstTokenMs: 120,
      queueDepth: 0,
      observedAtMonotonicMs: now - 20,
    },
  });
  const faster = endpoint({
    endpointId: "local-faster",
    failureDomain: "penguin",
    warm: false,
    metric: {
      tokensPerSecond: 60,
      timeToFirstTokenMs: 240,
      queueDepth: 1,
      observedAtMonotonicMs: now - 20,
    },
  });
  const result = selectModelEndpoint([slower, faster], {
    ...request,
    preferredEndpointId: undefined,
  });
  assert.equal(result.status, "selected");
  if (result.status === "selected") assert.equal(result.endpoint.endpointId, "local-slower");
});

test("holds when the only endpoint has stale measurements", () => {
  const stale = endpoint({
    metric: {
      tokensPerSecond: 900,
      timeToFirstTokenMs: 1,
      queueDepth: 0,
      observedAtMonotonicMs: now - 5000,
    },
  });
  const result = selectModelEndpoint([stale], request);
  assert.equal(result.status, "hold");
});

test("holds when the local endpoint lacks sufficient memory or concurrency", () => {
  const constrained = endpoint({
    availableMemoryBytes: 1,
    availableConcurrency: 0,
  });
  const result = selectModelEndpoint([constrained], request);
  assert.equal(result.status, "hold");
});

test("permits hosted Gemini only for public data with explicit remote permission", () => {
  const remote = endpoint({
    endpointId: "gemini-hosted",
    provider: "gemini-api",
    modelId: "gemini-model",
    failureDomain: "google-hosted",
    artifact: undefined,
  });
  const result = selectModelEndpoint([remote], {
    ...request,
    sensitivity: "public",
    allowRemoteProcessing: true,
    preferredEndpointId: "gemini-hosted",
  });
  assert.equal(result.status, "selected");
  if (result.status === "selected") assert.equal(result.endpoint.provider, "gemini-api");
});

test("holds when remote processing is disabled even for public data", () => {
  const remote = endpoint({
    endpointId: "gemini-hosted",
    provider: "gemini-api",
    modelId: "gemini-model",
    failureDomain: "google-hosted",
    artifact: undefined,
  });
  const result = selectModelEndpoint([remote], {
    ...request,
    sensitivity: "public",
    allowRemoteProcessing: false,
    preferredEndpointId: undefined,
  });
  assert.equal(result.status, "hold");
});
test("holds malformed endpoint telemetry instead of throwing", () => {
  const malformed = { ...endpoint(), metric: undefined } as unknown as ModelEndpointObservation;
  const result = selectModelEndpoint([malformed], request);
  assert.equal(result.status, "hold");
});
