# AI Studio V7 integration directive — GAIA / NEXUS

**Target:** Existing GAIA / NEXUS Quantum Rose Convergence V7 workspace.  
**Integration repository:** `machackabook/Sovereign-Operating-System`.  
**Working branch:** `integration/gaia-nexus-mesh-blueprint-20261116`.

## Directive

Inspect the entire current AI Studio source tree before modifying it. Report its configured GitHub remote, branch, latest synchronized commit, and any uncommitted or AI-Studio-only changes. Do not assume that the AI Studio workspace and repository are synchronized.

Preserve the V7 canonical state, Hamiltonian clock, Quantum Rose Governor, Save_Memory SQLite WAL ledger, verification engine, Cryptic gateway, existing service-worker registrations, and current authentication contracts. Extend them through adapters; do not create a competing ledger, identity system, scheduler, clock, renderer, or gateway.

### Runtime separation

Implement three distinct planes:

1. **Application/control plane:** AI Studio V7 application, Hamiltonian state transitions, Cryptic authorization, provider registry, model router, receipts, and operator UI.
2. **Inference plane:** hosted Gemini API and independently enrolled local open-weight model endpoints.
3. **Artifact plane:** immutable, versioned model files and signed manifests stored separately from application source.

AI Studio exports application code. Do not claim that its ZIP contains hosted Gemini model weights. Keep Gemini API credentials server-side in the configured secret manager. Do not put keys, OAuth refresh tokens, access tokens, or credentials in source code, browser storage, Git, model prompts, or model manifests.

### Model artifacts

Support a manifest containing model ID, revision, SHA-256, file format, quantization, license identifier, byte size, hardware requirements, runtime compatibility, source reference, and verification status.

Local open-weight endpoints are ineligible until the artifact digest and license metadata are verified. Hosted Gemini API endpoints must be represented as remote API providers and must not claim local weight availability.

Keep large weight files out of Git. Use private artifact storage or a model registry and retrieve them through authenticated, scoped access. Stage downloads, verify the digest, run a load/self-test, and only then mark an endpoint healthy.

### Dynamic scaling

Integrate the repository's `src/ai/model-routing.ts` policy as the admission selector. It is a pure policy function, not a model runtime or a provisioning service.

Expose actual endpoint observations:
- model ID/revision and provider;
- health and manifest integrity;
- available memory and concurrency;
- queue depth;
- time-to-first-token;
- measured tokens/second;
- metric freshness and failure domain;
- warm/cold state;
- supported capabilities and context window.

Private/restricted data must route only to explicitly approved local endpoints. Public data may use hosted Gemini only when remote processing is explicitly permitted. If no endpoint passes every gate, return HOLD.

Use warm pools, streaming, bounded batching, backpressure, and queue-aware scaling. Never claim instantaneous execution. Report measured latency, throughput, queue wait, cold-start time, and memory.

Keep LLM inference separate from hash/proof-of-work computation. LLMs may plan and classify work; cryptographic verification remains deterministic and independent.

### Recovery

Preserve operation IDs and idempotency keys across retries. Use separate failure domains, circuit breakers, bounded retry budgets, quarantine, independent verification, canary promotion, fencing epochs, and rollback. A repair creates a new immutable candidate version and never overwrites the last known-good version.

### Required verification

Run the new model-routing tests and existing mesh policy, portal, security, audio, HTML, ABDA, TypeScript, and production-build checks. Then verify the actual authenticated provider calls, model load, digest validation, and endpoint-loss recovery.

Do not claim a device is enrolled because a source file exists. Do not claim model weights are installed because a manifest exists. Do not claim dynamic scaling works until an actual provider has been measured and a scale event has been observed.

Stop before production deployment, destructive changes, credential rotation, or merging. Report exact files, commits, raw test results, endpoint identities (non-secret), model artifact digests, benchmark method, and rollback references.

## Governing invariant

`AUTHORIZATION := B AND C AND V`

Boundary — Nothing executes beyond its time.  
Capacity — Nothing claims capacity without measurement.  
Correctness — Nothing claims correctness without verification.
