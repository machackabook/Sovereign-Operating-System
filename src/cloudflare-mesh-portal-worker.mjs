const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer"
  }
});

const MESH_HOST = "cryptic-sos-mesh.saytyarnornglorei.workers.dev";

function meshEndpoint(env, path) {
  const configured = String(env.CRYPTIC_MESH_URL || "").trim();
  if (!configured) throw new Error("mesh_endpoint_not_configured");
  const base = new URL(configured);
  if (base.protocol !== "https:" || base.hostname !== MESH_HOST || base.username || base.password) {
    throw new Error("mesh_endpoint_invalid");
  }
  return new URL(path, base);
}

async function upstream(request, env, path, init = {}) {
  const response = await fetch(meshEndpoint(env, path), {
    ...init,
    redirect: "error",
    signal: AbortSignal.timeout(8000)
  });
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/cryptic-mesh/health" && request.method === "GET") {
      const accessAssertion = request.headers.get("Cf-Access-Jwt-Assertion");
      if (!accessAssertion || accessAssertion.length > 12000) {
        return json({ ok: false, access_assertion_verified: false, error: "cloudflare_access_assertion_required" }, 401);
      }
      try {
        const verified = await upstream(request, env, "/v1/mesh/auth/verify-portal", {
          method: "POST",
          headers: { "content-type": "application/json", "accept": "application/json" },
          body: JSON.stringify({ portal_id_token: accessAssertion })
        });
        if (!verified.ok) return json({ ok: false, access_assertion_verified: false, error: "access_assertion_rejected" }, verified.status);
        const assertion = await verified.json();
        const health = await upstream(request, env, "/health", { method: "GET" });
        if (!health.ok) return json({ ok: false, access_assertion_verified: true, gateway: await health.json() }, health.status);
        return json({
          ok: true,
          access_assertion_verified: assertion.authenticated === true,
          identity_provider: assertion.provider,
          subject_fingerprint: assertion.subject_fingerprint,
          assertion_expires_at: assertion.expires_at,
          gateway: await health.json()
        });
      } catch {
        return json({ ok: false, access_assertion_verified: false, error: "gateway_unavailable" }, 502);
      }
    }

    if (path !== "/api/cryptic-mesh/exchange") {
      return json({ error: "not_found" }, 404);
    }
    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405);
    }

    // Cloudflare Access protects crypticnews.org/api. The assertion is injected
    // by Access and verified cryptographically by Cryptic's gateway Worker.
    const accessAssertion = request.headers.get("Cf-Access-Jwt-Assertion");
    if (!accessAssertion || accessAssertion.length > 12000) {
      return json({ error: "cloudflare_access_assertion_required" }, 401);
    }

    const origin = request.headers.get("Origin");
    if (origin) {
      try {
        if (new URL(origin).origin !== url.origin) return json({ error: "origin_not_allowed" }, 403);
      } catch {
        return json({ error: "origin_invalid" }, 400);
      }
    }

    if (request.headers.get("Content-Type")?.split(";")[0].trim() !== "application/json") {
      return json({ error: "invalid_content_type" }, 415);
    }

    let raw;
    let data;
    try {
      raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > 12000) {
        return json({ error: "payload_too_large" }, 413);
      }
      data = JSON.parse(raw || "{}");
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    if (typeof data.firebase_id_token !== "string" ||
        data.firebase_id_token.length < 100 ||
        data.firebase_id_token.length > 10000) {
      return json({ error: "firebase_id_token_required" }, 400);
    }

    const body = JSON.stringify({
      firebase_id_token: data.firebase_id_token,
      portal_id_token: accessAssertion
    });

    try {
      return await upstream(request, env, "/v1/mesh/auth/exchange", {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json" },
        body
      });
    } catch {
      return json({ error: "cryptic_gateway_unavailable" }, 502);
    }
  }
};
