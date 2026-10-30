/**
 * Google Drive Workspace Integration Service
 * Authenticates with Firebase Auth (GoogleAuthProvider) to obtain Google Workspace OAuth access tokens.
 * Scopes: drive.readonly, drive.file
 * Provides live reading, syncing, and updating of gemini.md memory engrams
 * directly from the operator's Google Drive (machackabook@gmail.com).
 * In-memory token caching adheres strictly to security requirements (never stored in localStorage/sessionStorage).
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { vfs } from './vfsService';

// Re-use existing Firebase App instance if present
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export const WORKSPACE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
];

const driveProvider = new GoogleAuthProvider();
WORKSPACE_DRIVE_SCOPES.forEach((scope) => driveProvider.addScope(scope));
driveProvider.setCustomParameters({
  prompt: 'select_account',
  login_hint: 'machackabook@gmail.com',
});

export interface GoogleDriveFileMeta {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

export interface DriveSyncStatus {
  isAuthenticated: boolean;
  userEmail: string | null;
  displayName: string | null;
  photoURL: string | null;
  geminiFileMeta: GoogleDriveFileMeta | null;
  lastSyncedAt: string | null;
  syncState: 'idle' | 'syncing' | 'synced' | 'error';
  syncProgressPct: number;
  syncPhase: string;
  targetAccount: string;
  errorMessage: string | null;
}

// In-memory token caching ONLY
let cachedAccessToken: string | null = null;
let isSigningIn = false;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class GoogleDriveService {
  private status: DriveSyncStatus = {
    isAuthenticated: false,
    userEmail: null,
    displayName: null,
    photoURL: null,
    geminiFileMeta: null,
    lastSyncedAt: null,
    syncState: 'idle',
    syncProgressPct: 0,
    syncPhase: 'Trove Ready',
    targetAccount: 'machackabook@gmail.com',
    errorMessage: null,
  };

  private listeners: ((status: DriveSyncStatus) => void)[] = [];
  private engramListeners: ((content: string) => void)[] = [];

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        this.status.isAuthenticated = true;
        this.status.userEmail = user.email;
        this.status.displayName = user.displayName;
        this.status.photoURL = user.photoURL;

        if (!cachedAccessToken && !isSigningIn) {
          // Token needs refresh through popup or user action
          this.status.syncState = 'idle';
          this.status.syncPhase = 'Session active (click Sync to refresh token)';
        }
      } else {
        cachedAccessToken = null;
        this.status.isAuthenticated = false;
        this.status.userEmail = null;
        this.status.displayName = null;
        this.status.photoURL = null;
        this.status.geminiFileMeta = null;
        this.status.syncState = 'idle';
        this.status.syncProgressPct = 0;
        this.status.syncPhase = 'Disconnected';
      }
      this.notify();
    });
  }

  public getStatus(): DriveSyncStatus {
    return { ...this.status };
  }

  public onStatusChange(cb: (status: DriveSyncStatus) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public onEngramUpdated(cb: (content: string) => void): () => void {
    this.engramListeners.push(cb);
    return () => {
      this.engramListeners = this.engramListeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const copy = this.getStatus();
    this.listeners.forEach((l) => l(copy));
  }

  private notifyEngram(content: string) {
    this.engramListeners.forEach((l) => l(content));
  }

  public getCachedAccessToken(): string | null {
    return cachedAccessToken;
  }

  /**
   * Interactive Sign In with Google popup requesting Drive scopes
   */
  public async signInWithGoogle(): Promise<{ user: User; accessToken: string }> {
    try {
      isSigningIn = true;
      this.status.syncState = 'syncing';
      this.status.syncProgressPct = 20;
      this.status.syncPhase = 'Authorizing OAuth for machackabook@gmail.com...';
      this.notify();

      const result = await signInWithPopup(auth, driveProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('No OAuth access token returned from Google Workspace credential.');
      }

      cachedAccessToken = credential.accessToken;
      this.status.isAuthenticated = true;
      this.status.userEmail = result.user.email;
      this.status.displayName = result.user.displayName;
      this.status.photoURL = result.user.photoURL;
      this.status.syncProgressPct = 60;
      this.status.syncPhase = 'Scanning machackabook@gmail.com trove for gemini.md...';
      this.notify();

      // Automatically search for existing gemini.md in Drive
      await this.findGeminiMdFile();

      this.status.syncState = 'idle';
      this.status.syncProgressPct = 100;
      this.status.syncPhase = 'Connected & Linked to machackabook@gmail.com';
      this.status.errorMessage = null;
      this.notify();

      return { user: result.user, accessToken: cachedAccessToken };
    } catch (err: any) {
      this.status.errorMessage = err.message || 'Google Sign-in failed';
      this.status.syncState = 'error';
      this.status.syncProgressPct = 0;
      this.status.syncPhase = `Connection error: ${err.message}`;
      this.notify();
      throw err;
    } finally {
      isSigningIn = false;
    }
  }

  public async signOut(): Promise<void> {
    await signOut(auth);
    cachedAccessToken = null;
    this.status.isAuthenticated = false;
    this.status.userEmail = null;
    this.status.displayName = null;
    this.status.photoURL = null;
    this.status.geminiFileMeta = null;
    this.status.syncState = 'idle';
    this.status.syncProgressPct = 0;
    this.status.syncPhase = 'Disconnected';
    this.status.errorMessage = null;
    this.notify();
  }

  /**
   * Search Google Drive for files
   */
  public async searchFiles(q: string = ''): Promise<GoogleDriveFileMeta[]> {
    if (!cachedAccessToken) {
      throw new Error('User not authenticated with Google Drive. Please sign in with Google first.');
    }

    let url = `https://www.googleapis.com/drive/v3/files?pageSize=30&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)&orderBy=modifiedTime desc`;
    if (q.trim()) {
      url += `&q=${encodeURIComponent(q)}`;
    } else {
      url += `&q=${encodeURIComponent("trashed = false and mimeType != 'application/vnd.google-apps.folder'")}`;
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        cachedAccessToken = null;
        this.status.isAuthenticated = false;
        this.status.syncState = 'error';
        this.status.syncPhase = 'OAuth token expired. Please re-authenticate.';
        this.notify();
        throw new Error('Google Workspace session expired. Please sign in again.');
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Google Drive API error (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  }

  /**
   * Look specifically for gemini.md in Drive
   */
  public async findGeminiMdFile(): Promise<GoogleDriveFileMeta | null> {
    if (!cachedAccessToken) return null;

    try {
      const q = "name = 'gemini.md' and trashed = false";
      const files = await this.searchFiles(q);
      if (files.length > 0) {
        this.status.geminiFileMeta = files[0];
        this.notify();
        return files[0];
      }
      this.status.geminiFileMeta = null;
      this.notify();
      return null;
    } catch (err: any) {
      console.warn('[GoogleDriveService] Error finding gemini.md:', err.message);
      return null;
    }
  }

  /**
   * Download content of a specific file from Google Drive
   */
  public async downloadFileContent(fileId: string): Promise<string> {
    if (!cachedAccessToken) {
      throw new Error('Authentication required to access Google Drive.');
    }

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to download file content from Google Drive (${res.status})`);
    }

    return await res.text();
  }

  /**
   * Pulls gemini.md from the user's Google Drive and stores into VFS and local memory
   */
  public async syncGeminiMdFromDrive(): Promise<{ success: boolean; content: string; meta?: GoogleDriveFileMeta; message: string }> {
    if (!cachedAccessToken) {
      return {
        success: false,
        content: '',
        message: 'Google Drive authentication required. Please sign in with Google.',
      };
    }

    this.status.syncState = 'syncing';
    this.status.syncProgressPct = 15;
    this.status.syncPhase = 'Connecting to Google Drive API...';
    this.status.errorMessage = null;
    this.notify();
    await sleep(80);

    try {
      this.status.syncProgressPct = 38;
      this.status.syncPhase = 'Querying machackabook@gmail.com trove for gemini.md...';
      this.notify();
      await sleep(100);

      let fileMeta = this.status.geminiFileMeta;
      if (!fileMeta) {
        fileMeta = await this.findGeminiMdFile();
      }

      if (!fileMeta) {
        this.status.syncState = 'idle';
        this.status.syncProgressPct = 0;
        this.status.syncPhase = 'gemini.md not found in trove';
        this.notify();
        return {
          success: false,
          content: '',
          message: 'No "gemini.md" file was found in your Google Drive root or folders. You can create one by clicking "Push Local gemini.md to Drive".',
        };
      }

      this.status.syncProgressPct = 68;
      this.status.syncPhase = `Downloading engrams stream (${fileMeta.size ? `${(parseInt(fileMeta.size, 10) / 1024).toFixed(1)}KB` : 'metadata verified'})...`;
      this.notify();
      await sleep(120);

      // Download content
      const content = await this.downloadFileContent(fileMeta.id);

      this.status.syncProgressPct = 88;
      this.status.syncPhase = `Committing ${content.length} bytes to /mnt/nexus_drive/gemini.md...`;
      this.notify();
      await sleep(80);

      // Save into virtual filesystem at /root/gemini.md and /mnt/nexus_drive/gemini.md
      try {
        vfs.writeFile('/root', 'gemini.md', content);
        vfs.writeFile('/mnt', '/mnt/nexus_drive/gemini.md', content);
      } catch (vfsErr) {
        console.warn('[GoogleDriveService] Failed to write to VFS:', vfsErr);
      }

      this.status.syncState = 'synced';
      this.status.syncProgressPct = 100;
      this.status.syncPhase = `Synchronized (${content.length} chars)`;
      this.status.lastSyncedAt = new Date().toISOString();
      this.status.geminiFileMeta = fileMeta;
      this.notify();
      this.notifyEngram(content);

      return {
        success: true,
        content,
        meta: fileMeta,
        message: `Successfully synchronized gemini.md (${content.length} characters) from Google Drive.`,
      };
    } catch (err: any) {
      this.status.syncState = 'error';
      this.status.syncProgressPct = 0;
      this.status.syncPhase = `Sync error: ${err.message}`;
      this.status.errorMessage = err.message;
      this.notify();
      return {
        success: false,
        content: '',
        message: `Failed to pull gemini.md from Google Drive: ${err.message}`,
      };
    }
  }

  /**
   * Upload or update gemini.md in Google Drive.
   * NOTE: As mandated by the Workspace skill, destructive/mutating operations require explicit user confirmation.
   */
  public async uploadGeminiMdToDrive(
    content: string,
    userConfirmed: boolean
  ): Promise<{ success: boolean; fileMeta?: GoogleDriveFileMeta | null; message: string }> {
    if (!cachedAccessToken) {
      return { success: false, message: 'Google Drive authentication required.' };
    }

    if (!userConfirmed) {
      return { success: false, message: 'Operation cancelled: User confirmation required to modify Google Drive files.' };
    }

    this.status.syncState = 'syncing';
    this.status.syncProgressPct = 20;
    this.status.syncPhase = `Packaging local engrams (${content.length} chars)...`;
    this.status.errorMessage = null;
    this.notify();
    await sleep(80);

    try {
      this.status.syncProgressPct = 45;
      this.status.syncPhase = 'Resolving destination file in machackabook@gmail.com trove...';
      this.notify();
      await sleep(80);

      const existing = await this.findGeminiMdFile();

      this.status.syncProgressPct = 72;
      this.status.syncPhase = existing
        ? `Uploading patch payload to gemini.md [${existing.id.slice(0, 8)}...]...`
        : 'Creating multipart gemini.md in Google Drive...';
      this.notify();
      await sleep(100);

      if (existing) {
        // UPDATE existing file
        const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`;
        const res = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${cachedAccessToken}`,
            'Content-Type': 'text/markdown; charset=UTF-8',
          },
          body: content,
        });

        if (!res.ok) {
          throw new Error(`Google Drive update failed: HTTP ${res.status}`);
        }

        const updatedMeta = await res.json();
        this.status.geminiFileMeta = { ...existing, ...updatedMeta };
        this.status.syncState = 'synced';
        this.status.syncProgressPct = 100;
        this.status.syncPhase = `Uploaded & synchronized (${content.length} chars)`;
        this.status.lastSyncedAt = new Date().toISOString();
        this.notify();

        return {
          success: true,
          fileMeta: this.status.geminiFileMeta,
          message: `Updated existing gemini.md (ID: ${existing.id}) in your Google Drive.`,
        };
      } else {
        // CREATE new file in Google Drive via multipart upload
        const metadata = {
          name: 'gemini.md',
          mimeType: 'text/markdown',
          description: 'HyperTerminal Polyglot Quine OS Master Architectural Memory Engrams',
        };

        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: text/markdown; charset=UTF-8\r\n\r\n' +
          content +
          closeDelimiter;

        const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        const res = await fetch(createUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cachedAccessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        });

        if (!res.ok) {
          throw new Error(`Google Drive create file failed: HTTP ${res.status}`);
        }

        const newFileMeta: GoogleDriveFileMeta = await res.json();
        this.status.geminiFileMeta = newFileMeta;
        this.status.syncState = 'synced';
        this.status.syncProgressPct = 100;
        this.status.syncPhase = `Created & synchronized new gemini.md in Drive trove`;
        this.status.lastSyncedAt = new Date().toISOString();
        this.notify();

        return {
          success: true,
          fileMeta: newFileMeta,
          message: `Created new gemini.md file (ID: ${newFileMeta.id}) in your Google Drive.`,
        };
      }
    } catch (err: any) {
      this.status.syncState = 'error';
      this.status.syncProgressPct = 0;
      this.status.syncPhase = `Upload error: ${err.message}`;
      this.status.errorMessage = err.message;
      this.notify();
      return {
        success: false,
        message: `Failed to upload gemini.md to Google Drive: ${err.message}`,
      };
    }
  }
  public async saveEnvStateToDrive(state: any, userConfirmed: boolean): Promise<{ success: boolean; message: string; fileId?: string }> {
    if (!cachedAccessToken) {
      return { success: false, message: 'Google Drive authentication required.' };
    }

    if (!userConfirmed) {
      return { success: false, message: 'Operation cancelled: User confirmation required.' };
    }

    try {
      const content = JSON.stringify(state);
      const metadata = {
        name: 'env_state.json',
        mimeType: 'application/json',
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        content +
        closeDelimiter;

      // Check if it already exists
      const existing = await this.searchFiles("name = 'env_state.json' and trashed = false");
      
      let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      let method = 'POST';
      
      if (existing.length > 0) {
        url = `https://www.googleapis.com/upload/drive/v3/files/${existing[0].id}?uploadType=media`;
        method = 'PATCH';
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          'Content-Type': method === 'PATCH' ? 'application/json' : `multipart/related; boundary=${boundary}`,
        },
        body: method === 'PATCH' ? content : multipartRequestBody,
      });

      if (!res.ok) {
        throw new Error(`Google Drive save failed: HTTP ${res.status}`);
      }

      const fileData = await res.json().catch(() => ({}));
      const fileId = fileData?.id || (existing.length > 0 ? existing[0].id : undefined);

      return { success: true, message: 'EnvState saved to Drive.', fileId };
    } catch (err: any) {
      return { success: false, message: `Failed to save to Drive: ${err.message}` };
    }
  }
}

export const googleDriveService = new GoogleDriveService();
