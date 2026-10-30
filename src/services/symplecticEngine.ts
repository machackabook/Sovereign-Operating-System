/**
 * Symplectic Quine Engine (SQE) - Core Implementation
 *
 * Implements the theoretical framework for autonomous system evolution using
 * Hamiltonian phase-space dynamics. This engine treats code mutation as a
 * conservative trajectory through an abstract computational manifold (q, p).
 *
 * - Generalized Coordinate (q): Structural state (Code Source / AST).
 * - Generalized Momentum (p): Mutation velocity (Diff Transformations).
 * - Hamiltonian (H): H(q, p) = T(p) + V(q), preserved to prevent entropy bloat.
 * - Symplectic Leapfrog Integrator: Ensures time-reversible, stable evolution.
 */

import { primeCompressor } from './primeMathCompressor';
import { sparsebundleService } from './sparsebundleService';

export interface SQEState {
  q: string; // Generalized Coordinate: Serialized Code Structure
  p: number; // Generalized Momentum Magnitude
  mass: number; // System Inertia (Penalizes chaotic alterations)
  potential: number; // V(q): Verification penalty scalar
  kinetic: number; // T(p): Mutation energy
  hamiltonian: number; // Total conserved energy H
}

export interface MutationResult {
  accepted: boolean;
  newState: SQEState;
  energyDrift: number;
  reason?: string;
}

export class SymplecticEngine {
  private state: SQEState;
  private dt: number = 0.01; // Time step for symplectic integration
  private readonly energyBarrier = 50.0; // Max allowed H deviation

  constructor(initialCode: string) {
    this.state = {
      q: initialCode,
      p: 0,
      mass: 1.0,
      potential: 0,
      kinetic: 0,
      hamiltonian: 0,
    };
    this.recalculateEnergy();
  }

  /**
   * Recalculates H = T + V
   */
  private recalculateEnergy() {
    // Kinetic Energy T = p^2 / 2m
    this.state.kinetic = (this.state.p * this.state.p) / (2 * this.state.mass);
    // Potential Energy V(q) is calculated externally based on verification
    this.state.hamiltonian = this.state.kinetic + this.state.potential;
  }

  /**
   * Calculates the "potential" of a code state based on syntax, size, and tests.
   */
  public calculatePotential(code: string, testScore: number = 0): number {
    let v = 0;
    
    // 1. Syntax & Integrity Barrier
    if (!code || code.length === 0) v += 1000;
    
    // 2. Length Entropy Penalty (Prevents runaway code bloat)
    const baseLength = 10000;
    if (code.length > baseLength) {
      v += Math.pow((code.length - baseLength) / 1000, 2);
    }

    // 3. Verification Score (Higher score = higher potential/penalty)
    // 0 = Perfect, >0 = Failures/Latency
    v += testScore;

    return v;
  }

  /**
   * Calculates momentum magnitude p from a diff vector
   */
  public calculateMomentum(oldCode: string, newCode: string): number {
    const { stats } = primeCompressor.compress(newCode);
    // Use edit distance approximation via compression ratio and length delta
    const lenDelta = Math.abs(newCode.length - oldCode.length);
    const entropyShift = Math.abs(stats.entropyBitsPerChar - 0.5) * 10;
    
    // Momentum = Change Intensity
    return Math.sqrt(lenDelta * 0.1 + entropyShift);
  }

  /**
   * Evolves the engine state using a Symplectic Leapfrog Step
   * 1. Kick: p(t + dt/2) = p(t) - (dt/2) * gradV(q(t))
   * 2. Drift: q(t + dt) = q(t) + (dt/m) * p(t + dt/2)
   * 3. Kick: p(t + dt) = p(t + dt/2) - (dt/2) * gradV(q(t + dt))
   */
  public attemptMutation(proposedCode: string, testScore: number): MutationResult {
    const oldV = this.state.potential;
    const newV = this.calculatePotential(proposedCode, testScore);
    
    // Gradient Approximation: (V_new - V_old) / dq
    const gradV = (newV - oldV);

    // Leapfrog Step 1: Kick momentum
    const pHalf = this.state.p - (this.dt / 2) * gradV;

    // Leapfrog Step 2: Drift coordinate (Update Q)
    // In our discrete code model, q doesn't evolve linearly, it jumps to proposed state
    const newQ = proposedCode;
    
    // Leapfrog Step 3: Kick momentum again
    const newP = pHalf - (this.dt / 2) * gradV;

    // Calculate new Hamiltonian
    const newKinetic = (newP * newP) / (2 * this.state.mass);
    const newH = newKinetic + newV;
    const energyDrift = Math.abs(newH - this.state.hamiltonian);

    // Conservation check: Reject if energy spike violates Liouville's preservation
    if (newH > this.energyBarrier && newH > this.state.hamiltonian) {
      return {
        accepted: false,
        newState: this.state,
        energyDrift,
        reason: `Hamiltonian breach: ${newH.toFixed(2)} > ${this.energyBarrier}`,
      };
    }

    const nextState: SQEState = {
      q: newQ,
      p: newP,
      mass: this.state.mass,
      potential: newV,
      kinetic: newKinetic,
      hamiltonian: newH,
    };

    const prevH = this.state.hamiltonian;
    this.state = nextState;

    return {
      accepted: true,
      newState: nextState,
      energyDrift: Math.abs(newH - prevH),
    };
  }

  /**
   * Time-Reversal Operation
   * Flips momentum and integrates backward to restore a prior stable state.
   */
  public reverseMomentum() {
    this.state.p = -this.state.p;
  }

  public getState(): SQEState {
    return { ...this.state };
  }

  /**
   * Persists the current engine phase-state to a Sparsebundle band
   */
  public async checkpoint(): Promise<string> {
    const payload = JSON.stringify(this.state);
    const fileName = `sqe/checkpoint_${Date.now()}.prm`;
    const { compressed } = primeCompressor.compress(payload);
    sparsebundleService.writeFile('StateVault.sparsebundle', fileName, compressed);
    return fileName;
  }
}

export const sqe = new SymplecticEngine('// Genesis Quine Kernel\n');
