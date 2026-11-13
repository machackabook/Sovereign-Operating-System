# S.O.S → Cryptic Mesh Client

S.O.S consumes the Cryptic mesh; it does not create a parallel gateway or hold Cryptic's signing keys.

## Configure

Set the public gateway URL in the S.O.S runtime configuration (this is an endpoint, not a secret):

`VITE_CRYPTIC_MESH_URL=https://YOUR-CRYPTIC-MESH-WORKER.workers.dev`

The identity adapters must use real OIDC sign-in flows:
- Google Identity Services returns a Google ID token whose audience is the configured OAuth client ID.
- The existing S.O.S/portal authentication adapter returns a portal OIDC ID token with a verified email claim.
- Cryptic verifies both signatures, issuer, audience, expiry, and verified email equality.

Do not store either token or the returned Cryptic bridge token in localStorage, sessionStorage, URL parameters, logs, analytics, or model prompts. The bridge token remains in the service closure's memory.

## Use

```ts
import { createCrypticMeshService } from "./services/crypticMeshService";

const crypticMesh = createCrypticMeshService({
  baseUrl: import.meta.env.VITE_CRYPTIC_MESH_URL,
  getGoogleIdToken: () => googleIdentityAdapter.getIdToken(),
  getPortalIdToken: () => portalIdentityAdapter.getIdToken(),
});

await crypticMesh.connect();
const accepted = await crypticMesh.dispatch("nexus.health", {});
// accepted.status === "queued" means accepted by Cryptic, not yet completed by NEXUS.
const jobs = await crypticMesh.jobs();
```

The `googleIdentityAdapter` and `portalIdentityAdapter` names above are placeholders for the actual authenticated adapters in this application; they must be implemented from the real providers and must not return mock tokens.

## Authority and flow

- Cryptic owns gateway authentication, token rotation, revocation, D1 audit, replay protection and queueing.
- S.O.S owns the AI Studio interface and model orchestration.
- NEXUS runs the private outbound-only agent and executes only server-approved allowlisted actions.
- Results return through Cryptic and are read by S.O.S using the authenticated jobs endpoint.

The S.O.S client does not call NEXUS directly and cannot execute shell commands.
