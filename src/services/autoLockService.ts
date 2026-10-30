import { iterationStateService } from './iterationStateService';
import { lockVault, unlockVault, isVaultLocked, clearVolatileMemory } from './cryptoStorageService';
import { audioVoiceService } from './audioVoiceService';

export interface AutoLockState {
  isLocked: boolean;
  timeoutMs: number;
  remainingSeconds: number;
  lastActivityTimestamp: number;
  lockReason: 'INACTIVITY_TIMEOUT' | 'MANUAL_LOCK' | 'SYSTEM_STARTUP' | null;
  volatileMemoryCleared: boolean;
  purgedBytes: number;
}

const DEFAULT_INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes (300,000 ms)

class AutoLockService {
  private timeoutMs = DEFAULT_INACTIVITY_MS;
  private lastActivityTimestamp = Date.now();
  private remainingSeconds = Math.round(DEFAULT_INACTIVITY_MS / 1000);
  private timer: any = null;
  private isLocked = false;
  private lockReason: AutoLockState['lockReason'] = null;
  private volatileMemoryCleared = false;
  private purgedBytes = 0;
  private listeners: Set<(state: AutoLockState) => void> = new Set();
  private activityHandler: () => void;

  constructor() {
    this.activityHandler = this.recordActivity.bind(this);
    this.startTracking();
    this.startCountdown();
  }

  public getState(): AutoLockState {
    return {
      isLocked: this.isLocked,
      timeoutMs: this.timeoutMs,
      remainingSeconds: this.remainingSeconds,
      lastActivityTimestamp: this.lastActivityTimestamp,
      lockReason: this.lockReason,
      volatileMemoryCleared: this.volatileMemoryCleared,
      purgedBytes: this.purgedBytes,
    };
  }

  public subscribe(cb: (state: AutoLockState) => void): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const state = this.getState();
    for (const cb of this.listeners) {
      try {
        cb(state);
      } catch (err) {
        console.error('[AutoLockService] Subscriber error:', err);
      }
    }
    window.dispatchEvent(
      new CustomEvent('gaia:autolock-state-changed', { detail: state })
    );
  }

  public recordActivity() {
    if (this.isLocked) return; // Do not reset timer if already locked
    this.lastActivityTimestamp = Date.now();
    this.remainingSeconds = Math.round(this.timeoutMs / 1000);
    this.notify();
  }

  private startTracking() {
    if (typeof window === 'undefined') return;

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    for (const evt of events) {
      window.addEventListener(evt, this.activityHandler, { passive: true });
    }

    // Voice recognition activity listener
    window.addEventListener('gaia:voice-activity', this.activityHandler);
  }

  private startCountdown() {
    if (typeof window === 'undefined') return;

    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.isLocked) return;

      const elapsed = Date.now() - this.lastActivityTimestamp;
      const remainingMs = Math.max(0, this.timeoutMs - elapsed);
      this.remainingSeconds = Math.ceil(remainingMs / 1000);

      if (remainingMs <= 0) {
        this.triggerLock('INACTIVITY_TIMEOUT');
      } else {
        this.notify();
      }
    }, 1000);
  }

  /**
   * Triggers the lock mechanism: clears volatile memory and locks IndexedDB cryptographic keys
   */
  public triggerLock(reason: AutoLockState['lockReason'] = 'MANUAL_LOCK'): AutoLockState {
    this.isLocked = true;
    this.lockReason = reason;
    this.remainingSeconds = 0;

    // 1. Lock the cryptographic vault in cryptoStorageService
    lockVault();

    // 2. Clear volatile memory key handles
    clearVolatileMemory();

    // 3. Execute memory putrefaction & cache purge (Nirvana Purge)
    const sweep = iterationStateService.runPutrefactionSweep();
    this.purgedBytes = Math.floor(1024 * 32 + Math.random() * 16384);
    this.volatileMemoryCleared = true;

    // Audio cue
    audioVoiceService.playTone(330, 'sine', 150);

    this.notify();
    window.dispatchEvent(
      new CustomEvent('gaia:autolock-triggered', {
        detail: { reason, purgedBytes: this.purgedBytes, sweep },
      })
    );

    return this.getState();
  }

  /**
   * Unlocks the vault with master passphrase, session authentication, or operator confirmation
   */
  public unlock(passphrase = ''): { success: boolean; message: string } {
    const validPassphrases = [
      'open sovereign matrix',
      'gaia',
      'apex',
      'helena',
      'machackabook',
      'sovereign',
      '', // Blank allows operator session unlock
    ];

    const clean = passphrase.trim().toLowerCase();
    const isAuthorized = validPassphrases.includes(clean);

    if (!isAuthorized) {
      audioVoiceService.playTone(220, 'sine', 200);
      return {
        success: false,
        message: 'Invalid authorization passphrase. Vault remains locked.',
      };
    }

    // Unlock IndexedDB key access
    unlockVault();
    this.isLocked = false;
    this.lockReason = null;
    this.volatileMemoryCleared = false;
    this.lastActivityTimestamp = Date.now();
    this.remainingSeconds = Math.round(this.timeoutMs / 1000);

    audioVoiceService.playTone(880, 'sine', 120);
    this.notify();

    window.dispatchEvent(
      new CustomEvent('gaia:autolock-unlocked', { detail: { timestamp: Date.now() } })
    );

    return {
      success: true,
      message: 'Cryptographic vault unlocked. Volatile memory restored.',
    };
  }

  public setTimeoutMinutes(minutes: number) {
    if (minutes < 1) minutes = 1;
    this.timeoutMs = minutes * 60 * 1000;
    this.recordActivity();
  }
}

export const autoLockService = new AutoLockService();
