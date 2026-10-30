/**
 * Dynamic Polymorphic Neurality Engine
 * 
 * Context & Sentiment Analysis System that dynamically adapts:
 * - 3D Visual Renderer Topologies (Forest, Cybercity, Neural, Galaxy, Tesseract, DNA, etc.)
 * - Environmental Shaders, Color Palettes, Gravity & Particle Physics
 * - Polymorphic AI Voice Persona, Speech Delivery & Resonator Tones
 * - 3D Kinetic Typographic Displays
 */

import { TopologyType, SentimentType, EnvironmentState } from '../types';
import { audioVoiceService } from './audioVoiceService';

export type NeuralDomain =
  | 'nature'
  | 'technology'
  | 'cosmic'
  | 'quantum'
  | 'neural'
  | 'biology'
  | 'robotics'
  | 'security'
  | 'creative'
  | 'analytical'
  | 'inspection';

export interface TextStyleConfig {
  fontFamily: string;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  borderStyle: 'organic' | 'cyber' | 'stellar' | 'hazard' | 'crystalline';
  tag: string;
}

export interface NeuralityState {
  domain: NeuralDomain;
  topology: TopologyType;
  sentiment: SentimentType;
  primaryColor: string;
  secondaryColor: string;
  speed: number;
  gravity: number;
  turbulence: number;
  voiceProfile: string;
  voicePitch: number;
  voiceRate: number;
  floatingGlyph: string;
  speechTone: string;
  deliveryTone: string;
  synthesisReply: string;
  matchedKeywords: string[];
  textStyle: TextStyleConfig;
  confidence: number;
}

type NeuralityListener = (state: NeuralityState) => void;

class NeuralityEngine {
  private autoAdaptEnabled = true;
  private currentState: NeuralityState = {
    domain: 'analytical',
    topology: 'torus',
    sentiment: 'analytical',
    primaryColor: '#00f2ff',
    secondaryColor: '#a855f7',
    speed: 1.0,
    gravity: 1.2,
    turbulence: 0.5,
    voiceProfile: 'gemini_female',
    voicePitch: 1.15,
    voiceRate: 1.02,
    floatingGlyph: '⨋',
    speechTone: 'Precise & Analytical',
    deliveryTone: 'Precise & Analytical',
    synthesisReply: 'Neural analytical state synchronized with harmonic quantum lattice.',
    matchedKeywords: ['analytical', 'torus'],
    textStyle: {
      fontFamily: '"JetBrains Mono", monospace',
      primaryColor: '#00f2ff',
      accentColor: '#a855f7',
      glowColor: 'rgba(0, 242, 255, 0.45)',
      borderStyle: 'crystalline',
      tag: 'ANALYTICAL SYNAPSE',
    },
    confidence: 1.0,
  };

  private listeners: Set<NeuralityListener> = new Set();

  public isAutoEnabled(): boolean {
    return this.autoAdaptEnabled;
  }

  public setAutoEnabled(enabled: boolean): void {
    this.autoAdaptEnabled = enabled;
  }

  public getCurrentState(): NeuralityState {
    return this.currentState;
  }

  public setDomain(domain: NeuralDomain): NeuralityState {
    const newState = this.createStateForDomain(domain, 4);
    this.currentState = newState;
    this.notify();
    return newState;
  }

  public subscribe(listener: NeuralityListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentState);
      } catch (e) {
        console.error('Error in neurality listener:', e);
      }
    });
  }

  /**
   * Semantic and Lexical Analyzer
   * Evaluates text for thematic and affective markers
   */
  public analyze(input: string): NeuralityState {
    const text = input.toLowerCase();

    // Word boundary scoring helpers
    const countMatches = (regex: RegExp) => {
      const m = text.match(regex);
      return m ? m.length : 0;
    };

    // Domain Dictionaries with regular expressions
    const scores = {
      nature: countMatches(/\b(nature|forest|tree|trees|plant|plants|garden|leaf|leaves|wood|woods|woodland|rainforest|jungle|earth|wildlife|animal|animals|flower|flowers|blossom|flora|fauna|biome|green|greenery|organic|river|lake|mountain|soil|meadow|environment|ecology|biophilic|ocean|sea|coral|breeze|seed|sunlight)\b/g) * 3.5,
      technology: countMatches(/\b(tech|technology|cyber|cyberpunk|cybercity|city|cityscape|skyscrapers?|futuristic|matrix|computer|computers|processor|cpu|gpu|code|coding|software|hardware|server|datacenter|network|packets?|protocol|terminal|linux|compiler|program|programming|ai|artificial|robot|silicon|algorithm|hacker|virtual|digital|web|node|data|script)\b/g) * 3.5,
      cosmic: countMatches(/\b(space|cosmos|cosmic|galaxy|galaxies|stars?|stellar|nebula|astronomy|astrophysics|planet|planets|orbit|orbital|black\s*hole|singularity|universe|interstellar|supernova|quasar|meteor|comet|gravity|spacetime)\b/g) * 3.2,
      quantum: countMatches(/\b(quantum|qubit|hadamard|superposition|entanglement|alphaqubit|physics|particle|wave|formula|equation|theorem|calculus|riemann|zeta|dimension|4d|tesseract|math|mathematics|eigen|schrodinger|manifold)\b/g) * 3.2,
      biology: countMatches(/\b(dna|rna|gene|genes|genetic|genetics|protein|protein_fold|alphafold|enzyme|cellular|cells?|organism|mutation|evolution|helix|biochemistry|ribosome|bacteria|virus|genome)\b/g) * 3.0,
      robotics: countMatches(/\b(robot|robotics|robotic|arm|actuator|sensor|servo|mechatronics|servos|automata|automation|factory|assembly|motor|drone|payload|kinematics)\b/g) * 3.0,
      security: countMatches(/\b(security|firewall|exploit|cve|penetration|pentest|breach|vulnerability|malware|alert|intruder|intrusion|threat|attack|defense|kali|snort|suricata|guard|auth|token)\b/g) * 3.0,
      creative: countMatches(/\b(creative|art|artist|painting|draw|music|harmony|melody|poetic|poetry|aesthetic|dream|dreams|beauty|vision|concept|imagination|vibrant)\b/g) * 2.8,
      alarm: countMatches(/\b(alarm|danger|warning|critical|emergency|shatter|panic|fatal|destroy|error|damage|crash|overheat|meltdown)\b/g) * 4.0,
      tranquil: countMatches(/\b(calm|peace|peaceful|relax|relaxation|zen|meditate|meditation|serene|tranquility|breath|breathing|sleep|gentle|soft|quiet|solfeggio)\b/g) * 3.0,
      inspection: countMatches(/\b(inspect|inspection|diagnostics|telemetry|audit|sensors?|hardware|health|status)\b/g) * 3.6,
    };

    // Determine highest scoring domain
    let topDomain: keyof typeof scores = 'technology';
    let maxScore = 0;

    for (const [domain, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        topDomain = domain as keyof typeof scores;
      }
    }

    // Default to analytical if score is low
    if (maxScore < 2) {
      if (text.includes('?')) {
        topDomain = 'technology';
      } else {
        topDomain = 'technology';
      }
    }

    const state = this.createStateForDomain(topDomain, maxScore);
    const matched = state.matchedKeywords.filter(k => text.includes(k));
    if (matched.length > 0) {
      state.matchedKeywords = matched;
    }
    return state;
  }

  public createStateForDomain(domain: string, score = 3): NeuralityState {
    switch (domain) {
      case 'nature':
        return {
          domain: 'nature',
          topology: 'forest',
          sentiment: 'nature',
          primaryColor: '#10b981',    // Lush Emerald
          secondaryColor: '#f59e0b',  // Sunlit Amber
          speed: 0.8,
          gravity: 0.9,
          turbulence: 0.4,
          voiceProfile: 'nature_gaia',
          voicePitch: 1.05,
          voiceRate: 0.92,
          floatingGlyph: '🍃',
          speechTone: 'Organic & Serene',
          deliveryTone: 'Organic & Serene',
          synthesisReply: 'Living biophilic canopy online. Environmental shaders shifted to botanical forest.',
          matchedKeywords: ['nature', 'forest', 'tree', 'organic'],
          textStyle: {
            fontFamily: 'Georgia, "Playfair Display", serif',
            primaryColor: '#10b981',
            accentColor: '#34d399',
            glowColor: 'rgba(16, 185, 129, 0.65)',
            borderStyle: 'organic',
            tag: 'BIOPHILIC CANOPY',
          },
          confidence: Math.min(1.0, 0.6 + score * 0.1),
        };

      case 'technology':
        return {
          domain: 'technology',
          topology: 'cybercity',
          sentiment: 'cyberpunk',
          primaryColor: '#00f2ff',    // Cyber Cyan
          secondaryColor: '#f43f5e',  // Neon Rose
          speed: 1.5,
          gravity: 1.3,
          turbulence: 0.8,
          voiceProfile: 'cyber_synth',
          voicePitch: 0.88,
          voiceRate: 1.18,
          floatingGlyph: '⚡',
          speechTone: 'Synthetic & High-Throughput',
          deliveryTone: 'Synthetic & High-Throughput',
          synthesisReply: 'Cybernetic core online. Rendering high-density neon metropolis and traffic grid.',
          matchedKeywords: ['technology', 'cyber', 'code', 'matrix', 'terminal'],
          textStyle: {
            fontFamily: '"Fira Code", monospace',
            primaryColor: '#00f2ff',
            accentColor: '#f43f5e',
            glowColor: 'rgba(0, 242, 255, 0.75)',
            borderStyle: 'cyber',
            tag: 'CYBERCITY PROTOCOL',
          },
          confidence: Math.min(1.0, 0.6 + score * 0.1),
        };

      case 'cosmic':
        return {
          domain: 'cosmic',
          topology: 'galaxy',
          sentiment: 'cosmic',
          primaryColor: '#a855f7',    // Deep Violet
          secondaryColor: '#38bdf8',  // Cosmic Blue
          speed: 1.2,
          gravity: 1.6,
          turbulence: 0.7,
          voiceProfile: 'quantum',
          voicePitch: 1.25,
          voiceRate: 0.96,
          floatingGlyph: '∞',
          speechTone: 'Resonant & Ethereal',
          deliveryTone: 'Resonant & Ethereal',
          synthesisReply: 'Celestial manifold opened. Aligning gravitational field with galactic core.',
          matchedKeywords: ['cosmic', 'space', 'galaxy', 'universe', 'stellar'],
          textStyle: {
            fontFamily: '"Orbitron", sans-serif',
            primaryColor: '#a855f7',
            accentColor: '#c084fc',
            glowColor: 'rgba(168, 85, 247, 0.7)',
            borderStyle: 'stellar',
            tag: 'CELESTIAL MANIFOLD',
          },
          confidence: Math.min(1.0, 0.6 + score * 0.1),
        };

      case 'quantum':
        return {
          domain: 'quantum',
          topology: 'tesseract',
          sentiment: 'analytical',
          primaryColor: '#00f2ff',
          secondaryColor: '#ffd700',
          speed: 1.3,
          gravity: 1.1,
          turbulence: 0.5,
          voiceProfile: 'quantum',
          voicePitch: 1.2,
          voiceRate: 1.05,
          floatingGlyph: 'Ψ',
          speechTone: 'Crystalline & Analytical',
          deliveryTone: 'Crystalline & Analytical',
          synthesisReply: 'Quantum superposition resolved. Tesseract projection and phase vectors stabilized.',
          matchedKeywords: ['quantum', 'qubit', 'physics', 'math'],
          textStyle: {
            fontFamily: '"JetBrains Mono", monospace',
            primaryColor: '#38bdf8',
            accentColor: '#fbbf24',
            glowColor: 'rgba(56, 189, 248, 0.6)',
            borderStyle: 'crystalline',
            tag: 'QUANTUM 4D MATRIX',
          },
          confidence: Math.min(1.0, 0.6 + score * 0.1),
        };

      case 'biology':
        return {
          domain: 'biology',
          topology: 'dna',
          sentiment: 'creative',
          primaryColor: '#059669',
          secondaryColor: '#ec4899',
          speed: 1.1,
          gravity: 1.0,
          turbulence: 0.6,
          voiceProfile: 'tranquil',
          voicePitch: 1.1,
          voiceRate: 1.0,
          floatingGlyph: '🧬',
          speechTone: 'Organic & Adaptive',
          deliveryTone: 'Organic & Adaptive',
          synthesisReply: 'Biomolecular transcription active. Double-helix strands synthesized in vector space.',
          matchedKeywords: ['biology', 'dna', 'protein', 'cell'],
          textStyle: {
            fontFamily: 'system-ui, sans-serif',
            primaryColor: '#10b981',
            accentColor: '#f43f5e',
            glowColor: 'rgba(16, 185, 129, 0.5)',
            borderStyle: 'organic',
            tag: 'GENETIC TRANSCRIPTION',
          },
          confidence: Math.min(1.0, 0.6 + score * 0.1),
        };

      case 'robotics':
        return {
          domain: 'robotics',
          topology: 'robotics_lab',
          sentiment: 'analytical',
          primaryColor: '#60a5fa',
          secondaryColor: '#f59e0b',
          speed: 1.4,
          gravity: 1.2,
          turbulence: 0.5,
          voiceProfile: 'cyber',
          voicePitch: 0.9,
          voiceRate: 1.1,
          floatingGlyph: '🤖',
          speechTone: 'Mechanized & Precise',
          deliveryTone: 'Mechanized & Precise',
          synthesisReply: 'Robotic telemetry online. Servo kinematics and spatial sensors calibrated.',
          matchedKeywords: ['robotics', 'robot', 'automation', 'drone'],
          textStyle: {
            fontFamily: '"Fira Code", monospace',
            primaryColor: '#60a5fa',
            accentColor: '#f59e0b',
            glowColor: 'rgba(96, 165, 250, 0.6)',
            borderStyle: 'cyber',
            tag: 'ROBOTICS TELEMETRY',
          },
          confidence: Math.min(1.0, 0.6 + score * 0.1),
        };

      case 'security':
      case 'alarm':
        return {
          domain: 'security',
          topology: 'singularity',
          sentiment: 'alarm',
          primaryColor: '#ef4444',
          secondaryColor: '#f97316',
          speed: 2.5,
          gravity: 2.8,
          turbulence: 1.9,
          voiceProfile: 'alarm_urgent',
          voicePitch: 1.35,
          voiceRate: 1.25,
          floatingGlyph: '⚠',
          speechTone: 'Critical Warning & Alert',
          deliveryTone: 'Critical Warning & Alert',
          synthesisReply: 'Security alert status confirmed. Singularity defense barrier established.',
          matchedKeywords: ['security', 'alert', 'breach', 'firewall', 'threat'],
          textStyle: {
            fontFamily: '"Orbitron", monospace',
            primaryColor: '#ef4444',
            accentColor: '#f97316',
            glowColor: 'rgba(239, 68, 68, 0.85)',
            borderStyle: 'hazard',
            tag: 'CRITICAL SECURITY DEFENSE',
          },
          confidence: Math.min(1.0, 0.7 + score * 0.1),
        };

      case 'tranquil':
        return {
          domain: 'nature',
          topology: 'torus',
          sentiment: 'tranquil',
          primaryColor: '#10b981',
          secondaryColor: '#06b6d4',
          speed: 0.6,
          gravity: 0.8,
          turbulence: 0.2,
          voiceProfile: 'nature_gaia',
          voicePitch: 1.0,
          voiceRate: 0.85,
          floatingGlyph: '☯',
          speechTone: 'Harmonic Equilibrium',
          deliveryTone: 'Harmonic Equilibrium',
          synthesisReply: 'Harmonic equilibrium engaged. Restoring calm resonant frequency.',
          matchedKeywords: ['tranquil', 'calm', 'peace', 'meditation'],
          textStyle: {
            fontFamily: 'serif',
            primaryColor: '#34d399',
            accentColor: '#38bdf8',
            glowColor: 'rgba(52, 211, 153, 0.5)',
            borderStyle: 'organic',
            tag: 'EQUILIBRIUM HARMONIC',
          },
          confidence: Math.min(1.0, 0.7 + score * 0.1),
        };

      case 'inspection':
        return {
          domain: 'inspection',
          topology: 'neural',
          sentiment: 'analytical',
          primaryColor: '#38bdf8',
          secondaryColor: '#34d399',
          speed: 1.0,
          gravity: 1.0,
          turbulence: 0.3,
          voiceProfile: 'natch',
          voicePitch: 1.0,
          voiceRate: 1.0,
          floatingGlyph: '🔍',
          speechTone: 'Natch Natural Telemetry',
          deliveryTone: 'Grounded & Conversational',
          synthesisReply: 'Running system inspection. Audio sensors, node telemetry, and security protocols verified.',
          matchedKeywords: ['inspect', 'inspection', 'diagnostics', 'telemetry', 'sensors'],
          textStyle: {
            fontFamily: '"Fira Code", monospace',
            primaryColor: '#38bdf8',
            accentColor: '#10b981',
            glowColor: 'rgba(56, 189, 248, 0.65)',
            borderStyle: 'crystalline',
            tag: 'TELEMETRY INSPECT',
          },
          confidence: 0.95,
        };

      case 'creative':
      default:
        return {
          domain: 'creative',
          topology: 'spindle',
          sentiment: 'creative',
          primaryColor: '#c084fc',
          secondaryColor: '#38bdf8',
          speed: 1.3,
          gravity: 1.0,
          turbulence: 1.0,
          voiceProfile: 'gemini_female',
          voicePitch: 1.15,
          voiceRate: 1.02,
          floatingGlyph: '✨',
          speechTone: 'Creative & Fluid',
          deliveryTone: 'Creative & Fluid',
          synthesisReply: 'Creative cognitive matrix active. Transforming geometry into dynamic spindle structure.',
          matchedKeywords: ['creative', 'art', 'music', 'design'],
          textStyle: {
            fontFamily: '"Orbitron", sans-serif',
            primaryColor: '#c084fc',
            accentColor: '#38bdf8',
            glowColor: 'rgba(192, 132, 252, 0.6)',
            borderStyle: 'stellar',
            tag: 'CREATIVE SYNAPSE',
          },
          confidence: 0.7,
        };
    }
  }

  /**
   * Applies neurality state directly to the active EnvironmentState and audioVoiceService
   */
  public applyState(
    arg1: Partial<NeuralityState> | React.Dispatch<React.SetStateAction<EnvironmentState>>,
    arg2?: Partial<NeuralityState> | React.Dispatch<React.SetStateAction<EnvironmentState>>
  ): NeuralityState {
    let newState: Partial<NeuralityState> = {};
    let setEnvState: React.Dispatch<React.SetStateAction<EnvironmentState>> | undefined;

    if (typeof arg1 === 'function') {
      setEnvState = arg1 as React.Dispatch<React.SetStateAction<EnvironmentState>>;
      newState = (arg2 as Partial<NeuralityState>) || {};
    } else {
      newState = (arg1 as Partial<NeuralityState>) || {};
      if (typeof arg2 === 'function') {
        setEnvState = arg2 as React.Dispatch<React.SetStateAction<EnvironmentState>>;
      }
    }

    this.currentState = { ...this.currentState, ...newState };

    // Automatically configure audio voice service
    if (this.currentState.voiceProfile) {
      audioVoiceService.setVoiceProfile(this.currentState.voiceProfile);
    }
    if (this.currentState.voicePitch || this.currentState.voiceRate) {
      audioVoiceService.setVoiceParams(this.currentState.voicePitch, this.currentState.voiceRate);
    }

    // Apply to environment state
    if (setEnvState) {
      setEnvState((prev) => ({
        ...prev,
        topology: this.currentState.topology,
        sentiment: this.currentState.sentiment,
        primaryColor: this.currentState.primaryColor,
        secondaryColor: this.currentState.secondaryColor,
        speed: this.currentState.speed,
        gravity: this.currentState.gravity,
        turbulence: this.currentState.turbulence,
        floatingGlyph: this.currentState.floatingGlyph,
        voiceProfile: this.currentState.voiceProfile,
        voicePitch: this.currentState.voicePitch,
        voiceRate: this.currentState.voiceRate,
        activeSpeechTone: this.currentState.speechTone,
      }));
    }

    this.notify();
    return this.currentState;
  }
}

export const neuralityEngine = new NeuralityEngine();
