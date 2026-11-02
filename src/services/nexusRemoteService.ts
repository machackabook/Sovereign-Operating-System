/**
 * 🔗 NEXUS REMOTE CONNECTIVITY SERVICE
 * Orchestrates device-independent remote management (ADB, SSH, SFTP, SMB)
 * Bridges the browser WebUSB API and server-side proxy handlers.
 */

export interface RemoteConnection {
  id: string;
  type: 'adb' | 'ssh' | 'smb' | 'sftp';
  label: string;
  host?: string;
  username?: string;
  status: 'connected' | 'disconnected' | 'error';
  lastError?: string;
}

class NexusRemoteService {
  private connections: RemoteConnection[] = [];
  private listeners: ((conns: RemoteConnection[]) => void)[] = [];

  public subscribe(cb: (conns: RemoteConnection[]) => void) {
    this.listeners.push(cb);
    cb([...this.connections]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.connections]));
  }

  public async connectSMB(config: { host: string; share: string; username?: string; password?: string }) {
    const id = `smb-${Date.now()}`;
    try {
      const resp = await fetch('/api/remote/smb/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...config })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'SMB Connection Failed');

      this.connections.push({
        id,
        type: 'smb',
        label: `${config.host}/${config.share}`,
        host: config.host,
        status: 'connected'
      });
      this.notify();
      return id;
    } catch (err: any) {
      console.error('[SMB Connect Error]:', err);
      throw err;
    }
  }

  public async listSMB(id: string, path: string = '') {
    const resp = await fetch('/api/remote/smb/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, path })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to list SMB');
    return data.files;
  }

  public getConnections() {
    return [...this.connections];
  }

  public removeConnection(id: string) {
    this.connections = this.connections.filter(c => c.id !== id);
    this.notify();
  }
}

export const nexusRemoteService = new NexusRemoteService();
