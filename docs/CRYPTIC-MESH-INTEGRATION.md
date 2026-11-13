# S.O.S → Cryptic Mesh Client

S.O.S consumes the Cryptic mesh; it does not create a parallel gateway or hold Cryptic's signing keys.

## Configure

Set the public gateway URL in the S.O.S runtime configuration (this is an endpoint, not a secret):

`VITE_CRYPTIC_MESH_URL=https://cryptic-sos-mesh.saytyarnornglorei.workers.dev`

The S.O.S Firebase identity and Cryptic Access portal identity must be real authenticated sessions:
- The existing S.O.S Firebase Auth Google provider returns a Firebase ID token through `auth.currentUser.getIdToken(true)`. The client service reads the current Firebase user, rejects anonymous/non-Google/unverified-email sessions, and passes the Firebase ID token to Cryptic. Cryptic verifies the Firebase project issuer/audience and `firebase.sign_in_provider === google.com`.
- The S.O.S Express server reads the Cloudflare Access `Cf-Access-Jwt-Assertion` header server-side and forwards it to Cryptic. The edge verifies the configured Access issuer, audience, RS256 signature, expiry, subject and signed email claim. The S.O.S server must be behind the Cryptic Cloudflare Access application; the route fails closed without the header.
- Cryptic verifies both signatures, issuer, audience, expiry, and verified email equality.

Do not store either token or the returned Cryptic bridge token in localStorage, sessionStorage, URL parameters, logs, analytics, or model prompts. The bridge token remains in the service closure's memory.

## Use

```ts
import { createCrypticMeshService } from "./services/crypticMeshService";

const crypticMesh = createCrypticMeshService({
  baseUrl: import.meta.env.VITE_CRYPTIC_MESH_URL,
});

await crypticMesh.connect();
const accepted = await crypticMesh.dispatch("nexus.health", {});
// accepted.status === "queued" means accepted by Cryptic, not yet completed by NEXUS.
const jobs = await crypticMesh.jobs();
```

The Firebase Google identity is wired directly to the existing S.O.S Firebase Auth session. The S.O.S server-side exchange proxy forwards the signed Cloudflare Access assertion; do not read or trust an arbitrary browser cookie or user-supplied email. Set `CRYPTIC_MESH_URL` on the S.O.S server to the deployed workers.dev endpoint.

## Authority and flow

- Cryptic owns gateway authentication, token rotation, revocation, D1 audit, replay protection and queueing.
- S.O.S owns the AI Studio interface and model orchestration.
- NEXUS runs the private outbound-only agent and executes only server-approved allowlisted actions.
- Results return through Cryptic and are read by S.O.S using the authenticated jobs endpoint.

The S.O.S client does not call NEXUS directly and cannot execute shell commands.
