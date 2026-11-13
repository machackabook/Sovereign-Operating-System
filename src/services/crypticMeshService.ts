import { auth } from "./firebase";

export interface CrypticMeshOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}
export interface CrypticMeshReceipt {
  job_id: string;
  status: "queued";
  correlation_id: string;
}
type TokenResponse = { access_token: string; expires_in: number; scope: string[] };
type JobResponse = { jobs: Array<{ id: string; status: string; created_at: number; completed_at: number | null; result: unknown }> };

function jwtExpiry(token: string): number {
  try {
    const part = token.split(".")[1];
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized + "=".repeat((4 - normalized.length % 4) % 4)));
    return Number(payload.exp || 0);
  } catch {
    return 0;
  }
}

/**
 * Cryptic remains the identity/policy/edge authority.
 * Bridge credentials stay in closure memory; no browser persistence is used.
 */
export function createCrypticMeshService(options: CrypticMeshOptions) {
  if (!/^https:\/\//.test(options.baseUrl)) throw new Error("Cryptic Mesh requires an HTTPS base URL");
  const fetcher = options.fetchImpl ?? fetch;
  const getFirebaseIdToken = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) throw new Error("Sign in with the S.O.S Google account before connecting Cryptic");
    if (!user.providerData.some(provider => provider.providerId === "google.com")) throw new Error("Cryptic Mesh requires the Firebase Google sign-in provider");
    if (!user.emailVerified) throw new Error("Verify the Google account email before connecting Cryptic");
    return user.getIdToken(true);
  };
  const base = options.baseUrl.replace(/\/+$/, "");
  let accessToken: string | null = null;
  let expiresAt = 0;

  async function exchange(): Promise<void> {
    const firebase_id_token = await getFirebaseIdToken();
    const response = await fetcher("/api/cryptic-mesh/exchange", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ firebase_id_token }),
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) throw new Error(`Cryptic Mesh authentication failed (HTTP ${response.status})`);
    const data = (await response.json()) as TokenResponse;
    if (!data.access_token) throw new Error("Cryptic Mesh returned no access token");
    accessToken = data.access_token;
    expiresAt = jwtExpiry(accessToken);
    if (!expiresAt) throw new Error("Cryptic Mesh returned an invalid token");
  }

  async function ensureToken(): Promise<void> {
    if (!accessToken) await exchange();
    if (expiresAt - Math.floor(Date.now() / 1000) < 90) {
      const response = await fetcher(base + "/v1/mesh/auth/rotate", {
        method: "POST",
        credentials: "omit",
        headers: { authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        redirect: "error",
      });
      if (!response.ok) {
        accessToken = null;
        expiresAt = 0;
        await exchange();
        return;
      }
      const data = (await response.json()) as TokenResponse;
      accessToken = data.access_token;
      expiresAt = jwtExpiry(accessToken);
    }
  }

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    await ensureToken();
    const response = await fetcher(base + path, {
      ...init,
      credentials: "omit",
      headers: { ...(init.headers ?? {}), authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) throw new Error(`Cryptic Mesh request failed (HTTP ${response.status})`);
    return (await response.json()) as T;
  }

  return Object.freeze({
    health: async () => {
      const response = await fetcher("/api/cryptic-mesh/health", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Cryptic Access health check failed (HTTP ${response.status})`);
      const result = await response.json() as {
        ok?: boolean;
        access_assertion_verified?: boolean;
        gateway?: { ok?: boolean };
      };
      if (result.access_assertion_verified !== true || result.gateway?.ok !== true) {
        throw new Error("Cloudflare Access assertion or Cryptic gateway health verification failed.");
      }
      return result;
    },
    connect: async () => {
      await ensureToken();
      return { connected: true, expiresAt };
    },
    dispatch: (action: string, args: Record<string, unknown> = {}, correlation_id?: string) => {
      if (!/^[a-z][a-z0-9_.-]{0,63}$/.test(action)) throw new Error("Invalid mesh action");
      return request<CrypticMeshReceipt>("/v1/mesh/dispatch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, arguments: args, correlation_id }),
      });
    },
    jobs: () => request<JobResponse>("/v1/mesh/jobs"),
    status: () => request<Record<string, unknown>>("/v1/mesh/portal/status"),
    revoke: async () => {
      if (!accessToken) return { revoked: false };
      const token = accessToken;
      accessToken = null;
      expiresAt = 0;
      const response = await fetcher(base + "/v1/mesh/auth/revoke", {
        method: "POST",
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        headers: { authorization: `Bearer ${token}` },
      });
      if (!response.ok) return { revoked: false };
      return (await response.json()) as { revoked: boolean };
    },
  });
}

/** Shared in-memory bridge client used by the terminal and identity gate. */
const configuredMeshUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_CRYPTIC_MESH_URL) ||
  "https://cryptic-sos-mesh.saytyarnornglorei.workers.dev";

export const crypticMeshService = createCrypticMeshService({
  baseUrl: configuredMeshUrl,
});

declare global {
  interface Window {
    CrypticMesh?: {
      dispatchFrame: (frame: Record<string, unknown>) => Promise<unknown>;
    };
  }
}

/**
 * Adapter for CrypticBus. It accepts only the worker's explicit action allowlist;
 * arbitrary terminal commands and shell-like payloads are rejected at this boundary.
 */
export function installCrypticMeshBusAdapter(): void {
  if (typeof window === "undefined") return;
  if (window.CrypticMesh && typeof window.CrypticMesh.dispatchFrame === "function") return;

  const allowedActions = new Set(["nexus.health", "nexus.echo", "sos.mesh.status"]);
  window.CrypticMesh = {
    dispatchFrame: async (frame: Record<string, unknown>) => {
      const action = typeof frame.action === "string"
        ? frame.action
        : typeof frame.kind === "string"
          ? frame.kind
          : "";
      if (!allowedActions.has(action)) {
        throw new Error("mesh_action_not_allowlisted");
      }
      const args = (frame.arguments ?? frame.payload ?? {}) as Record<string, unknown>;
      return crypticMeshService.dispatch(action, args);
    },
  };
}

if (typeof window !== "undefined") installCrypticMeshBusAdapter();
