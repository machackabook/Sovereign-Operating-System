import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { EnvironmentState } from '../types';

export interface MetadataSyncEvent {
  type: 'ENV_SAVED' | 'VFS_SAVED' | 'LIFECYCLE_SAVED' | 'HYDRATED';
  timestamp: number;
  source: 'FIRESTORE' | 'LOCAL';
  details?: string;
}

const LOCAL_STORAGE_KEY_ENV = 'hyperterminal_env_state_v1';
const LOCAL_STORAGE_KEY_VFS_META = 'hyperterminal_vfs_meta_v1';
const LOCAL_STORAGE_KEY_LIFECYCLE = 'hyperterminal_lifecycle_meta_v1';

class MetadataPersistenceService {
  private debouncedTimer: any = null;
  private pendingEnvPayload: Partial<EnvironmentState> | null = null;
  private listeners: Set<(event: MetadataSyncEvent) => void> = new Set();

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    if (typeof window === 'undefined') return;
    window.addEventListener('gaia:auth-state-changed', (e: any) => {
      // Re-hydrate or push pending metadata when auth state transitions
      if (e?.detail?.isAuthenticated) {
        this.flushPendingSync();
      }
    });
  }

  public subscribe(cb: (event: MetadataSyncEvent) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(event: MetadataSyncEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[MetadataPersistenceService] Subscriber error:', err);
      }
    }
  }

  /**
   * Persists EnvironmentState metadata with local cache + debounced Firestore persistence
   */
  public async saveEnvironmentMetadata(envState: EnvironmentState): Promise<void> {
    // 1. Immediately cache in localStorage for instant reload & offline resilience
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_ENV, JSON.stringify(envState));
      } catch (e) {
        console.warn('[MetadataPersistenceService] localStorage write warning:', e);
      }
    }

    this.pendingEnvPayload = envState;

    // 2. Debounce cloud Firestore sync by 800ms to eliminate write thrashing
    if (this.debouncedTimer) clearTimeout(this.debouncedTimer);
    this.debouncedTimer = setTimeout(() => {
      this.flushPendingSync();
    }, 800);
  }

  /**
   * Flushes pending environment state directly to Firestore
   */
  public async flushPendingSync(): Promise<void> {
    if (!this.pendingEnvPayload) return;
    const payload = { ...this.pendingEnvPayload };
    this.pendingEnvPayload = null;

    const user = auth.currentUser;
    const userId = user?.uid;

    try {
      if (userId) {
        // Authenticated user state document in Firestore
        const userDocRef = doc(db, 'userStates', userId, 'metadata', 'system_state');
        await setDoc(
          userDocRef,
          {
            env: payload,
            updatedAt: serverTimestamp(),
            userEmail: user?.email || 'machackabook@gmail.com',
          },
          { merge: true }
        );
      } else {
        // Global / Sovereign local fallback state in Firestore
        const globalDocRef = doc(db, 'systemMetadata', 'global_state');
        await setDoc(
          globalDocRef,
          {
            env: payload,
            updatedAt: serverTimestamp(),
            scope: 'global_sovereign',
          },
          { merge: true }
        );
      }

      this.emit({
        type: 'ENV_SAVED',
        timestamp: Date.now(),
        source: 'FIRESTORE',
        details: 'Environment metadata synchronized to Firestore database',
      });
    } catch (err: any) {
      // Offline fallback: state remains safely persisted in localStorage
      this.emit({
        type: 'ENV_SAVED',
        timestamp: Date.now(),
        source: 'LOCAL',
        details: `Saved to local storage (Cloud pending: ${err?.message || 'offline'})`,
      });
    }
  }

  /**
   * Loads persisted environment metadata, checking Firestore first then falling back to localStorage
   */
  public async loadEnvironmentMetadata(): Promise<Partial<EnvironmentState> | null> {
    const user = auth.currentUser;
    const userId = user?.uid;

    // 1. Try Firestore if authenticated or online
    try {
      if (userId) {
        const userDocRef = doc(db, 'userStates', userId, 'metadata', 'system_state');
        const snap = await getDoc(userDocRef);
        if (snap.exists() && snap.data()?.env) {
          this.emit({
            type: 'HYDRATED',
            timestamp: Date.now(),
            source: 'FIRESTORE',
            details: 'Hydrated user metadata from Firestore',
          });
          return snap.data()?.env;
        }
      }

      const globalDocRef = doc(db, 'systemMetadata', 'global_state');
      const globalSnap = await getDoc(globalDocRef);
      if (globalSnap.exists() && globalSnap.data()?.env) {
        this.emit({
          type: 'HYDRATED',
          timestamp: Date.now(),
          source: 'FIRESTORE',
          details: 'Hydrated global metadata from Firestore',
        });
        return globalSnap.data()?.env;
      }
    } catch {
      // Fallback to local storage
    }

    // 2. Fallback to localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ENV);
        if (raw) {
          this.emit({
            type: 'HYDRATED',
            timestamp: Date.now(),
            source: 'LOCAL',
            details: 'Hydrated metadata from local storage cache',
          });
          return JSON.parse(raw);
        }
      } catch (e) {
        console.warn('[MetadataPersistenceService] localStorage read error:', e);
      }
    }

    return null;
  }

  /**
   * Persists VFS file metadata updates
   */
  public async saveVfsFileMetadata(
    filePath: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const user = auth.currentUser;
    const userId = user?.uid;

    // Cache locally
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_VFS_META) || '{}');
        existing[filePath] = { ...metadata, updatedAt: Date.now() };
        localStorage.setItem(LOCAL_STORAGE_KEY_VFS_META, JSON.stringify(existing));
      } catch {}
    }

    // Persist to Firestore
    try {
      const sanitizedDocId = filePath.replace(/[^a-zA-Z0-9_-]/g, '_');
      if (userId) {
        const vfsDocRef = doc(db, 'userStates', userId, 'metadata', `vfs_${sanitizedDocId}`);
        await setDoc(vfsDocRef, { filePath, metadata, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        const vfsDocRef = doc(db, 'systemMetadata', `vfs_${sanitizedDocId}`);
        await setDoc(vfsDocRef, { filePath, metadata, updatedAt: serverTimestamp() }, { merge: true });
      }

      this.emit({
        type: 'VFS_SAVED',
        timestamp: Date.now(),
        source: 'FIRESTORE',
        details: `VFS metadata for ${filePath} persisted to Firestore`,
      });
    } catch {
      this.emit({
        type: 'VFS_SAVED',
        timestamp: Date.now(),
        source: 'LOCAL',
        details: `VFS metadata for ${filePath} stored in local cache`,
      });
    }
  }

  /**
   * Persists Living Computation Lifecycle telemetry
   */
  public async saveLifecycleMetadata(data: Record<string, any>): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_LIFECYCLE, JSON.stringify(data));
      } catch {}
    }

    const user = auth.currentUser;
    const userId = user?.uid;

    try {
      if (userId) {
        const docRef = doc(db, 'userStates', userId, 'metadata', 'living_computation');
        await setDoc(docRef, { lifecycle: data, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        const docRef = doc(db, 'systemMetadata', 'living_computation');
        await setDoc(docRef, { lifecycle: data, updatedAt: serverTimestamp() }, { merge: true });
      }
      this.emit({
        type: 'LIFECYCLE_SAVED',
        timestamp: Date.now(),
        source: 'FIRESTORE',
        details: 'Lifecycle telemetry persisted to Firestore',
      });
    } catch {}
  }
}

export const metadataPersistenceService = new MetadataPersistenceService();
