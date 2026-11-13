# S.O.S → Cryptic Mesh Client

S.O.S consumes the Cryptic mesh; it does not create a parallel gateway or hold Cryptic's signing keys.

## Configure

Set the public gateway URL in the S.O.S runtime configuration (this is an endpoint, not a secret):

`VITE_CRYPTIC_MESH_URL=https://YOUR-CRYPTIC-MESH-WORKER.workers.dev`

The identity adapters must use real OIDC sign-in flows:
- The existing S.O.S Firebase Auth Google provider returns a Firebase ID token through `auth.currentUser.getIdToken(true)`. The client service reads the current Firebase user, rejects anonymous/non-Google/unverified-email sessions, and passes the Firebase ID token to Cryptic. Cryptic verifies the Firebase project issuer/audience and `firebase.sign_in_provider === google.com`.
- The portal adapter supplies the signed Cloudflare Access application JWT from a trusted server-side portal integration. The edge verifies the configured Access issuer, audience, RS256 signature, expiry, subject and signed email claim.
- Cryptic verifies both signatures, issuer, audience, expiry, and verified email equality.

Do not store either token or the returned Cryptic bridge token in localStorage, sessionStorage, URL parameters, logs, analytics, or model prompts. The bridge token remains in the service closure's memory.

## Use

```ts
import { createCrypticMeshService } from "./services/crypticMeshService";

const crypticMesh = createCrypticMeshService({
  baseUrl: import.meta.env.VITE_CRYPTIC_MESH_URL,
  getPortalIdToken: () => portalIdentityAdapter.getIdToken(),
});

await crypticMesh.connect();
const accepted = await crypticMesh.dispatch("nexus.health", {});
// accepted.status === "queued" means accepted by Cryptic, not yet completed by NEXUS.
const jobs = await crypticMesh.jobs();
```

The Firebase Google identity is wired directly to the existing S.O.S Firebase Auth session. `portalIdentityAdapter` remains the one required portal-side adapter and must obtain the signed Cloudflare Access application JWT from a trusted server-side integration; do not read or trust an arbitrary browser cookie or user-supplied email.

## Authority and flow

- Cryptic owns gateway authentication, token rotation, revocation, D1 audit, replay protection and queueing.
- S.O.S owns the AI Studio interface and model orchestration.
- NEXUS runs the private outbound-only agent and executes only server-approved allowlisted actions.
- Results return through Cryptic and are read by S.O.S using the authenticated jobs endpoint.

The S.O.S client does not call NEXUS directly and cannot execute shell commands.
