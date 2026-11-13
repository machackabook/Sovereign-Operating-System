# S.O.S → Cryptic Mesh Client

S.O.S consumes the Cryptic mesh; it does not create a parallel gateway or hold Cryptic's signing keys.

## Configure

The production S.O.S UI is served on `https://crypticnews.org`. Its same-origin exchange path is protected by the existing Cloudflare Access application **GAIA private terminal API** (`crypticnews.org/api`). The Access application remains the authentication boundary; do not create a second sign-in flow.

A dedicated portal Worker handles only `crypticnews.org/api/cryptic-mesh/*`:

- `src/cloudflare-mesh-portal-worker.mjs` is the source.
- `wrangler.mesh-portal.jsonc` deploys the isolated Worker `cryptic-sos-portal`.
- The route is `crypticnews.org/api/cryptic-mesh/*`; it does not replace the existing public Worker or `/api/forge*` route.
- Cloudflare Access authenticates the browser request and injects `Cf-Access-Jwt-Assertion`.
- The portal Worker forwards that signed assertion and the Firebase ID token to Cryptic. It never reads an Access cookie or accepts a user-supplied email.
- Cryptic validates the Access JWT signature, issuer, audience, expiry, subject and signed email, and independently validates the Firebase Google ID token.
- The server-side Express route in `server.ts` is a fail-closed development/Node fallback. Production traffic uses the dedicated Cloudflare portal Worker.

The public gateway endpoint is an ordinary non-secret configuration value:

`VITE_CRYPTIC_MESH_URL=https://cryptic-sos-mesh.saytyarnornglorei.workers.dev`

The portal Worker uses:

`CRYPTIC_MESH_URL=https://cryptic-sos-mesh.saytyarnornglorei.workers.dev`

No bridge signing secret is placed in the S.O.S application, browser, or public Worker.

## Use

The S.O.S terminal exposes the integration without exposing tokens:

```text
cryptic health
cryptic connect
cryptic status
cryptic dispatch nexus.health
cryptic jobs
cryptic revoke
```

`cryptic connect` uses the existing Firebase Google session and same-origin Cloudflare Access session. The browser stores the short-lived bridge token only in the service closure's memory. The access assertion is never exposed to JavaScript.

## Verification

Run the real checks from the repository root:

```bash
npm install --no-audit --no-fund
npm run test:mesh
npm run test:audio
npm run lint
npm run build
```

The portal Worker tests verify missing-assertion rejection, same-origin enforcement, forwarding of both signed tokens, and upstream health proxying. They do not substitute for a live Access-authenticated browser exchange. That final test must use a real signed-in session and a real Firebase Google ID token.

Do not store either identity token or the returned Cryptic bridge token in localStorage, sessionStorage, URL parameters, logs, analytics, or model prompts.

## Authority and flow

- Cryptic owns gateway authentication, token rotation, revocation, D1 audit, replay protection and queueing.
- S.O.S owns the AI Studio interface and model orchestration.
- NEXUS runs the private outbound-only agent and executes only server-approved allowlisted actions.
- Results return through Cryptic and are read by S.O.S using the authenticated jobs endpoint.

The S.O.S client does not call NEXUS directly and cannot execute shell commands.
