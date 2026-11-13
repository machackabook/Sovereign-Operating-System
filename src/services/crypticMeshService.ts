export interface CrypticMeshOptions {
  baseUrl: string;
  getGoogleIdToken: () => Promise<string>;
  getPortalIdToken: () => Promise<string>;
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
  const base = options.baseUrl.replace(/\/+$/, "");
  let accessToken: string | null = null;
  let expiresAt = 0;

  async function exchange(): Promise<void> {
    const [google_id_token, portal_id_token] = await Promise.all([
      options.getGoogleIdToken(),
      options.getPortalIdToken(),
    ]);
    const response = await fetcher(base + "/v1/mesh/auth/exchange", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ google_id_token, portal_id_token }),
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
      headers: { ...(init.headers ?? {}), authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) throw new Error(`Cryptic Mesh request failed (HTTP ${response.status})`);
    return (await response.json()) as T;
  }

  return Object.freeze({
    connect: async () => {
      await exchange();
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
      const result = await request<{ revoked: boolean }>("/v1/mesh/auth/revoke", { method: "POST" });
      accessToken = null;
      expiresAt = 0;
      return result;
    },
  });
}
