# CRYPTIC v2.3 — S.O.S integration snapshot

- Source repository: https://github.com/Azazeleous/CRYPTIC
- Source pull request: https://github.com/Azazeleous/CRYPTIC/pull/21
- Source branch: feat/v2-3-supervised-https-request
- Source head: a7a23495665d80b623e18b0e8ebb2ba9c7355f5d
- Snapshot date: 2026-11-20
- State at capture: PR #21 open; Codex audit pending; not merged into CRYPTIC main.
- Scope: v2.3 supervised whole-request HTTP transport, deadline enforcement, bounded request/response handling, runtime transport lifecycle, regression tests, ADR/capability/roadmap updates.
- Security boundary: read-only ingestion only. No signing, wallet actions, transaction submission, token issuance, or financial participation.
- Verification caveat: this is a source patch snapshot, not a claim that the patch has been applied, built, or tested in S.O.S. Re-run CI and review after applying.
- Windows multiprocessing spawn behavior and live-provider verification remain unverified.

The patch below is the exact PR diff captured from GitHub at the source head above. Preserve the source PR as the audit authority; do not treat this snapshot as Codex approval.

===== docs/CAPABILITY_LEDGER.md =====
@@ -9,9 +9,9 @@
 | Raw observation journal | implemented (E3) | PR #13; CI run 44791258725 passed unit tests and bounded benchmark; canonical JSONL, SHA-256 chain, fsync, OS file locking, tamper detection; no privileged/WORM claim |
 | Chain normalization and discrepancy reports | implemented (E3) | PR #14; CI run 44791838680 passed normalization, identity, discrepancy, and bounded benchmark tests; no consensus-validity claim |
 | Deterministic journal replay and data-quality reporting | implemented (E3) | PR #15; CI run 44792211628 passed replay, tamper, regression, duplicate, discrepancy, and bounded benchmark tests; no network calls during replay |
-| Bounded ingestion coordinator | partial (E3) | PR #16–#19; PR #17 CI runs 44820117950 and 44820138234 passed; PR #18 CI runs 44820874496 and 44820893547 passed 169 tests and bounded benchmark; PR #19 CI run 44821362812 passed 173 tests and bounded benchmark. Fixed worker/submission-window bounds, page/observation budgets, deadline accounting, shared-deadline JSON-RPC call API, and EVM/Solana deadline propagation are covered. Regression tests verify rate-gate wait bounds, retry-backoff budget checks, socket timeout selection, and reuse of one deadline across multi-call observations. EVM/Solana adapters deliberately remain ineligible (`deadline_enforced = False`) because standard-library DNS resolution is not isolated; runtime continues rejecting them. Journal fsync/audit/replay remain outside hard deadline. |
-| EVM JSON-RPC transport + chain identity | implemented (E3) | PR #12 and #14; CI protocol/adapter tests passed; identity uses chain ID plus genesis hash; live provider verification remains unclaimed |
-| Solana JSON-RPC transport + cluster identity | implemented (E3) | PR #12 and #14; CI protocol/adapter tests passed; identity uses genesis hash; live provider verification and subscriptions remain open |
+| Bounded ingestion coordinator | implemented (E3) | PRs #16–#21; PR #21 CI run 44826635200 passed unit tests and bounded benchmark on head 3fbe9fd1b122b9e8e5b17bc383ddcfe47613a8a5. Fixed worker/submission-window bounds, page/observation budgets, deadline accounting, shared-deadline JSON-RPC propagation, and isolated DNS foundation are retained. v2.3 adds a prestarted spawn-based whole-request HTTP worker, parent-side absolute-deadline event wait, fixed-capacity shared-memory response, worker termination/poisoning, redirect denial, and bounded request/response reads. Runtime prepares selected adapters before collection begins and closes transports on orderly shutdown. Tests cover normal response, redirect denial, response cap, slow-trickle termination, JSON-RPC integration, and preparation-before-deadline. Journal fsync/audit/replay remain outside the source-collection deadline; Windows spawn CI and live provider verification remain unclaimed. |
+| EVM JSON-RPC transport + chain identity | implemented (E3) | PR #12, #14, and #21; whole-request process boundary passed PR #21 CI run 44826635200. Identity uses chain ID plus genesis hash; live provider verification remains unclaimed. |
+| Solana JSON-RPC transport + cluster identity | implemented (E3) | PR #12, #14, and #21; whole-request process boundary passed PR #21 CI run 44826635200. Identity uses genesis hash; live provider verification and subscriptions remain open. |
 | Complete asset coverage | unverified | provider-by-provider coverage and limits |
 | Canonical chain identity | implemented (E3) | PR #14; EVM chain ID + genesis hash and Solana genesis hash; cross-source comparisons require matching network identity |
 | Canonical asset identity | proposed | collision and alias test suite |

===== docs/ROADMAP.md =====
@@ -18,7 +18,7 @@
 - Tamper-evident raw observation journal — implemented and CI-verified in PR #13; canonical JSONL, hash chain, append locking, fsync, and full-chain audit are available. It is not privileged-proof/WORM storage.
 - Canonical EVM/Solana chain-head normalization and cross-source discrepancy reports — implemented and CI-verified in PR #14; comparisons are bounded by identity anchors and observation skew. Asset normalization remains open.
 - Deterministic journal replay and data-quality reporting — implemented and CI-verified in PR #15; replay is offline, read-only, reproducible, and fails closed on journal integrity errors.
-- Bounded ingestion coordinator — partial v2.0 foundation, v2.0.1 accounting corrections, v2.1 shared-deadline JSON-RPC groundwork, and v2.1.1 regression coverage are CI-verified in PRs #16–#19. Fixed worker/submission-window bounds, page/observation budgets, timeout classification, deterministic single-writer journal append, elapsed-time reporting, and replay integration are covered. Regression tests verify rate-gate wait bounds, retry-backoff budget checks, socket timeout selection, and one shared deadline across EVM/Solana multi-call observations. Those adapters deliberately remain ineligible for runtime execution (`deadline_enforced = False`) until DNS resolution is isolated; journal fsync/audit/replay remain outside the hard deadline.
+- Bounded ingestion coordinator — PRs #16–#19 established bounded workers, submission windows, budgets, timeout accounting, deterministic single-writer journal append, replay integration, and shared-deadline propagation. PR #20 added a standalone supervised DNS resolver. v2.3 replaces the remaining in-process HTTP path for deadline-aware JSON-RPC calls with a prestarted, spawn-based whole-request worker covering DNS, TCP, TLS, headers, and body reads. Parent-side IPC waits use the absolute monotonic deadline; timeout terminates and permanently poisons the worker. Redirects are denied, response reads are capped, and standard TLS hostname/certificate validation is retained. Worker preparation occurs before `collection_started`; PR #21 CI run 44826635200 passed unit tests and bounded benchmark. Journal fsync/audit/replay remain outside the source-collection deadline. Windows spawn CI and live provider verification remain open.
 
 ## Phase 3 — Core model
 - Provider-independent model interface.

===== docs/adr/ADR-0021-supervised-http-transport.md =====
@@ -0,0 +1,40 @@
+# ADR-0021: Supervised whole-request HTTP transport
+
+- Status: proposed for review
+- Date: 2026-11-20
+- Scope: read-only JSON-RPC transport deadlines
+
+## Context
+
+The v2.1 deadline propagation bounded rate-gate waits, retry backoff, and socket timeout selection. PR #20 added an isolated DNS resolver foundation, but the existing JSON-RPC client still performed the complete urllib request in the coordinator process. A blocking resolver or a response body that trickles bytes can outlive a socket-operation timeout. Therefore those earlier controls did not prove a hard deadline for the complete request.
+
+## Decision
+
+Use one supervised, spawn-based HTTP worker per JSON-RPC client.
+
+- The worker is started and handshaken by adapter preparation before the runtime starts its collection deadline.
+- The complete request runs in the worker: name resolution, TCP connection, TLS negotiation, HTTP exchange, headers, and response-body read.
+- The original HTTPS URL hostname is retained. The standard-library HTTPS handler performs normal certificate-chain and hostname verification and supplies the hostname for SNI.
+- Redirects are not followed. A redirect status is returned to the parent and treated as a non-retryable HTTP status.
+- The worker reads at most max_response_bytes + 1; the parent parser rejects a response exceeding the configured cap.
+- The parent waits on a multiprocessing event only for the remaining absolute monotonic deadline. The bounded response body is written into a fixed-capacity shared-memory segment; the event signals that its header and bytes are complete. The parent never performs a blocking pipe receive for the response payload.
+- If the event wait expires, the parent terminates (then kills if necessary) the worker and permanently poisons that worker instance.
+- A poisoned worker is not restarted during the active collection. The owning session fails closed; a later session requires a newly prepared adapter/client.
+- The worker is serialized per client. The runtime's existing fixed worker count and bounded submission window continue to bound concurrent source operations.
+
+## Error and data handling
+
+Worker exceptions are not serialized to the parent. The private pipe carries only bounded request messages and shutdown; response metadata and payload are placed in shared memory, with completion signaled by an event. The worker receives the URL and request body over its private pipe, not as process command-line arguments. Request bodies are capped at 65,536 bytes. The implementation does not emit request bodies, endpoint values, or raw exception text to logs or metrics. Endpoint validation continues to reject embedded user information, query strings, and fragments.
+
+## Scope and limitations
+
+- The absolute deadline applies to source collection calls. Worker startup is bounded by a separate startup timeout and occurs before collection_started.
+- Journal append/fsync, audit, replay, and final report construction remain outside the source-collection deadline, as already disclosed by the runtime.
+- Process termination is the enforcement boundary for blocked resolver, connect, TLS, header, and body operations. OS scheduling and process teardown can add bounded cleanup latency; the API does not claim nanosecond-exact wall-clock termination.
+- The implementation relies on the platform's multiprocessing spawn support and standard-library TLS stack. Linux and Windows CI coverage is required before claiming cross-platform verification.
+- This is transport deadline enforcement, not provider authenticity, chain consensus, or live endpoint verification.
+- The DNS-only resolver from PR #20 remains available as a standalone component but is not required inside the supervised HTTP worker.
+
+## Consequences
+
+EVM and Solana adapters may advertise deadline_enforced = True only because their coordinator-facing *_until methods now route every JSON-RPC call through this worker and runtime preparation starts the worker before collection begins. Direct non-deadline calls also receive a finite policy timeout and use the same supervised path.

===== src/ingestion/json_rpc.py =====
@@ -7,14 +7,20 @@
 
 from dataclasses import dataclass
 import itertools
+import math
 import json
 import re
 import time
 from typing import Any, Mapping
 from threading import Lock
 from urllib.error import HTTPError, URLError
 from urllib.parse import urlsplit
-from urllib.request import HTTPRedirectHandler, Request, build_opener
+
+from .supervised_http import (
+    SupervisedHttpTransport,
+    SupervisedTransportDeadlineExceeded,
+    SupervisedTransportError,
+)
 
 from .source_registry import (
     HealthReport,
@@ -95,11 +101,6 @@ def wait(self, *, deadline_monotonic: float | None = None) -> None:
             self._lock.release()
 
 
-class _NoRedirect(HTTPRedirectHandler):
-    def redirect_request(self, request, response, code, message, headers, new_url):
-        return None
-
-
 class JsonRpcClient:
     """HTTP JSON-RPC 2.0 client restricted to a caller-supplied method set."""
 
@@ -125,6 +126,8 @@ def __init__(
             parsed.scheme == "http" and hostname in {"localhost", "127.0.0.1", "::1"}
         ):
             raise SourceRegistryError("JSON-RPC requires HTTPS or loopback HTTP")
+        if len(endpoint) > 2_048:
+            raise SourceRegistryError("JSON-RPC endpoint exceeds maximum length")
         if not hostname or parsed.username is not None or parsed.password is not None:
             raise SourceRegistryError("JSON-RPC endpoint host is invalid or embeds credentials")
         if parsed.query or parsed.fragment:
@@ -137,6 +140,19 @@ def __init__(
         self.endpoint = endpoint
         self.allowed_methods = allowed_methods
         self._rate_gate = _RateGate(self.policy.rate_limit_per_minute)
+        self._supervised_transport: SupervisedHttpTransport | None = None
+
+    def prepare(self) -> None:
+        """Start the whole-request worker before the collection deadline."""
+        if self._supervised_transport is None:
+            self._supervised_transport = SupervisedHttpTransport()
+        if not self._supervised_transport.healthy:
+            raise SupervisedTransportError("worker_unavailable")
+
+    def close(self) -> None:
+        if self._supervised_transport is not None:
+            self._supervised_transport.close()
+            self._supervised_transport = None
 
     @staticmethod
     def parse_response(payload: bytes, expected_id: int, max_bytes: int) -> Any:
@@ -166,18 +182,29 @@ def parse_response(payload: bytes, expected_id: int, max_bytes: int) -> Any:
         return document["result"]
 
     def call(self, method: str, params: list[Any] | None = None) -> Any:
-        return self._call(method, params, deadline_monotonic=None)
+        # Even non-coordinator calls use a finite whole-request deadline.
+        return self._call(
+            method, params,
+            deadline_monotonic=time.monotonic() + self.policy.timeout_seconds,
+        )
 
     def call_until(self, method: str, params: list[Any] | None = None, *,
                    deadline_monotonic: float) -> Any:
-        if isinstance(deadline_monotonic, bool) or not isinstance(deadline_monotonic, (int, float)):
+        """Execute against a prepared worker and caller-owned absolute deadline."""
+        if (isinstance(deadline_monotonic, bool)
+                or not isinstance(deadline_monotonic, (int, float))
+                or not math.isfinite(deadline_monotonic)):
             raise JsonRpcError("rpc_deadline_invalid")
         if deadline_monotonic <= time.monotonic():
             raise JsonRpcDeadlineExceeded("rpc_deadline_exceeded")
+        if self._supervised_transport is None:
+            raise JsonRpcError("rpc_transport_not_prepared")
         return self._call(method, params, deadline_monotonic=float(deadline_monotonic))
 
     def _call(self, method: str, params: list[Any] | None, *,
               deadline_monotonic: float | None) -> Any:
+        if deadline_monotonic is None:
+            raise JsonRpcError("rpc_deadline_required")
         if not isinstance(method, str) or method not in self.allowed_methods:
             raise JsonRpcError("rpc_method_not_allowlisted")
         if params is None:
@@ -189,12 +216,9 @@ def _call(self, method: str, params: list[Any] | None, *,
             {"jsonrpc": "2.0", "id": request_id, "method": method, "params": params},
             separators=(",", ":"),
         ).encode("utf-8")
-        request = Request(
-            self.endpoint,
-            data=body,
-            headers={"Content-Type": "application/json", "Accept": "application/json"},
-            method="POST",
-        )
+        if len(body) > 65_536:
+            raise JsonRpcError("request_size_invalid")
+        self.prepare()  # One worker lifecycle per client; never restart per retry.
         for attempt in range(self.policy.max_retries + 1):
             self._rate_gate.wait(deadline_monotonic=deadline_monotonic)
             timeout = self.policy.timeout_seconds
@@ -204,12 +228,19 @@ def _call(self, method: str, params: list[Any] | None, *,
                     raise JsonRpcDeadlineExceeded("rpc_deadline_exceeded")
                 timeout = min(timeout, remaining)
             try:
-                opener = build_opener(_NoRedirect())
-                with opener.open(request, timeout=timeout) as response:
-                    payload = response.read(self.policy.max_response_bytes + 1)
+                assert self._supervised_transport is not None
+                status, payload = self._supervised_transport.request(
+                    self.endpoint, body, timeout_seconds=timeout,
+                    max_response_bytes=self.policy.max_response_bytes,
+                    deadline_monotonic=deadline_monotonic,
+                )
+                if status != 200:
+                    raise HTTPError(self.endpoint, status, "http_status", None, None)
                 if deadline_monotonic is not None and time.monotonic() >= deadline_monotonic:
                     raise JsonRpcDeadlineExceeded("rpc_deadline_exceeded")
                 return self.parse_response(payload, request_id, self.policy.max_response_bytes)
+            except SupervisedTransportDeadlineExceeded:
+                raise JsonRpcDeadlineExceeded("rpc_deadline_exceeded") from None
             except HTTPError as exc:
                 retryable = exc.code == 429 or 500 <= exc.code <= 599
                 if not retryable or attempt >= self.policy.max_retries:
@@ -237,9 +268,8 @@ def _call(self, method: str, params: list[Any] | None, *,
 class EvmReadOnlyAdapter:
     """EVM chain identity and finalized-head observation; no write methods."""
 
-    # urllib's resolver can block outside the socket timeout. Do not advertise
-    # this adapter as runtime-deadline-enforced until resolver isolation exists.
-    deadline_enforced = False
+    # All deadline-aware calls use the supervised whole-request process.
+    deadline_enforced = True
 
     def __init__(
         self,
@@ -261,6 +291,12 @@ def __init__(
         self.descriptor.validate()
         self.client = JsonRpcClient(endpoint, allowed_methods=_EVM_METHODS, policy=policy)
 
+    def prepare(self) -> None:
+        self.client.prepare()
+
+    def close(self) -> None:
+        self.client.close()
+
     @staticmethod
     def _hex_quantity(value: Any, field: str) -> int:
         if not isinstance(value, str) or not value.startswith("0x") or len(value) < 3:
@@ -389,9 +425,8 @@ def fetch_page(self, *, limit: int, cursor: str | None = None, filters: Mapping[
 class SolanaReadOnlyAdapter:
     """Solana genesis identity and finalized head observation; no write methods."""
 
-    # urllib's resolver can block outside the socket timeout; remain ineligible
-    # for the coordinator until that boundary is isolated.
-    deadline_enforced = False
+    # All deadline-aware calls use the supervised whole-request process.
+    deadline_enforced = True
 
     def __init__(
         self,
@@ -413,6 +448,12 @@ def __init__(
         self.descriptor.validate()
         self.client = JsonRpcClient(endpoint, allowed_methods=_SOLANA_METHODS, policy=policy)
 
+    def prepare(self) -> None:
+        self.client.prepare()
+
+    def close(self) -> None:
+        self.client.close()
+
     def observe(self) -> dict[str, Any]:
         options = [{"commitment": "finalized"}]
         genesis_hash = self.client.call("getGenesisHash")

===== src/ingestion/runtime.py =====
@@ -164,9 +164,9 @@ def _worker(adapter: DeadlineAwareAdapter, *, page_quota: int, observation_quota
 class BoundedIngestionRuntime:
     """Bounded worker coordinator; only its caller thread writes the journal.
 
-    Python cannot forcibly terminate a blocked thread. This runtime requires
-    cooperative adapters whose transports bound rate waits, retries, DNS,
-    connect, and reads against the passed absolute monotonic deadline.
+    Python cannot forcibly terminate a blocked thread. Network adapters must
+    prepare a supervised transport before collection and enforce the shared
+    deadline at a process boundary for every blocking network operation.
     """
     def __init__(self, registry: SourceRegistry, policy: IngestionPolicy | None = None) -> None:
         if not isinstance(registry, SourceRegistry):
@@ -184,6 +184,14 @@ def close(self, *, wait_for_workers: bool = True) -> None:
         if not self._closed:
             self._closed = True
             self._executor.shutdown(wait=wait_for_workers, cancel_futures=True)
+            # Adapter transports own supervised child processes and shared memory.
+            # Close them on both waiting and non-waiting shutdown; pending work is
+            # cancelled above and a non-waiting close intentionally aborts in-flight IO.
+            for descriptor in self.registry.list_sources():
+                adapter = self.registry.get_adapter(descriptor.source_id)
+                close = getattr(adapter, "close", None)
+                if callable(close):
+                    close()
 
     def __enter__(self) -> "BoundedIngestionRuntime":
         if self._closed:
@@ -211,6 +219,9 @@ def _resolve(self, source_ids: Sequence[str]) -> list[DeadlineAwareAdapter]:
                 getattr(adapter, "fetch_page_until", None)
             ):
                 raise IngestionRuntimeError(f"source {source_id} lacks deadline-aware adapter methods")
+            prepare = getattr(adapter, "prepare", None)
+            if callable(prepare):
+                prepare()  # Worker startup is bounded and precedes collection_started.
             adapters.append(adapter)
         return adapters
 

===== src/ingestion/supervised_http.py =====
@@ -0,0 +1,258 @@
+"""Supervised whole-request HTTP transport for absolute-deadline callers.
+
+A prestarted spawn worker performs DNS, TCP, TLS, HTTP, and body reads.
+The parent waits on a multiprocessing event, never on a potentially partial
+large-payload pipe receive. Bounded response bytes travel through shared memory.
+"""
+from __future__ import annotations
+
+import http.client
+import math
+import multiprocessing
+import struct
+import threading
+import time
+from multiprocessing.connection import Connection
+from multiprocessing.shared_memory import SharedMemory
+from typing import Any
+from urllib.error import HTTPError, URLError
+from urllib.request import HTTPRedirectHandler, Request, build_opener
+
+_HEADER = struct.Struct("!QII")  # request id, HTTP status (0 = transport error), payload length
+_MAX_RESPONSE_BYTES = 8_388_608
+_SHARED_CAPACITY = _HEADER.size + _MAX_RESPONSE_BYTES + 1
+_MAX_REQUEST_BYTES = 65_536
+_MAX_URL_CHARS = 2_048
+
+
+class SupervisedTransportError(OSError):
+    """Sanitized worker lifecycle or transport failure."""
+
+
+class SupervisedTransportDeadlineExceeded(TimeoutError):
+    """The parent deadline elapsed before the whole HTTP request completed."""
+
+
+class _NoRedirect(HTTPRedirectHandler):
+    def redirect_request(self, request, response, code, message, headers, new_url):
+        return None
+
+
+def _http_worker(connection: Connection, shared_name: str, completed) -> None:
+    """Spawn-safe worker entry point. Never returns exception text or secrets."""
+    shared = None
+    try:
+        shared = SharedMemory(name=shared_name)
+        connection.send(("ready",))
+        while True:
+            message = connection.recv()
+            if message is None:
+                return
+            request_id, url, body, timeout_seconds, max_response_bytes = message
+            status_code = 0
+            payload = b""
+            try:
+                request = Request(
+                    url, data=body,
+                    headers={"Content-Type": "application/json", "Accept": "application/json"},
+                    method="POST",
+                )
+                opener = build_opener(_NoRedirect())
+                try:
+                    with opener.open(request, timeout=timeout_seconds) as response:
+                        payload = response.read(max_response_bytes + 1)
+                        status_code = int(response.status)
+                except HTTPError as exc:
+                    status_code = int(exc.code)
+                    payload = b""
+                if len(payload) > max_response_bytes + 1:
+                    status_code, payload = 0, b""
+            except (http.client.HTTPException, URLError, TimeoutError, OSError, ValueError):
+                status_code, payload = 0, b""
+
+            if len(payload) > _MAX_RESPONSE_BYTES + 1:
+                status_code, payload = 0, b""
+            shared.buf[_HEADER.size:_HEADER.size + len(payload)] = payload
+            _HEADER.pack_into(shared.buf, 0, request_id, status_code, len(payload))
+            completed.set()
+    except (EOFError, OSError):
+        return
+    finally:
+        if shared is not None:
+            shared.close()
+        connection.close()
+
+
+class SupervisedHttpTransport:
+    """One prestarted, serialized HTTP worker; timeout is fail-closed."""
+
+    def __init__(self, *, startup_timeout_seconds: float = 5.0) -> None:
+        if (isinstance(startup_timeout_seconds, bool)
+                or not isinstance(startup_timeout_seconds, (int, float))
+                or not math.isfinite(startup_timeout_seconds)
+                or not 0.1 <= startup_timeout_seconds <= 30):
+            raise SupervisedTransportError("worker_startup_timeout_invalid")
+        self._ctx = multiprocessing.get_context("spawn")
+        self._shared = SharedMemory(create=True, size=_SHARED_CAPACITY)
+        parent, child = self._ctx.Pipe(duplex=True)
+        self._connection = parent
+        self._completed = self._ctx.Event()
+        self._process = self._ctx.Process(
+            target=_http_worker, args=(child, self._shared.name, self._completed),
+            name="cryptic-http-transport", daemon=True,
+        )
+        self._lock = threading.Lock()
+        self._closed = False
+        self._poisoned = False
+        self._started = False
+        self._shared_closed = False
+        self._next_id = 1
+        try:
+            self._process.start()
+            self._started = True
+            child.close()
+            if not parent.poll(float(startup_timeout_seconds)):
+                self._poisoned = True
+                self._terminate()
+                raise SupervisedTransportError("worker_startup_timeout")
+            ready = parent.recv()
+            if ready != ("ready",) or not self._process.is_alive():
+                self._poisoned = True
+                self._terminate()
+                raise SupervisedTransportError("worker_startup_failed")
+        except Exception:
+            self._poisoned = True
+            try:
+                child.close()
+            except OSError:
+                pass
+            self._terminate()
+            raise
+
+    @property
+    def healthy(self) -> bool:
+        return not self._closed and not self._poisoned and self._process.is_alive()
+
+    def _close_shared(self) -> None:
+        if self._shared_closed:
+            return
+        self._shared_closed = True
+        try:
+            self._shared.close()
+        finally:
+            try:
+                self._shared.unlink()
+            except FileNotFoundError:
+                pass
+
+    def _terminate(self) -> None:
+        try:
+            if self._started:
+                if self._process.is_alive():
+                    self._process.terminate()
+                self._process.join(timeout=0.25)
+                if self._process.is_alive():
+                    self._process.kill()
+                    self._process.join(timeout=0.25)
+        finally:
+            try:
+                self._connection.close()
+            except OSError:
+                pass
+            self._close_shared()
+
+    def request(
+        self, url: str, body: bytes, *, timeout_seconds: float,
+        max_response_bytes: int, deadline_monotonic: float,
+    ) -> tuple[int, bytes]:
+        if not isinstance(url, str) or not url or not isinstance(body, bytes):
+            raise SupervisedTransportError("request_invalid")
+        if len(url) > _MAX_URL_CHARS:
+            raise SupervisedTransportError("url_size_invalid")
+        if len(body) > _MAX_REQUEST_BYTES:
+            raise SupervisedTransportError("request_size_invalid")
+        if (isinstance(timeout_seconds, bool)
+                or not isinstance(timeout_seconds, (int, float))
+                or not math.isfinite(timeout_seconds) or timeout_seconds <= 0):
+            raise SupervisedTransportError("timeout_invalid")
+        if (isinstance(max_response_bytes, bool) or not isinstance(max_response_bytes, int)
+                or not 1 <= max_response_bytes <= _MAX_RESPONSE_BYTES):
+            raise SupervisedTransportError("response_limit_invalid")
+        if (isinstance(deadline_monotonic, bool)
+                or not isinstance(deadline_monotonic, (int, float))
+                or not math.isfinite(deadline_monotonic)):
+            raise SupervisedTransportError("deadline_invalid")
+
+        remaining = float(deadline_monotonic) - time.monotonic()
+        if remaining <= 0:
+            raise SupervisedTransportDeadlineExceeded("http_deadline_exceeded")
+        if not self._lock.acquire(timeout=remaining):
+            # This caller has not dispatched work; do not abort the owner of the lock.
+            raise SupervisedTransportDeadlineExceeded("http_deadline_exceeded")
+        try:
+            if not self.healthy:
+                raise SupervisedTransportError("worker_unavailable")
+            remaining = float(deadline_monotonic) - time.monotonic()
+            if remaining <= 0:
+                self._poisoned = True
+                self._terminate()
+                raise SupervisedTransportDeadlineExceeded("http_deadline_exceeded")
+
+            request_id = self._next_id
+            self._next_id += 1
+            self._completed.clear()
+            bounded_timeout = min(float(timeout_seconds), remaining)
+            try:
+                self._connection.send((
+                    request_id, url, body, bounded_timeout, max_response_bytes,
+                ))
+            except (EOFError, OSError):
+                self._poisoned = True
+                self._terminate()
+                raise SupervisedTransportError("worker_unavailable") from None
+
+            remaining = float(deadline_monotonic) - time.monotonic()
+            if remaining <= 0 or not self._completed.wait(remaining):
+                self._poisoned = True
+                self._terminate()
+                raise SupervisedTransportDeadlineExceeded("http_deadline_exceeded")
+
+            response_id, status_code, payload_length = _HEADER.unpack_from(self._shared.buf, 0)
+            if response_id != request_id or payload_length > max_response_bytes + 1:
+                self._poisoned = True
+                self._terminate()
+                raise SupervisedTransportError("worker_protocol_mismatch")
+            if time.monotonic() >= float(deadline_monotonic):
+                self._poisoned = True
+                self._terminate()
+                raise SupervisedTransportDeadlineExceeded("http_deadline_exceeded")
+            if status_code == 0:
+                raise SupervisedTransportError("transport_unavailable")
+            payload = bytes(self._shared.buf[_HEADER.size:_HEADER.size + payload_length])
+            if time.monotonic() >= float(deadline_monotonic):
+                self._poisoned = True
+                self._terminate()
+                raise SupervisedTransportDeadlineExceeded("http_deadline_exceeded")
+            return int(status_code), payload
+        finally:
+            self._lock.release()
+
+    def close(self) -> None:
+        if self._closed:
+            return
+        self._closed = True
+        if self._started and self._process.is_alive() and not self._poisoned:
+            try:
+                self._connection.send(None)
+            except (EOFError, OSError):
+                pass
+            self._process.join(timeout=0.25)
+        self._terminate()
+
+    def __enter__(self) -> "SupervisedHttpTransport":
+        if not self.healthy:
+            raise SupervisedTransportError("worker_unavailable")
+        return self
+
+    def __exit__(self, exc_type: Any, exc, traceback) -> None:
+        self.close()

===== tests/test_ingestion_runtime.py =====
@@ -71,6 +71,49 @@ def setUp(self):
     def tearDown(self):
         self.temp.cleanup()
 
+    def test_adapter_preparation_precedes_collection_deadline(self):
+        class PreparedAdapter(DeadlineAdapter):
+            def __init__(self, source_id):
+                super().__init__(source_id)
+                self.prepared_at = None
+                self.prepared_before_collection = False
+
+            def prepare(self):
+                self.prepared_at = time.monotonic()
+
+            def health_check_until(self, *, deadline_monotonic):
+                collection_started = deadline_monotonic - 5.0
+                self.prepared_before_collection = self.prepared_at is not None and self.prepared_at < collection_started
+                if not self.prepared_before_collection:
+                    raise RuntimeError("adapter_not_prepared_before_collection")
+                return HealthReport(self.descriptor.source_id, True, 1, 1)
+
+        adapter = PreparedAdapter("prepared")
+        self.registry.register(adapter)
+        policy = IngestionPolicy(max_workers=1, max_queue_size=0, max_pages=1,
+                                 max_observations=1, max_page_size=1,
+                                 max_duration_seconds=5.0)
+        with BoundedIngestionRuntime(self.registry, policy) as runtime:
+            report = runtime.run(self.journal, ["prepared"])
+        self.assertEqual(report["status"], "complete")
+        self.assertTrue(adapter.prepared_before_collection)
+
+    def test_non_waiting_shutdown_closes_adapter_transport(self):
+        class ClosableAdapter(DeadlineAdapter):
+            def __init__(self, source_id):
+                super().__init__(source_id)
+                self.closed = False
+
+            def close(self):
+                self.closed = True
+
+        adapter = ClosableAdapter("closable")
+        self.registry.register(adapter)
+        runtime = BoundedIngestionRuntime(self.registry)
+        runtime.run(self.journal, ["closable"])
+        runtime.close(wait_for_workers=False)
+        self.assertTrue(adapter.closed)
+
     def test_legacy_adapter_is_rejected(self):
         self.registry.register(LegacyAdapter("legacy"))
         with BoundedIngestionRuntime(self.registry) as runtime:

===== tests/test_json_rpc.py =====
@@ -71,11 +71,40 @@ def test_expired_shared_deadline_is_rejected_before_transport(self):
         with self.assertRaises(JsonRpcDeadlineExceeded):
             client.call_until("eth_chainId", deadline_monotonic=__import__("time").monotonic() - 1)
 
+    def test_request_payload_size_is_bounded_before_worker_dispatch(self):
+        client = JsonRpcClient(
+            "https://rpc.example.org",
+            allowed_methods=frozenset({"eth_getBlockByNumber"}),
+        )
+        client._supervised_transport = type("ReadyTransport", (), {"healthy": True})()
+        with self.assertRaisesRegex(JsonRpcError, "request_size_invalid"):
+            client.call_until(
+                "eth_getBlockByNumber", ["x" * 65_537],
+                deadline_monotonic=time.monotonic() + 2,
+            )
+
+    def test_json_rpc_rejects_oversized_endpoint(self):
+        with self.assertRaisesRegex(SourceRegistryError, "maximum length"):
+            JsonRpcClient(
+                "https://rpc.example.org/" + ("x" * 2048),
+                allowed_methods=frozenset({"eth_chainId"}),
+            )
+
+    def test_absolute_deadline_call_requires_prior_worker_preparation(self):
+        client = JsonRpcClient(
+            "https://rpc.example.org",
+            allowed_methods=frozenset({"eth_chainId"}),
+        )
+        with self.assertRaisesRegex(JsonRpcError, "not_prepared"):
+            client.call_until(
+                "eth_chainId", deadline_monotonic=time.monotonic() + 1,
+            )
+
     def test_chain_adapters_expose_deadline_methods_without_overclaiming_dns_bound(self):
         evm = EvmReadOnlyAdapter("https://rpc.example.org")
         solana = SolanaReadOnlyAdapter("https://rpc.example.org")
         for adapter in (evm, solana):
-            self.assertFalse(adapter.deadline_enforced)
+            self.assertTrue(adapter.deadline_enforced)
             self.assertTrue(callable(adapter.health_check_until))
             self.assertTrue(callable(adapter.fetch_page_until))
             with self.assertRaises(JsonRpcDeadlineExceeded):
@@ -93,54 +122,129 @@ def test_rate_gate_wait_is_bounded_by_shared_deadline(self):
         self.assertLess(time.monotonic() - started, 0.15)
 
     def test_retry_backoff_is_rejected_when_it_exceeds_remaining_budget(self):
+        class RetryTransport:
+            healthy = True
+            def request(self, *args, **kwargs):
+                return 503, b""
+
         client = JsonRpcClient(
             "https://rpc.example.org",
             allowed_methods=frozenset({"eth_chainId"}),
             policy=JsonRpcPolicy(timeout_seconds=2, max_retries=2,
                                  retry_base_seconds=1, rate_limit_per_minute=600),
         )
-        opener = type("FailingOpener", (), {
-            "open": lambda self, request, timeout: (_ for _ in ()).throw(
-                HTTPError(request.full_url, 503, "unavailable", {}, None)
-            )
-        })()
-        with patch("src.ingestion.json_rpc.build_opener", return_value=opener):
-            with self.assertRaises(JsonRpcDeadlineExceeded):
-                client.call_until("eth_chainId", deadline_monotonic=time.monotonic() + 0.1)
-
-    def test_socket_timeout_uses_remaining_shared_budget(self):
-        class Response:
-            def __init__(self, payload):
-                self.payload = payload
-            def __enter__(self):
-                return self
-            def __exit__(self, *args):
-                return False
-            def read(self, size):
-                return self.payload
-
-        class Opener:
+        client._supervised_transport = RetryTransport()
+        with self.assertRaises(JsonRpcDeadlineExceeded):
+            client.call_until("eth_chainId", deadline_monotonic=time.monotonic() + 0.1)
+
+    def test_supervised_transport_receives_remaining_shared_budget(self):
+        class RecordingTransport:
+            healthy = True
             timeout_seen = None
-            def open(self, request, timeout):
-                self.timeout_seen = timeout
-                request_doc = json.loads(request.data.decode("utf-8"))
+            def request(self, url, body, *, timeout_seconds, max_response_bytes,
+                        deadline_monotonic):
+                self.timeout_seen = timeout_seconds
+                request_doc = json.loads(body.decode("utf-8"))
                 payload = json.dumps({
                     "jsonrpc": "2.0", "id": request_doc["id"], "result": "0x1"
                 }).encode("utf-8")
-                return Response(payload)
+                return 200, payload
 
         client = JsonRpcClient(
             "https://rpc.example.org",
             allowed_methods=frozenset({"eth_chainId"}),
             policy=JsonRpcPolicy(timeout_seconds=5, max_retries=0,
                                  rate_limit_per_minute=600),
         )
-        opener = Opener()
-        with patch("src.ingestion.json_rpc.build_opener", return_value=opener):
-            result = client.call_until("eth_chainId", deadline_monotonic=time.monotonic() + 0.4)
+        transport = RecordingTransport()
+        client._supervised_transport = transport
+        result = client.call_until("eth_chainId", deadline_monotonic=time.monotonic() + 0.4)
         self.assertEqual(result, "0x1")
-        self.assertGreater(opener.timeout_seen, 0)
-        self.assertLessEqual(opener.timeout_seen, 0.4)
+        self.assertGreater(transport.timeout_seen, 0)
+        self.assertLessEqual(transport.timeout_seen, 0.4)
+
+    def test_json_rpc_deadline_call_uses_prepared_supervised_worker(self):
+        from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
+
+        class Handler(BaseHTTPRequestHandler):
+            def do_POST(self):
+                request_doc = json.loads(self.rfile.read(
+                    int(self.headers.get("Content-Length", "0"))
+                ).decode("utf-8"))
+                payload = json.dumps({
+                    "jsonrpc": "2.0", "id": request_doc["id"], "result": "0x1",
+                }).encode("utf-8")
+                self.send_response(200)
+                self.send_header("Content-Length", str(len(payload)))
+                self.end_headers()
+                self.wfile.write(payload)
+            def log_message(self, *args):
+                pass
+
+        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
+        server_thread = __import__("threading").Thread(
+            target=server.serve_forever, daemon=True,
+        )
+        server_thread.start()
+        client = JsonRpcClient(
+            f"http://127.0.0.1:{server.server_port}/rpc",
+            allowed_methods=frozenset({"eth_chainId"}),
+            policy=JsonRpcPolicy(max_retries=0, rate_limit_per_minute=600),
+        )
+        try:
+            client.prepare()
+            self.assertTrue(client._supervised_transport.healthy)
+            result = client.call_until(
+                "eth_chainId", deadline_monotonic=time.monotonic() + 3,
+            )
+            self.assertEqual(result, "0x1")
+        finally:
+            client.close()
+            server.shutdown()
+            server.server_close()
+            server_thread.join(timeout=1)
+
+    def test_json_rpc_maps_slow_body_worker_termination_to_deadline(self):
+        from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
+
+        class Handler(BaseHTTPRequestHandler):
+            def do_POST(self):
+                self.rfile.read(int(self.headers.get("Content-Length", "0")))
+                self.send_response(200)
+                self.send_header("Content-Length", "20")
+                self.end_headers()
+                try:
+                    for _ in range(20):
+                        self.wfile.write(b"x")
+                        self.wfile.flush()
+                        time.sleep(0.15)
+                except (BrokenPipeError, ConnectionResetError):
+                    pass
+            def log_message(self, *args):
+                pass
+
+        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
+        server_thread = __import__("threading").Thread(
+            target=server.serve_forever, daemon=True,
+        )
+        server_thread.start()
+        client = JsonRpcClient(
+            f"http://127.0.0.1:{server.server_port}/rpc",
+            allowed_methods=frozenset({"eth_chainId"}),
+            policy=JsonRpcPolicy(max_retries=0, rate_limit_per_minute=600),
+        )
+        try:
+            client.prepare()
+            with self.assertRaises(JsonRpcDeadlineExceeded):
+                client.call_until(
+                    "eth_chainId", deadline_monotonic=time.monotonic() + 0.4,
+                )
+            self.assertFalse(client._supervised_transport.healthy)
+        finally:
+            client.close()
+            server.shutdown()
+            server.server_close()
+            server_thread.join(timeout=1)
 
     def test_evm_and_solana_multi_call_observations_reuse_one_deadline(self):
         deadline = time.monotonic() + 10

===== tests/test_supervised_http.py =====
@@ -0,0 +1,227 @@
+"""Integration tests for the supervised whole-request HTTP boundary."""
+from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
+import threading
+import time
+import unittest
+
+from src.ingestion.supervised_http import (
+    SupervisedHttpTransport,
+    SupervisedTransportDeadlineExceeded,
+    SupervisedTransportError,
+)
+
+
+class _Server:
+    def __init__(self, handler):
+        self.server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
+        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
+        self.thread.start()
+        self.url = f"http://127.0.0.1:{self.server.server_port}/rpc"
+
+    def close(self):
+        self.server.shutdown()
+        self.server.server_close()
+        self.thread.join(timeout=1)
+
+
+class SupervisedHttpTests(unittest.TestCase):
+    def test_request_completes_in_worker_and_preserves_response(self):
+        class Handler(BaseHTTPRequestHandler):
+            def do_POST(self):
+                self.rfile.read(int(self.headers.get("Content-Length", "0")))
+                payload = b'{"jsonrpc":"2.0","id":1,"result":"ok"}'
+                self.send_response(200)
+                self.send_header("Content-Length", str(len(payload)))
+                self.end_headers()
+                self.wfile.write(payload)
+            def log_message(self, *args):
+                pass
+
+        server = _Server(Handler)
+        try:
+            with SupervisedHttpTransport() as transport:
+                status, payload = transport.request(
+                    server.url, b"{}", timeout_seconds=2, max_response_bytes=1024,
+                    deadline_monotonic=time.monotonic() + 3,
+                )
+                self.assertEqual(status, 200)
+                self.assertEqual(payload, b'{"jsonrpc":"2.0","id":1,"result":"ok"}')
+                self.assertTrue(transport.healthy)
+        finally:
+            server.close()
+
+    def test_redirect_is_not_followed(self):
+        class Handler(BaseHTTPRequestHandler):
+            def do_POST(self):
+                self.send_response(302)
+                self.send_header("Location", "/elsewhere")
+                self.send_header("Content-Length", "0")
+                self.end_headers()
+            def log_message(self, *args):
+                pass
+
+        server = _Server(Handler)
+        try:
+            with SupervisedHttpTransport() as transport:
+                status, payload = transport.request(
+                    server.url, b"{}", timeout_seconds=2, max_response_bytes=1024,
+                    deadline_monotonic=time.monotonic() + 3,
+                )
+                self.assertEqual(status, 302)
+                self.assertEqual(payload, b"")
+        finally:
+            server.close()
+
+    def test_response_read_is_capped(self):
+        class Handler(BaseHTTPRequestHandler):
+            def do_POST(self):
+                self.rfile.read(int(self.headers.get("Content-Length", "0")))
+                payload = b"x" * 100
+                self.send_response(200)
+                self.send_header("Content-Length", str(len(payload)))
+                self.end_headers()
+                self.wfile.write(payload)
+            def log_message(self, *args):
+                pass
+
+        server = _Server(Handler)
+        try:
+            with SupervisedHttpTransport() as transport:
+                _status, payload = transport.request(
+                    server.url, b"{}", timeout_seconds=2, max_response_bytes=8,
+                    deadline_monotonic=time.monotonic() + 3,
+                )
+                self.assertEqual(len(payload), 9)
+        finally:
+            server.close()
+
+    def test_oversized_url_is_rejected_before_ipc(self):
+        transport = SupervisedHttpTransport()
+        try:
+            with self.assertRaisesRegex(SupervisedTransportError, "url_size_invalid"):
+                transport.request(
+                    "http://localhost/" + ("x" * 2048), b"{}",
+                    timeout_seconds=1, max_response_bytes=128,
+                    deadline_monotonic=time.monotonic() + 2,
+                )
+            self.assertTrue(transport.healthy)
+        finally:
+            transport.close()
+
+    def test_waiter_deadline_does_not_abort_active_request(self):
+        entered = threading.Event()
+        release = threading.Event()
+
+        class Handler(BaseHTTPRequestHandler):
+            def do_POST(self):
+                self.rfile.read(int(self.headers.get("Content-Length", "0")))
+                entered.set()
+                release.wait(1.5)
+                payload = b"ok"
+                try:
+                    self.send_response(200)
+                    self.send_header("Content-Length", str(len(payload)))
+                    self.end_headers()
+                    self.wfile.write(payload)
+                except (BrokenPipeError, ConnectionResetError):
+                    pass
+            def log_message(self, *args):
+                pass
+
+        server = _Server(Handler)
+        transport = SupervisedHttpTransport()
+        first_result = []
+        def first_call():
+            first_result.append(transport.request(
+                server.url, b"{}", timeout_seconds=2, max_response_bytes=128,
+                deadline_monotonic=time.monotonic() + 3,
+            ))
+        thread = threading.Thread(target=first_call)
+        try:
+            thread.start()
+            self.assertTrue(entered.wait(1))
+            with self.assertRaises(SupervisedTransportDeadlineExceeded):
+                transport.request(
+                    server.url, b"{}", timeout_seconds=1, max_response_bytes=128,
+                    deadline_monotonic=time.monotonic() + 0.1,
+                )
+            self.assertTrue(transport.healthy)
+            release.set()
+            thread.join(timeout=2)
+            self.assertFalse(thread.is_alive())
+            self.assertEqual(first_result, [(200, b"ok")])
+            self.assertTrue(transport.healthy)
+        finally:
+            release.set()
+            transport.close()
+            server.close()
+
+    def test_truncated_chunked_response_is_reported_without_worker_hang(self):
+        class Handler(BaseHTTPRequestHandler):
+            protocol_version = "HTTP/1.1"
+            def do_POST(self):
+                self.rfile.read(int(self.headers.get("Content-Length", "0")))
+                self.send_response(200)
+                self.send_header("Transfer-Encoding", "chunked")
+                self.end_headers()
+                self.wfile.write(b"5\r\nabc")
+                self.wfile.flush()
+                self.close_connection = True
+            def log_message(self, *args):
+                pass
+
+        server = _Server(Handler)
+        transport = SupervisedHttpTransport()
+        try:
+            with self.assertRaisesRegex(SupervisedTransportError, "transport_unavailable"):
+                transport.request(
+                    server.url, b"{}", timeout_seconds=2, max_response_bytes=128,
+                    deadline_monotonic=time.monotonic() + 2,
+                )
+            self.assertTrue(transport.healthy)
+        finally:
+            transport.close()
+            server.close()
+
+    def test_slow_trickle_body_is_terminated_at_absolute_deadline(self):
+        class Handler(BaseHTTPRequestHandler):
+            def do_POST(self):
+                self.rfile.read(int(self.headers.get("Content-Length", "0")))
+                self.send_response(200)
+                self.send_header("Content-Length", "20")
+                self.end_headers()
+                try:
+                    for _ in range(20):
+                        self.wfile.write(b"x")
+                        self.wfile.flush()
+                        time.sleep(0.15)
+                except (BrokenPipeError, ConnectionResetError):
+                    pass
+            def log_message(self, *args):
+                pass
+
+        server = _Server(Handler)
+        transport = SupervisedHttpTransport()
+        try:
+            deadline = time.monotonic() + 0.45
+            started = time.monotonic()
+            with self.assertRaises(SupervisedTransportDeadlineExceeded):
+                transport.request(
+                    server.url, b"{}", timeout_seconds=2, max_response_bytes=1024,
+                    deadline_monotonic=deadline,
+                )
+            elapsed = time.monotonic() - started
+            self.assertLess(elapsed, 1.2)
+            self.assertFalse(transport.healthy)
+            with self.assertRaises(Exception):
+                transport.request(
+                    server.url, b"{}", timeout_seconds=2, max_response_bytes=1024,
+                    deadline_monotonic=time.monotonic() + 1,
+                )
+        finally:
+            transport.close()
+            server.close()
+
+
+if __name__ == "__main__":
+    unittest.main()