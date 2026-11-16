# AI Studio Directive — GAIA / NEXUS Mesh Integration

**Target workspace:** GAIA / NEXUS — Quantum Rose Convergence v7.0.0  
**Repository companion:** `machackabook/Sovereign-Operating-System`  
**Integration state:** Extend existing V7 code; do not replace it.  
**Architecture order:** S.O.S → HAMILTONIAN → CRYPTIC → GAIA → VERIFIED LEDGER.

## Directive

Inspect the entire current AI Studio project and its dependency graph before editing. Preserve working V7 modules, user data, Save_Memory SQLite WAL records, service-worker registrations, and existing Cloudflare/Firebase integration. Do not create a competing gateway, authentication system, ledger, clock, renderer, or canonical type family.

Integrate the existing V7 engines through adapters and explicit versioned contracts. First reconcile the AI Studio project with the S.O.S GitHub repository; report the exact remote URL, branch, commit, and any source divergence. Do not assume the two workspaces are already synchronized.

### 1. Preserve and map existing modules

Inspect at minimum:

- `src/engine/quantumRoseGovernor.ts`
- `src/engine/hamiltonianNeuralClock.ts`
- `src/engine/circularProcessingRuntime.ts`
- `src/engine/cosmicGuardianVoidEngine.ts`
- `src/engine/dreamingGrimoireEngine.ts`
- `src/engine/saveMemory.ts`
- `src/engine/v7VerificationEngine.ts`
- `src/engine/crypticGraphingEngine.ts`
- `src/engine/crypticRuntimeService.ts`
- `src/engine/pqMerkleReceiptEngine.ts`
- `src/types/cryptic.ts`, `src/types/gaiaNexus.ts`, `src/types/nexus.ts`
- `src/os/interfaces/*`, workers, and existing workspaces.

Produce a file ownership map and dependency graph before changes. Extend existing types and stores; do not duplicate them.

### 2. Implement the 64-lane logical mesh

Use the specification in `docs/GAIA-NEXUS-64-LANE-MESH.md`.

- Four quadrants × 16 logical lanes: ingress, compute, shadow verification, recovery/control.
- Logical lanes are not a claim of 64 physical cores. Cap concurrency using measured hardware and provider limits.
- Every lane has a versioned manifest, stable identity, failure domain, capabilities, heartbeat, measured algorithm-specific throughput, capacity, circuit state, lease epoch, and receipt status.
- Route only to compatible, healthy, fresh, verified lanes with measured capacity.
- Use cross-failure-domain shadow and recovery peers.
- Keep idle slots as bounded command/control queue capacity, never as untyped void.
- Use operation IDs, idempotency keys, deadlines, leases, and fencing tokens.

### 3. Implement recovery as a verified upgrade path

Implement bounded failover, circuit breakers, retry budgets, quarantine, repair cards, canary promotion, and rollback. A repair candidate becomes a new immutable version. Never overwrite the last-known-good artifact. Never promote on timeout recovery alone.

Node update lifecycle: PREPARE → STAGE → SELF-TEST → CANARY → PROMOTE → RECONCILE, with ROLLBACK to the previous version on any failed gate. Use per-node atomic version-pointer changes; do not claim globally atomic distributed updates.

### 4. Preserve security boundaries

Reuse the existing Firebase Google + Cloudflare Access + Cryptic exchange. Cryptic remains the identity/policy authority. Do not expose Access assertions or Firebase/bridge tokens to browser JavaScript, logs, localStorage, URLs, telemetry, or model prompts. Do not distribute refresh tokens between devices.

The private NEXUS agent remains outbound-only and allowlist-driven. No arbitrary shell/PTY endpoint, no implicit remote desktop control, no permission escalation, and no second OAuth flow. Each connected service uses its own scoped, short-lived credential and explicit revocation.

### 5. Integrate + CCRN/1

Preserve the exact header and grammar in `docs/CCRN-1-SPEC.md`. Implement typed parser errors and property tests for modulus validity, coprime traversal, modular inverses, signed direction, and byte-preserving round trips. Do not imply modular inverses reverse cryptographic hashes.

### 6. Performance and correctness

Measure throughput per algorithm, device, backend, and batch size. Compare CPU, WASM SIMD, WebGPU, and native providers only when supported. Keep primary compute separate from independent verification. Validate complete digest and protocol target with exact endianness. Do not use unproven SHA-256 round pruning or synthetic input headers.

Keep the renderer observational. It may visualize verified state, lane health, color-temperature displacement, and geometry; it cannot authorize execution or write authoritative receipts.

### 7. Acceptance gates

Run the repository's actual test scripts, TypeScript checks, production build, Worker syntax checks, security tests, and browser smoke tests. Add unit/property tests for lane selection, stale heartbeat rejection, capability mismatch, failure-domain separation, lease fencing, idempotency, repair quarantine, canary, and rollback.

Report exact files changed, commit and branch, test commands and raw results, measured throughput with methodology, unverified providers/devices, remaining blockers, and rollback reference. Do not mark the system production-ready unless all required gates pass.

**Stop before destructive operations, secret changes, production deployment, branch protection changes, or merge. Preserve the existing main branch and known-good versions.**

**The Architect / Nexus / Cryptic News LLC / Project: The Nexus Generation: GaiaSSoul / SERIES: The Nexus of Gaia / ID: 137451921129154222|040592|433855274**
