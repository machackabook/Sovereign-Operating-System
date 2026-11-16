# AI Studio model artifacts and dynamic inference scaling

## 1. Separate application source from model weights

Google AI Studio Build produces an application project. Its exportable ZIP is application source and runtime configuration, not the proprietary weights of hosted Gemini models. Gemini API credentials are injected server-side in AI Studio; an exported deployment must configure its own server-side `GEMINI_API_KEY`.

Antigravity is the development/build agent that edits and validates the application. It is not itself a model-weight package. Keep these artifacts distinct:

1. **Application bundle:** React/Vite UI, Node server, model router, Cryptic adapters, tests, manifests, and deployment instructions.
2. **Model artifact bundle:** separately versioned open-weight files, artifact manifest, license, quantization, format, digest, and hardware profile.
3. **Runtime configuration:** provider endpoints, model IDs, limits, policy, and secret references. Never put API keys or refresh tokens in the bundle.

Do not commit multi-gigabyte weight files to Git. Store them in a private artifact bucket or managed model registry. The manifest contains a digest and retrieval reference; the runtime verifies the digest before loading the weights.

## 2. Provider topology

### Hosted inference
- Provider: Gemini API.
- The application sends requests to a server-side adapter.
- The Gemini API key remains in the server secret store.
- No Gemini model weights are copied into the application bundle.
- Private/restricted inputs are denied by the default routing policy in this repository unless a separately reviewed policy explicitly authorizes a suitable managed endpoint.

### Local open-weight inference
- Provider: local model runtime.
- Model artifact: Gemma or another explicitly approved open-weight model.
- Desktop runtime can use a compatible local serving engine and hardware backend.
- Mobile runtime requires a model format and runtime supported by the device. Do not assume a phone can host a large model.
- The model artifact manifest must include SHA-256, format, quantization, license identifier, byte size, and verification status.

Suggested format families:
- GGUF for llama.cpp-compatible local runtimes.
- Safetensors for compatible Python/Hugging Face serving stacks.
- LiteRT/TFLite formats for supported edge/mobile deployments.

These formats are not interchangeable. Use a compatible runtime or an explicit, validated conversion pipeline.

## 3. Runtime planes

### Control plane
AI Studio application, Hamiltonian state and scheduler, Cryptic capability gateway, provider registry, policy, and verified ledger.

### Inference plane
Independent Gemini API endpoint, GAIASWINDOW local model runtime, and optional Penguin/edge workers. Each endpoint reports actual health, model revision, available memory, concurrency, queue depth, time-to-first-token, and measured tokens/second.

### Artifact plane
Private object storage or model registry. Signed/versioned manifests point to immutable artifacts. The runtime downloads to a staging location, checks digest and license metadata, performs a load/self-test, then marks the endpoint eligible.

Keep hash/proof-of-work compute workers separate from LLM inference workers. The model may plan or classify tasks; it does not replace the protocol's hash function or independent proof verifier.

## 4. Dynamic scaling

Do not scale from CPU percentage alone. The scheduler should consider:
- Queue depth and queue wait.
- Time-to-first-token and end-to-end latency.
- Measured tokens/second for the exact model revision and hardware backend.
- Available memory and model residency.
- Available concurrency and active requests.
- Warm/cold state and model load time.
- Failure domain and endpoint health.
- Data classification and remote-processing permission.

Low-latency techniques:
1. Keep a small, approved model warm for short control-plane tasks.
2. Preload model artifacts after digest verification.
3. Stream responses rather than waiting for full completion.
4. Use bounded batching where it improves throughput without violating latency objectives.
5. Reuse prompt/KV cache only within an explicitly scoped user/session boundary.
6. Scale replicas only when measured queue/latency thresholds justify it.
7. Apply backpressure and return HOLD when no compatible endpoint has capacity.

“Instant compute” is an optimization target, not a guarantee. Report measured time-to-first-token, tokens/second, queue wait, and cold-start time.

## 5. Admission and integrity

The repository's `selectModelEndpoint` function is a pure policy selector. It admits only endpoints with fresh metrics, healthy state, verified manifests, compatible capability/context, sufficient memory/concurrency, and a policy-compatible provider.

For local models, the weight artifact must have a valid SHA-256 digest, non-empty license identifier, supported format, positive size, and verified status. Hosted Gemini API endpoints do not claim to contain locally available weights.

This policy does not download artifacts, authenticate endpoints, execute inference, or provision replicas. Those actions belong to authenticated provider adapters and an orchestrator that records receipts.

## 6. Packaging

Antigravity should produce a reproducible application bundle and a separate model-artifact manifest. The build output should include:
- Application commit and build ID.
- Dependency lockfile and build provenance.
- Provider adapter versions.
- Model manifest revision.
- Model artifact digest references (not secret tokens).
- Runtime compatibility and minimum hardware requirements.
- Test and benchmark evidence.

Do not bake provider secrets into the ZIP, container image, browser bundle, or Git repository. Provision secrets through the target runtime's secret manager.

## 7. Rollout gates

1. Confirm AI Studio and GitHub are synchronized to the intended commit.
2. Build and test the app bundle in Antigravity on GAIASWINDOW.
3. Register one local model endpoint and one hosted Gemini endpoint.
4. Run public-data routing tests and private-data local-only tests.
5. Verify model artifact digest before and after loading.
6. Record cold-start, warm-start, time-to-first-token, tokens/second, queue wait, memory, and concurrency.
7. Test endpoint loss and recovery without losing in-flight operation identity.
8. Promote only after independent tests and a signed receipt.

Status: design and routing policy; physical endpoints and model artifacts are not enrolled by this document.
