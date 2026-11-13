import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/cloudflare-mesh-portal-worker.mjs";

const env = {
  CRYPTIC_MESH_URL: "https://cryptic-sos-mesh.saytyarnornglorei.workers.dev"
};

test("exchange requires the Cloudflare Access assertion", async () => {
  const response = await worker.fetch(new Request("https://crypticnews.org/api/cryptic-mesh/exchange", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ firebase_id_token: "x".repeat(200) })
  }), env);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "cloudflare_access_assertion_required");
});

test("exchange forwards both signed identity tokens to Cryptic without logging or persisting them", async () => {
  const originalFetch = globalThis.fetch;
  let calledUrl = "";
  let forwarded;
  globalThis.fetch = async (input, init = {}) => {
    calledUrl = String(input);
    forwarded = JSON.parse(String(init.body));
    return Response.json({ access_token: "opaque-test-token", expires_in: 600, scope: ["mesh:read"] });
  };
  try {
    const response = await worker.fetch(new Request("https://crypticnews.org/api/cryptic-mesh/exchange", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": "https://crypticnews.org",
        "Cf-Access-Jwt-Assertion": "signed-access-assertion"
      },
      body: JSON.stringify({ firebase_id_token: "firebase-id-token-".repeat(20) })
    }), env);
    assert.equal(response.status, 200);
    assert.equal(calledUrl, "https://cryptic-sos-mesh.saytyarnornglorei.workers.dev/v1/mesh/auth/exchange");
    assert.equal(forwarded.portal_id_token, "signed-access-assertion");
    assert.equal(forwarded.firebase_id_token, "firebase-id-token-".repeat(20));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("exchange rejects cross-origin requests", async () => {
  const response = await worker.fetch(new Request("https://crypticnews.org/api/cryptic-mesh/exchange", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "origin": "https://attacker.invalid",
      "Cf-Access-Jwt-Assertion": "signed-access-assertion"
    },
    body: JSON.stringify({ firebase_id_token: "x".repeat(200) })
  }), env);
  assert.equal(response.status, 403);
});

test("health reports the real upstream gateway response", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.equal(String(input), "https://cryptic-sos-mesh.saytyarnornglorei.workers.dev/health");
    return Response.json({ ok: true, service: "CRYPTIC-SOS-MESH" });
  };
  try {
    const response = await worker.fetch(new Request("https://crypticnews.org/api/cryptic-mesh/health"), env);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).service, "CRYPTIC-SOS-MESH");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
