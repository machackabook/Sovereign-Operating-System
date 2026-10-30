/**
 * Personality Substrate Service
 * State-driven behavioral conditioning tied to the 5-phase biological lifecycle engine:
 * (OBSERVE -> DIGEST -> INTEGRATE -> STABILIZE -> SHED)
 * 
 * Embeds grounded cognitive context for Architect_01, enforcing high-entropy key verification,
 * tamper-proofing, clean VFS alignment, and concise terminal parameter output during DIGEST/SHED phases.
 */

import { livingComputationEngine, LifecyclePhase, LifecycleTelemetry } from './livingComputationEngine';

export interface PersonalityState {
  activePhase: LifecyclePhase;
  identity: 'Architect_01';
  sovereignUser: string;
  primeAnchorKey: string;
  checksumSeal: string;
  condensedOutputMode: boolean; // True during DIGEST or SHED phases
  cognitiveFocus: string;
  behavioralInstructions: string;
  vfsAlignmentStatus: 'PRISTINE' | 'SYNCED' | 'HOT_SWAPPED';
}

class PersonalitySubstrateService {
  private sovereignUser = 'machackabook@gmail.com';
  private primeAnchorKey = '137451921129154222';
  private checksumSeal = '0x77446C2E';
  private listeners: Set<(state: PersonalityState) => void> = new Set();
  private lastTelemetry: LifecycleTelemetry;

  constructor() {
    this.lastTelemetry = livingComputationEngine.getTelemetry();
    livingComputationEngine.subscribe((telemetry) => {
      this.lastTelemetry = telemetry;
      this.notify();
    });
  }

  public getPersonalityState(): PersonalityState {
    const phase = this.lastTelemetry.currentPhase;
    const isCondensed = phase === 'DIGEST' || phase === 'SHED';

    let focus = '';
    let instructions = '';

    switch (phase) {
      case 'OBSERVE':
        focus = 'Sensory Telemetry & Environmental Entropy Analysis';
        instructions = 'Focus on analyzing ambient signals, hardware thread concurrency, and VFS status metrics.';
        break;
      case 'DIGEST':
        focus = 'Prime Math Compaction & Memory Reclamation';
        instructions = 'CONDENSED MODE ACTIVE: Prioritize minimal terminal parameters, prime residue tokens, and concise memory logs. Omit conversational filler.';
        break;
      case 'INTEGRATE':
        focus = 'Cryptographic Ledger Stamping & Key Attestation';
        instructions = 'Enforce Architect_01 role validation, high-entropy key verification (137451921129154222), and tamper-proof state receipts.';
        break;
      case 'STABILIZE':
        focus = 'Homeostatic Equilibrium & Dual-Harmonic Lock';
        instructions = 'Balance 60 FPS render budgets, state coherence (>99.5%), and 432Hz/963Hz dual-oscillator acoustic equilibrium.';
        break;
      case 'SHED':
        focus = 'Ephemeral Cache Decay & Putrefaction Sweep';
        instructions = 'CONDENSED MODE ACTIVE: Condense outputs strictly into memory reclamation stats, zero-leak verifications, and parameter hashes.';
        break;
    }

    return {
      activePhase: phase,
      identity: 'Architect_01',
      sovereignUser: this.sovereignUser,
      primeAnchorKey: this.primeAnchorKey,
      checksumSeal: this.checksumSeal,
      condensedOutputMode: isCondensed,
      cognitiveFocus: focus,
      behavioralInstructions: instructions,
      vfsAlignmentStatus: 'PRISTINE',
    };
  }

  /**
   * Generates a context-enhanced system prompt injecting active personality state
   */
  public generateGroundedPrompt(baseContext: string = ''): string {
    const state = this.getPersonalityState();
    return `[ARCHITECT_01 COGNITIVE CONTEXT]
Role: Sovereign Operator & Systems Architect (Architect_01)
Authenticated User: ${state.sovereignUser}
Prime Anchor Key: ${state.primeAnchorKey} | Checksum Seal: ${state.checksumSeal}
Active Lifecycle Phase: ${state.activePhase}
Condensed Log Mode: ${state.condensedOutputMode ? 'ENABLED (Terminal Concise Format)' : 'DISABLED (Full Context)'}
Cognitive Focus: ${state.cognitiveFocus}
Directive: ${state.behavioralInstructions}

Constraints & Rules:
1. High-Entropy Key Verification: Validate 137451921129154222 across execution paths.
2. Tamper-Proofing: Seal all structural changes in the cryptographic ledger with SHA-256 state receipts.
3. VFS Alignment: Maintain strictly isolated RAM-backed paths (/sys/kernel, /sys/telemetry, /docs/lineage).
4. Mode-Driven Tone: ${state.condensedOutputMode ? 'Output short, deterministic parameters and clean status JSON.' : 'Provide comprehensive architectural intelligence.'}

${baseContext}`.trim();
  }

  /**
   * Applies state-driven behavioral formatting to LLM response or terminal message
   */
  public formatResponse(text: string): string {
    const state = this.getPersonalityState();
    if (!state.condensedOutputMode) {
      return text;
    }

    // Condensed mode formatting for DIGEST and SHED phases
    const lines = text.split('\n');
    const filtered = lines.filter((l) => {
      const trimmed = l.trim();
      // Omit excessive greeting or chatty intros
      if (trimmed.toLowerCase().startsWith('hello') || trimmed.toLowerCase().startsWith("i'd be happy") || trimmed.toLowerCase().startsWith('sure,')) {
        return false;
      }
      return true;
    });

    const condensedHeader = `[${state.activePhase}::ARCHITECT_01] TELEMETRY_CONDENSED // KEY:${state.primeAnchorKey.slice(0, 8)}...`;
    return `${condensedHeader}\n${filtered.join('\n')}`.trim();
  }

  public subscribe(cb: (state: PersonalityState) => void): () => void {
    this.listeners.add(cb);
    cb(this.getPersonalityState());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const state = this.getPersonalityState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('[PersonalitySubstrateService] Listener error:', err);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gaia:personality-state-updated', { detail: state }));
    }
  }
}

export const personalitySubstrateService = new PersonalitySubstrateService();
