/**
 * Client-Side Service for Unified Multi-Provider Key Vault
 * Communicates with /api/key-status and /api/keys endpoints.
 * Provides safe inspection, key addition, and provider statistics.
 */

export interface VaultKeyItem {
  index: number;
  provider: 'gemini' | 'openai' | 'ibm_quantum';
  id: string; // Masked ID e.g. "sk-proj...5cYA"
  source: string;
  totalCalls: number;
  consecutiveFailures: number;
  isAvailable: boolean;
  cooldownRemainingSec: number;
  lastError: string | null;
  isActive: boolean;
}

export interface ProviderPoolData {
  poolSize: number;
  activeIndex: number;
  activeKeyId: string;
  keys: VaultKeyItem[];
}

export interface KeyVaultStatus {
  totalKeys: number;
  alwaysOnActive: boolean;
  totalRotations: number;
  providers: {
    gemini: ProviderPoolData;
    openai: ProviderPoolData;
    ibm_quantum: ProviderPoolData;
  };
}

class KeyVaultService {
  private cachedStatus: KeyVaultStatus | null = null;
  private listeners: ((status: KeyVaultStatus) => void)[] = [];

  constructor() {
    this.refreshStatus();
    setInterval(() => this.refreshStatus(), 10000);
  }

  public async refreshStatus(): Promise<KeyVaultStatus | null> {
    try {
      const res = await fetch('/api/key-status');
      if (res.ok) {
        const data: KeyVaultStatus = await res.json();
        this.cachedStatus = data;
        this.notify();
        return data;
      }
    } catch (err) {
      console.warn('[KeyVaultService] Failed to fetch key status:', err);
    }
    return this.cachedStatus;
  }

  public getStatus(): KeyVaultStatus | null {
    return this.cachedStatus;
  }

  public onStatusChange(cb: (status: KeyVaultStatus) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    if (this.cachedStatus) {
      const copy = JSON.parse(JSON.stringify(this.cachedStatus));
      this.listeners.forEach((l) => l(copy));
    }
  }

  public async addKey(
    provider: 'gemini' | 'openai' | 'ibm_quantum',
    key: string,
    name?: string
  ): Promise<{ success: boolean; message: string; key?: any }> {
    try {
      const res = await fetch('/api/keys/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key, name }),
      });
      const data = await res.json();
      await this.refreshStatus();
      return data;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to add key' };
    }
  }

  public async callCodex(
    prompt: string,
    model: string = 'gpt-4o-mini'
  ): Promise<{ success: boolean; reply: string; model?: string; keyId?: string; error?: string }> {
    try {
      const res = await fetch('/api/codex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, reply: '', error: data.error || `HTTP ${res.status}` };
      }
      return {
        success: true,
        reply: data.reply,
        model: data.model,
        keyId: data.keyId,
      };
    } catch (err: any) {
      return { success: false, reply: '', error: err.message };
    }
  }
}

export const keyVaultService = new KeyVaultService();
