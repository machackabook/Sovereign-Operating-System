# TDOC — Hamiltonian Parsing Cube / Polyglot Quine S.O.S. Roadmap

**State:** Proposed integration specification and candidate implementation. Not production-certified.  
**System of record:** `machackabook/Sovereign-Operating-System`, default branch `main`.  
**Integration:** TDOC workstream; preserve current runtime and reference terminal.

## Scope and placement
Integrate the Hamiltonian Parsing Cube as an optional visualization and notification adapter within the existing Polyglot Quine Sovereign Operating System. Do not create a second OS or assume POLomni is an established command. The proposed browser module is isolated from security enforcement and authoritative ledgers.

## Proposed capabilities
1. Four-dimensional hypercube vertices, single-coordinate edge topology, projection and responsive rendering.
2. Particle-grid motifs for abstract humanoid-face-like patterns. No biometric identification, face recognition, emotion inference, or identity matching.
3. Idle attention alerts with an explicit dismiss affordance. This is not an OS lock screen and must not intercept underlying browser activity outside the app.
4. Assistive text through semantic DOM and polite live regions. ChromeVox is controlled by the user/platform; the app must not commandeer or disable it.
5. Optional SpeechSynthesis only after explicit user opt-in; cancel on dismissal/unmount and honor reduced-motion preferences.
6. Cryptic Communications adapter boundary: emit a typed, non-sensitive alert event to authorized application services. BLE is a future opt-in capability requiring supported hardware/API, pairing/permissions, explicit recipient selection, privacy review, and a separate native/mobile bridge where Web Bluetooth cannot satisfy the transport. No covert beaconing or broadcast by default.
7. Evidence integration: canonical payload schema, SHA-256 digest, parent linkage, authenticated signatures and independently sourced measurements where needed. A digest is not an identity proof, signature, trusted timestamp, authorization, or truth certificate.
8. Recovery/assurance: no automatic production writes, no protected merge bypass, no untrusted dynamic code evaluation.

## Phased implementation
- **P0 — Inventory:** reconcile existing visualization, screen-saver, audio, alert, comms, telemetry, and receipt modules; establish owners and avoid duplicate components.
- **P1 — Safe visualization:** land optional overlay, geometry tests, keyboard-accessible dismiss, reduced-motion, teardown, resize/DPR behavior.
- **P2 — Accessibility:** semantic status output, test with ChromeVox/NVDA/VoiceOver where available, explicit TTS opt-in and quiet mode.
- **P3 — Alert transport:** typed internal event schema, authorization, rate limiting, deduplication, expiry, recipient policy, offline queue, delivery receipt. BLE only after device/OS/API capability review and pairing consent.
- **P4 — Evidence:** canonical encoding, Web Crypto SHA-256 for browser-side content digest, server/native signature for authenticated provenance, protected append-only receipt store and replay tests.
- **P5 — Assurance:** unit tests, browser smoke tests, accessibility review, CSP/security checks, lifecycle leak checks, network permission review, regression and rollback rehearsal.
- **P6 — Release:** staged rollout behind feature flag, telemetry minimization, opt-in disclosure, documented disable/uninstall path, owner approval and release evidence.

## Required invariants and acceptance gates
- Overlay remains non-authoritative and cannot claim to lock the device.
- Underlying application controls remain available; dismiss always works.
- No audio unless enabled by the user; honor assistive technology preferences.
- No camera/microphone/face-data access for particle-face artwork.
- No BLE transmissions without a separate explicit consent and authorized peer flow.
- Every alert has a unique event ID, expiry, severity, destination scope and deduplication key.
- A delivery ACK is emitted only by the actual receiver or verified transport layer; UI display is not delivery proof.
- SHA-256 digests use canonical byte encoding and are verified by a separate implementation; signatures/authorization are distinct.
- Numerical/render tests distinguish simulated time, wall time, frame production, presentation and physical measurements.
- Test fails closed on invalid payloads, missing authorization, stale receipts, and invalid schema.
- Rollback returns to pre-integration behavior without modifying the protected reference terminal.

## Naming and repository reconciliation
- S.O.S. is the authoritative system.
- `polynomial.py` is a proposed math package entry point, subject to inventory.
- `POLomni` remains uncommitted naming because of possible namespace conflict.
- Integrate this work as TDOC, not as a substitute OS.
- Earlier PR #8 on `Gaia-The-Nexus-Generation` is not this S.O.S. integration and must not be merged as a shortcut.

## Branch and release discipline
This proposal is prepared on `tdoc/hamiltonian-cube-cryptic-alert-foundation`. Require source inventory, test results, independent review, and explicit readiness gate before merging into `main`. Keep production untouched until those gates pass.
