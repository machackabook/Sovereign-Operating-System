/**
 * RavenEye Streaming Service
 * Bridges RavenEyeTE Telemetry Core to reactive components
 * via a subscription-based streaming model.
 */

import { ravenEyeEngineService, PulsePayload, PulseHook } from './raveneytePulseEngine';

class RavenEyeStreamingService {
  private hooks: Set<PulseHook> = new Set();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    
    // Add a central hook to the pulse engine
    ravenEyeEngineService.getPulseEngine().addHook((pulse: PulsePayload) => {
      this.notify(pulse);
    });
    
    this.initialized = true;
  }

  /**
   * Subscribe to real-time telemetry pulses
   */
  public subscribe(hook: PulseHook): () => void {
    this.hooks.add(hook);
    return () => this.hooks.delete(hook);
  }

  private notify(pulse: PulsePayload) {
    for (const hook of this.hooks) {
      try {
        hook(pulse);
      } catch (err) {
        console.error('[RavenEyeStreaming] Notification error', err);
      }
    }
  }

  public getSnapshot() {
    return ravenEyeEngineService.getTelemetry().snapshot();
  }
}

export const ravenEyeStreamingService = new RavenEyeStreamingService();
