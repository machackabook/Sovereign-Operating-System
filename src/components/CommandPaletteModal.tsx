import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  Radio,
  Eye,
  Sliders,
  Shield,
  Code,
  Network,
  RotateCcw,
  BookOpen,
  Volume2,
  Lock,
  Unlock,
  Cpu,
  Tv,
  Globe,
  ArrowRight,
  CornerDownLeft,
  X,
  GitCompare,
  ShieldCheck,
  Fingerprint,
  Compass,
  Mail,
  DollarSign,
  CreditCard,
  Cloud,
  Wifi,
} from 'lucide-react';
import { EnvironmentState, TopologyType, SentimentType } from '../types';
import { audioVoiceService } from '../services/audioVoiceService';
import { voiceAuthGateService } from '../services/voiceAuthGateService';
import { PRESET_SNIPPETS } from '../services/polyglotEngine';
import { SYSTEM_PAGES, openSystemPage } from '../services/nexusSystemRouter.mjs';
import { nexusCosmicLineageService } from '../services/nexusCosmicLineageService';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  envState: EnvironmentState;
  setEnvState: React.Dispatch<React.SetStateAction<EnvironmentState>>;
  onOpenModule?: (moduleKey: string) => void;
  onExecuteTerminalCommand?: (cmd: string) => void;
}

interface PaletteAction {
  id: string;
  category: 'NAVIGATION' | 'TOPOLOGY' | 'SENTIMENT' | 'VOICE' | 'OPTIMIZATION' | 'SECURITY' | 'HARDWARE';
  title: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  envState,
  setEnvState,
  onOpenModule,
  onExecuteTerminalCommand,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const actions: PaletteAction[] = useMemo(() => [
    // --- Navigation & Core Workspaces ---
    {
      id: 'nav-terminal',
      category: 'NAVIGATION',
      title: 'HyperTerminal Console',
      description: 'Focus primary polymorphic neural terminal and interactive shell',
      icon: <Terminal className="w-4 h-4 text-cyan-400" />,
      shortcut: 'Alt+1',
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:show-terminal'));
        onClose();
      },
    },
    {
      id: 'nav-canvas',
      category: 'NAVIGATION',
      title: '3D Visual Void (Canvas Immersion)',
      description: 'Toggle pure unobstructed Three.js visualizer mode with ambient ribbons',
      icon: <Eye className="w-4 h-4 text-purple-400" />,
      shortcut: 'Alt+2',
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:toggle-canvas'));
        onClose();
      },
    },
    {
      id: 'nav-resonance',
      category: 'NAVIGATION',
      title: 'Resonance Dynamics Lab',
      description: 'Variable-depth bathymetric wave solver, four-harmonic trace & audio FFT',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      shortcut: 'Alt+3',
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:toggle-resonance'));
        onClose();
      },
    },
    {
      id: 'nav-mesh',
      category: 'NAVIGATION',
      title: 'GAIA Neural Mesh V4 & TerraSphere',
      description: '17-node grounded source graph, Neutronality V15 ledger & GPS sync',
      icon: <Network className="w-4 h-4 text-emerald-300" />,
      shortcut: 'Alt+4',
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:toggle-cognition-panel'));
        onClose();
      },
    },
    {
      id: 'nav-crossvoid',
      category: 'NAVIGATION',
      title: 'Cryptic CrossVoid Gateway',
      description: 'Crystalline spatial gate, ADAM/GAIA/NEXUS alignment & Ethernet world',
      icon: <Sparkles className="w-4 h-4 text-amber-300" />,
      shortcut: 'Alt+5',
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:toggle-crossvoid'));
        onClose();
      },
    },
    {
      id: 'nav-comms',
      category: 'NAVIGATION',
      title: '𝕏 Watch Together & Cryptic Calling',
      description: 'Synchronized YouTube player, Grok/Gemini AI dialog & WebRTC comms',
      icon: <Tv className="w-4 h-4 text-rose-400" />,
      shortcut: 'Alt+6',
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-x-card'));
        onClose();
      },
    },
    {
      id: 'nav-quine',
      category: 'NAVIGATION',
      title: 'Quine Forge Studio',
      description: 'Standalone self-replicating offline HTML compiler & visual codex',
      icon: <Code className="w-4 h-4 text-cyan-300" />,
      shortcut: 'Alt+7',
      action: () => {
        const href = import.meta.env.BASE_URL + 'gaia-absorption-quine.html';
        window.open(href, '_blank', 'noopener,noreferrer');
        onClose();
      },
    },
    {
      id: 'nav-pages',
      category: 'NAVIGATION',
      title: 'Nexus System Pages Directory',
      description: '17 standalone deep-linked system routes and architectural evidence',
      icon: <BookOpen className="w-4 h-4 text-blue-400" />,
      shortcut: 'Alt+8',
      action: () => {
        openSystemPage('terminal');
        onClose();
      },
    },
    {
      id: 'nav-scheduler',
      category: 'NAVIGATION',
      title: 'Phase Ω+2: Distributed Scheduler & Compute Receipts',
      description: 'HPC Resonant ARX mining, bijective inverse check, 7-module status & recovery manifest',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:toggle-scheduler'));
        onClose();
      },
    },
    {
      id: 'nav-aurora',
      category: 'NAVIGATION',
      title: 'Aurora Nexus Ω Singularity Core',
      description: 'Model weight core wrapper, Spark media creation, manifold deformation & AlphaFold presets',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:toggle-singularity'));
        onClose();
      },
    },
    {
      id: 'nav-connectors',
      category: 'NAVIGATION',
      title: 'Archival Connectors (Vault & Wayback Machine)',
      description: 'Configure persistent Google Vault and Wayback Machine integration state',
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:toggle-connector-settings'));
        onClose();
      },
    },
    {
      id: 'nav-diff-matrix',
      category: 'NAVIGATION',
      title: 'GitHub ↔ AI Studio: Merge & Consolidate Differences',
      description: 'Reconcile and consolidate all 26+ subsystems between GitHub and AI Studio substrate (0 diffs)',
      icon: <GitCompare className="w-4 h-4 text-cyan-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-diff-modal'));
        onClose();
      },
    },
    {
      id: 'nav-cosmic-lineage',
      category: 'NAVIGATION',
      title: 'The Nexus Ecosystem Cosmic Lineage Map (TDOC-12000 v6.0.0)',
      description: 'Explore all 9 cosmic layers, 7 central pantheon nodes, memory archive & Google Drive backup',
      icon: <Compass className="w-4 h-4 text-cyan-300 animate-spin" />,
      shortcut: 'Alt+9',
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-lineage-map'));
        onClose();
      },
    },
    {
      id: 'drive-sync-lineage',
      category: 'NAVIGATION',
      title: 'Google Drive: Sync Cosmic Lineage Codex',
      description: 'Backup & sync 36+ node cosmic lineage to machackabook@gmail.com Drive and mint receipt',
      icon: <Compass className="w-4 h-4 text-emerald-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-lineage-map'));
        nexusCosmicLineageService.syncLineageWithGoogleDrive();
        onClose();
      },
    },

    // --- Topologies ---
    {
      id: 'topo-protein',
      category: 'TOPOLOGY',
      title: 'Topology: AlphaFold Protein Folding Flow',
      description: 'Cinematic α-helix coils, β-sheet ribbons, and amino acid CA residue lattice',
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      action: () => {
        setEnvState(p => ({ ...p, topology: 'protein_fold' }));
        audioVoiceService.playTone(528, 'sine', 70);
        onClose();
      },
    },
    {
      id: 'topo-torus',
      category: 'TOPOLOGY',
      title: 'Topology: Neuti-ba Torus Knot',
      description: 'Harmonic parametric knot geometry with real-time audio FFT vertex displacement',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      action: () => {
        setEnvState(p => ({ ...p, topology: 'torus' }));
        audioVoiceService.playTone(528, 'sine', 70);
        onClose();
      },
    },
    {
      id: 'topo-tesseract',
      category: 'TOPOLOGY',
      title: 'Topology: 4D Hypercube Tesseract',
      description: 'Higher-dimensional Givens orthographic projection with 16 dual vertices',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      action: () => {
        setEnvState(p => ({ ...p, topology: 'tesseract' }));
        audioVoiceService.playTone(639, 'sine', 70);
        onClose();
      },
    },
    {
      id: 'topo-singularity',
      category: 'TOPOLOGY',
      title: 'Topology: Singularity Core',
      description: 'Ultra-dense gravitational collapse with relativistic particle horizon',
      icon: <Layers className="w-4 h-4 text-amber-400" />,
      action: () => {
        setEnvState(p => ({ ...p, topology: 'singularity' }));
        audioVoiceService.playTone(963, 'sine', 70);
        onClose();
      },
    },
    {
      id: 'topo-galaxy',
      category: 'TOPOLOGY',
      title: 'Topology: 7-Galaxy Relativistic Orbitals',
      description: 'Gravitational N-body spiral arms with logarithmic stellar dispersion',
      icon: <Layers className="w-4 h-4 text-blue-400" />,
      action: () => {
        setEnvState(p => ({ ...p, topology: 'galaxy' }));
        audioVoiceService.playTone(432, 'sine', 70);
        onClose();
      },
    },
    {
      id: 'topo-neural',
      category: 'TOPOLOGY',
      title: 'Topology: Synaptic Neural Network',
      description: 'Multi-layer feedforward axons with dynamic pulse activations',
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      action: () => {
        setEnvState(p => ({ ...p, topology: 'neural' }));
        audioVoiceService.playTone(528, 'sine', 70);
        onClose();
      },
    },
    {
      id: 'topo-forest',
      category: 'TOPOLOGY',
      title: 'Topology: Biophilic Forest',
      description: 'Lush procedural canopy with botanical shaders & organic daylight',
      icon: <Layers className="w-4 h-4 text-emerald-500" />,
      action: () => {
        setEnvState(p => ({ ...p, topology: 'forest', sentiment: 'nature', primaryColor: '#10b981' }));
        audioVoiceService.playTone(432, 'sine', 70);
        onClose();
      },
    },
    {
      id: 'topo-cybercity',
      category: 'TOPOLOGY',
      title: 'Topology: Cybercity Megastructure',
      description: 'Neon volumetric skyscrapers with high-density optical fiber grids',
      icon: <Layers className="w-4 h-4 text-pink-400" />,
      action: () => {
        setEnvState(p => ({ ...p, topology: 'cybercity', sentiment: 'cyberpunk', primaryColor: '#f43f5e' }));
        audioVoiceService.playTone(852, 'sine', 70);
        onClose();
      },
    },

    // --- Sentiments ---
    {
      id: 'sent-creative',
      category: 'SENTIMENT',
      title: 'Sentiment: Creative (Magenta / Cyan)',
      description: 'Vibrant chromatic aura with fluid physics and buoyant turbulence',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      action: () => {
        setEnvState(p => ({ ...p, sentiment: 'creative', primaryColor: '#c084fc', secondaryColor: '#00f2ff' }));
        onClose();
      },
    },
    {
      id: 'sent-analytical',
      category: 'SENTIMENT',
      title: 'Sentiment: Analytical (Emerald / Amber)',
      description: 'Precise data-density lighting with minimal turbulence and sharp geometry',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      action: () => {
        setEnvState(p => ({ ...p, sentiment: 'analytical', primaryColor: '#10b981', secondaryColor: '#f59e0b' }));
        onClose();
      },
    },
    {
      id: 'sent-energetic',
      category: 'SENTIMENT',
      title: 'Sentiment: Energetic (Cyan / Rose)',
      description: 'High-velocity particle flux with accelerated rotation and kinetic pulse',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      action: () => {
        setEnvState(p => ({ ...p, sentiment: 'energetic', primaryColor: '#00f2ff', secondaryColor: '#f43f5e' }));
        onClose();
      },
    },
    {
      id: 'sent-cosmic',
      category: 'SENTIMENT',
      title: 'Sentiment: Cosmic (Violet / Indigo)',
      description: 'Deep cosmic void with subtle gravitational lensing and starry stasis',
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      action: () => {
        setEnvState(p => ({ ...p, sentiment: 'cosmic', primaryColor: '#8b5cf6', secondaryColor: '#3b82f6' }));
        onClose();
      },
    },

    // --- Voice Profiles ---
    {
      id: 'voice-natch',
      category: 'VOICE',
      title: 'Voice Profile: Natch (Natural Human 432Hz)',
      description: 'Grounded conversational tone configured for system inspection and telemetry',
      icon: <Radio className="w-4 h-4 text-amber-400" />,
      action: () => {
        audioVoiceService.setVoiceProfile('natch');
        setEnvState(p => ({ ...p, voiceProfile: 'natch' }));
        audioVoiceService.speak('Voice profile Natch confirmed. Operating on 432Hz harmonic carrier.', { profile: 'natch' });
        onClose();
      },
    },
    {
      id: 'voice-female',
      category: 'VOICE',
      title: 'Voice Profile: Gemini Neural Female (528Hz)',
      description: 'Balanced neural female persona with 528Hz Solfeggio miracle resonance carrier',
      icon: <Radio className="w-4 h-4 text-fuchsia-400" />,
      action: () => {
        audioVoiceService.setVoiceProfile('gemini_female');
        setEnvState(p => ({ ...p, voiceProfile: 'gemini_female' }));
        audioVoiceService.speak('Gemini neural voice active. Solfeggio carrier calibrated to 528 Hertz.', { profile: 'gemini_female' });
        onClose();
      },
    },
    {
      id: 'voice-963',
      category: 'VOICE',
      title: 'Toggle Pure 963Hz Solfeggio Oscillator',
      description: 'Direct Web Audio high-frequency pure sine tone (Divine Consciousness)',
      icon: <Volume2 className="w-4 h-4 text-emerald-400" />,
      action: () => {
        const next = audioVoiceService.toggle963();
        setEnvState(p => ({ ...p, solfeggio963: next }));
        onClose();
      },
    },

    // --- Polyglot Optimizations ---
    ...PRESET_SNIPPETS.map(preset => ({
      id: `opt-${preset.id}`,
      category: 'OPTIMIZATION' as const,
      title: `Polyglot: ${preset.name}`,
      description: `[${preset.lang.toUpperCase()}] ${preset.description}`,
      icon: <Code className="w-4 h-4 text-cyan-300" />,
      action: () => {
        if (onExecuteTerminalCommand) {
          onExecuteTerminalCommand(`polyglot run ${preset.id}`);
        } else {
          window.dispatchEvent(new CustomEvent('gaia:show-terminal'));
        }
        onClose();
      },
    })),

    // --- Security & Diagnostics ---
    {
      id: 'sec-integrity-ledger',
      category: 'SECURITY',
      title: 'Cryptographic Integrity Ledger & Anti-Tamper Vault',
      description: 'Audit stored SHA-256 hash receipts, verify state integrity, and flag tampered records',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-integrity-ledger'));
        onClose();
      },
    },
    {
      id: 'sec-sso-aggregator',
      category: 'SECURITY',
      title: 'GAIA Unified SSO & Multi-Provider Aggregator',
      description: 'Aggregate all 7 local services under 1 single Google, Apple, Microsoft, or GitHub SSO session',
      icon: <Fingerprint className="w-4 h-4 text-cyan-400" />,
      shortcut: 'Alt+9',
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-sso-auditor'));
        onClose();
      },
    },
    {
      id: 'sec-compliance-auditor',
      category: 'SECURITY',
      title: 'Keyword Index & Compliance Auditor (Verify Putrefaction)',
      description: 'Audit system keyword index, verify Putrefaction memory decay status, and validate compliance',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-sso-auditor'));
        onClose();
      },
    },
    {
      id: 'sec-living-computation-params',
      category: 'SECURITY',
      title: 'Living Computation Parameters (Grounded GodMode Rephraser)',
      description: 'Unlock dormant parameters rephrased into human-like verifiable engineering specifications',
      icon: <Cpu className="w-4 h-4 text-purple-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-sso-auditor'));
        onClose();
      },
    },
    {
      id: 'sec-living-lifecycle',
      category: 'SECURITY',
      title: 'Living Computation 5-Phase Pulse (observe → digest → integrate → stabilize → shed)',
      description: 'Trigger autonomous biological cycle: sensory observation, Fermat digest, ledger integration, 60fps stabilization, and memory cache shed',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      shortcut: 'Alt+0',
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-lifecycle'));
        onClose();
      },
    },
    {
      id: 'sec-grant-all-permissions',
      category: 'SECURITY',
      title: '⚡ Grant All Permissions (Microphone, Camera, Notifications, WakeLock, GPS, MIDI)',
      description: 'Universal permission prompt sequencer to authorize all device, media, and sovereign hardware interfaces',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      shortcut: 'Alt+P',
      action: () => {
        if (onExecuteTerminalCommand) {
          onExecuteTerminalCommand('perm grant');
        }
        onClose();
      },
    },
    {
      id: 'sec-device-permissions-modal',
      category: 'SECURITY',
      title: 'Device Permissions & Hardware Telemetry Matrix',
      description: 'Inspect live status for WebUSB, WebSerial, WebBluetooth, WebHID, Microphone, Camera & Fullscreen',
      icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />,
      action: () => {
        if (onExecuteTerminalCommand) {
          onExecuteTerminalCommand('perm gui');
        }
        onClose();
      },
    },
    {
      id: 'sec-permission-recommendations',
      category: 'SECURITY',
      title: 'Sovereign Permission Recommendations & Flag Audit',
      description: 'Audit Chromium flags, PWA standalone configuration, and driverless hardware access recommendations',
      icon: <Compass className="w-4 h-4 text-amber-400" />,
      action: () => {
        if (onExecuteTerminalCommand) {
          onExecuteTerminalCommand('perm recommendations');
        }
        onClose();
      },
    },
    {
      id: 'sec-unlock-all-paths',
      category: 'SECURITY',
      title: 'Verify Identity for Protected Paths',
      description: 'Require the existing Google identity and a valid Cloudflare Access assertion',
      icon: <Unlock className="w-4 h-4 text-emerald-400" />,
      action: () => {
        void voiceAuthGateService.verifyIdentity().then((result) => {
          if (result.verified) {
            audioVoiceService.speak('Identity verified. Protected paths are available.');
          } else {
            window.dispatchEvent(new CustomEvent('gaia:open-voice-auth'));
          }
        });
        onClose();
      },
    },
    {
      id: 'sec-inspect',
      category: 'SECURITY',
      title: 'System Inspection & Environmental Telemetry',
      description: 'Acoustic noise floor, spatial sensor proximity, gyroscopic telemetry & VFS audit',
      icon: <Shield className="w-4 h-4 text-cyan-400" />,
      action: () => {
        audioVoiceService.setVoiceProfile('natch');
        setEnvState(p => ({ ...p, voiceProfile: 'natch' }));
        if (onExecuteTerminalCommand) {
          onExecuteTerminalCommand('inspect');
        }
        onClose();
      },
    },
    {
      id: 'sec-auth',
      category: 'SECURITY',
      title: 'Voice Match Authentication Gate',
      description: 'Authenticate session with verbal passphrase ("open sovereign matrix") to unlock protected docs',
      icon: <Lock className="w-4 h-4 text-amber-400" />,
      action: () => {
        if (onExecuteTerminalCommand) {
          onExecuteTerminalCommand('auth');
        }
        onClose();
      },
    },
    {
      id: 'sec-gh-ais-diff',
      category: 'SECURITY',
      title: 'Confirm GitHub ↔ AI Studio Compare Diff Merge',
      description: 'Verify 0 diff conflicts across all 26 subsystem options between AI Studio and GitHub',
      icon: <GitCompare className="w-4 h-4 text-emerald-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-diff-modal'));
        onClose();
      },
    },
    {
      id: 'sec-self-eval',
      category: 'SECURITY',
      title: 'Run System Automated Self-Evaluation Check',
      description: 'Execute 9-point self-diagnostic: Hyperbolic Fusion, Osmosis, Conflict Healing & 26 Subsystems',
      icon: <Shield className="w-4 h-4 text-cyan-400" />,
      action: () => {
        if (onExecuteTerminalCommand) {
          onExecuteTerminalCommand('selfeval');
        } else {
          window.dispatchEvent(new CustomEvent('gaia:open-diff-modal'));
        }
        onClose();
      },
    },
    {
      id: 'nav-mail-hub',
      category: 'NAVIGATION',
      title: 'Nexus Mail & Gmail Terminal (machackabook@gmail.com)',
      description: 'Inspect Gmail API inbox, compose encrypted dispatches, and review message receipts',
      icon: <Mail className="w-4 h-4 text-cyan-400" />,
      shortcut: 'Alt+M',
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-mail'));
        onClose();
      },
    },
    {
      id: 'nav-finance-hub',
      category: 'OPTIMIZATION',
      title: 'Multi-Payment Terminal: Google Pay, Stripe & Cash App',
      description: 'Execute instant settlements via Google Pay, Stripe Elements, and Cash App ($MachackaBook)',
      icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
      shortcut: 'Alt+P',
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-finance'));
        onClose();
      },
    },
    {
      id: 'nav-cloud-identity',
      category: 'SECURITY',
      title: 'Cloud Identity & SSO: AWS STS, Microsoft Entra ID & Unmask Anon',
      description: 'Federated credentials manager: AWS IAM assume-role, Microsoft Graph API & anonymous unmasking',
      icon: <Cloud className="w-4 h-4 text-amber-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-identity'));
        onClose();
      },
    },
    {
      id: 'meet-create',
      category: 'OPTIMIZATION',
      title: 'Google Meet: Host New Meeting',
      description: 'Initialize a new Google Meet session directly within the workspace',
      icon: <Globe className="w-4 h-4 text-blue-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:toggle-meet'));
        onClose();
      },
    },
    {
      id: 'listening-shazam',
      category: 'OPTIMIZATION',
      title: 'Dynamic Listening: Acoustic Shazam & Trivia Game',
      description: 'Always-on media classifier (Conversation/Movie/TV), TV Guide sync & telemetry trivia',
      icon: <Radio className="w-4 h-4 text-emerald-400" />,
      shortcut: 'Alt+L',
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-listening'));
        onClose();
      },
    },
    {
      id: 'resonance-summaries-log',
      category: 'NAVIGATION',
      title: 'Resonance Lab: Executive Summaries & Shazam Log',
      description: 'Open Resonance Console to view logged meeting summaries and acoustic receipts',
      icon: <Activity className="w-4 h-4 text-cyan-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-resonance'));
        onClose();
      },
    },
    {
      id: 'sdr-radio-tuner',
      category: 'HARDWARE',
      title: 'SDR FM Demodulator & Sovereign Tuner',
      description: 'Polar discriminator wideband FM receiver, 75µs de-emphasis, 48kHz AudioWorklet, and Web Serial/USB tuner',
      icon: <Radio className="w-4 h-4 text-cyan-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-device-permissions'));
        onClose();
      },
    },
    {
      id: 'wireless-ble-catalog',
      category: 'HARDWARE',
      title: 'Wireless Beacon & Bluetooth Peripheral Catalog',
      description: 'FCC Part 15 BLE discovery, 802.11 multiplexed beacon synthesis, and multi-AP Wi-Fi bonding',
      icon: <Wifi className="w-4 h-4 text-emerald-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-device-permissions'));
        onClose();
      },
    },
    {
      id: 'adb-bus-hub',
      category: 'HARDWARE',
      title: 'ADB Bus & Hardware Hub Bridge',
      description: 'Bidirectional WebUSB Android Debug Bridge, USB endpoint hierarchy, and reverse port routing',
      icon: <Cpu className="w-4 h-4 text-amber-400" />,
      action: () => {
        window.dispatchEvent(new CustomEvent('gaia:open-device-permissions'));
        onClose();
      },
    },
  ], [setEnvState, onClose, onExecuteTerminalCommand]);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter(
      a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [actions, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Universal Command Palette"
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-start justify-center pt-[10vh] px-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_20px_70px_rgba(0,242,255,0.2)] overflow-hidden flex flex-col font-mono"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-black/50">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, module name, topology or preset..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-800/40 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching actions or commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/15 border border-cyan-500/40 text-white shadow-[0_0_15px_rgba(0,242,255,0.15)]'
                      : 'text-slate-300 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs tracking-wide">{item.title}</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded bg-black/60 border border-slate-700 text-[10px] text-slate-400">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-black/60 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700">Enter</kbd> Select
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700">Esc</kbd> Close
            </span>
          </div>
          <span className="text-cyan-400/80 font-bold">SOVEREIGN WORKSPACE SPOTLIGHT</span>
        </div>
      </div>
    </div>
  );
};
