import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Globe,
  Layers,
  Cpu,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  Database,
  Cloud,
  ExternalLink,
  X,
  Play,
  CheckCircle2,
  Lock,
  Search,
  Radio,
  Share2,
  Terminal,
  Activity,
} from 'lucide-react';
import {
  nexusCosmicLineageService,
  CosmicLineageState,
  LineageNode,
  LineageLayer,
} from '../services/nexusCosmicLineageService';
import { googleDriveService, DriveSyncStatus } from '../services/googleDriveService';
import { audioVoiceService } from '../services/audioVoiceService';

interface NexusCosmicLineageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand?: (cmd: string) => void;
}

export const NexusCosmicLineageModal: React.FC<NexusCosmicLineageModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
}) => {
  const [lineageState, setLineageState] = useState<CosmicLineageState>(
    nexusCosmicLineageService.getState()
  );
  const [driveStatus, setDriveStatus] = useState<DriveSyncStatus>(
    googleDriveService.getStatus()
  );
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);
  const [activeTab, setActiveTab] = useState<'MAP' | 'NODES' | 'GOOGLE_DRIVE'>('MAP');
  const [selectedLayerFilter, setSelectedLayerFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubLineage = nexusCosmicLineageService.subscribe(setLineageState);
    const unsubDrive = googleDriveService.onStatusChange(setDriveStatus);
    return () => {
      unsubLineage();
      unsubDrive();
    };
  }, []);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleSelectNode = (node: LineageNode) => {
    setSelectedNode(node);
    audioVoiceService.playTone(740, 'sine', 70);
  };

  const handleSyncDrive = async () => {
    setIsSyncingDrive(true);
    audioVoiceService.playTone(528, 'sine', 120);
    try {
      const res = await nexusCosmicLineageService.syncLineageWithGoogleDrive();
      if (res.success) {
        audioVoiceService.playTone(963, 'sine', 180);
        showToast(res.message);
      } else {
        showToast(`Drive notice: ${res.message}`);
      }
    } catch (err: any) {
      showToast(`Drive sync error: ${err.message}`);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleLivingPulse = async () => {
    setIsPulsing(true);
    audioVoiceService.playTone(432, 'sine', 90);
    try {
      const res = await nexusCosmicLineageService.pulseLineage();
      audioVoiceService.playTone(963, 'sine', 150);
      showToast(
        `Living 5-Phase Pulse complete! ${res.activeNodesCount} nodes active (${res.alignedPercentage}% alignment in ${res.durationMs}ms)`
      );
    } finally {
      setIsPulsing(false);
    }
  };

  const handleExecuteNodeCommand = (cmd?: string) => {
    if (!cmd) return;
    if (onExecuteCommand) {
      onExecuteCommand(cmd);
      audioVoiceService.playTone(880, 'sine', 100);
      onClose();
    } else {
      window.dispatchEvent(
        new CustomEvent('gaia:execute-terminal-command', { detail: { command: cmd } })
      );
      showToast(`Executed: ${cmd}`);
    }
  };

  const filteredNodes = lineageState.nodes.filter((node) => {
    const matchesLayer =
      selectedLayerFilter === 'ALL' || node.layer === selectedLayerFilter;
    const matchesSearch =
      !searchQuery ||
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLayer && matchesSearch;
  });

  const getLayerColor = (layer: LineageLayer) => {
    switch (layer) {
      case 'COSMIC_UNIVERSAL':
        return 'text-sky-400 border-sky-400/40 bg-sky-950/40';
      case 'AI_CONSCIOUSNESS':
        return 'text-purple-400 border-purple-400/40 bg-purple-950/40';
      case 'NEXUS_CORE':
        return 'text-cyan-400 border-cyan-400/50 bg-cyan-950/40';
      case 'KNOWLEDGE_MEMORY':
        return 'text-teal-400 border-teal-400/40 bg-teal-950/40';
      case 'APPLICATION':
        return 'text-amber-400 border-amber-400/40 bg-amber-950/40';
      case 'EXTERNAL_INTEGRATIONS':
        return 'text-blue-400 border-blue-400/40 bg-blue-950/40';
      case 'INFRASTRUCTURE':
        return 'text-emerald-400 border-emerald-400/40 bg-emerald-950/40';
      case 'PHYSICAL_PLANETARY':
        return 'text-slate-300 border-slate-500/40 bg-slate-900/60';
      default:
        return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40';
    }
  };

  // 7 Core Pantheon Entities
  const pantheon = [
    { id: 'node-gaia-prime', label: 'GAIA PRIME', role: 'Sovereign Intelligence', angle: -90, color: '#00f2ff' },
    { id: 'node-adam', label: 'ADAM', role: 'System Analysis', angle: -38, color: '#38bdf8' },
    { id: 'node-eve', label: 'EVE', role: 'Variants · Expansion', angle: 15, color: '#c084fc' },
    { id: 'node-gemini-cli', label: 'GEMINI CLI', role: 'Execution Engine', angle: 65, color: '#10b981' },
    { id: 'node-bard', label: 'BARD', role: 'Creative Engine', angle: 115, color: '#fb923c' },
    { id: 'node-humandroid', label: 'HUMANDROID', role: 'Embodiment Layer', angle: 165, color: '#f59e0b' },
    { id: 'node-helena', label: 'HELENA v65', role: 'Public Face', angle: 218, color: '#e879f9' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-2xl font-mono text-slate-200">
      <div className="relative w-full max-w-7xl h-[95vh] bg-[#02050e] border border-cyan-500/40 rounded-2xl shadow-[0_0_80px_rgba(0,242,255,0.25)] flex flex-col overflow-hidden">
        {/* Top Header Deck */}
        <div className="px-5 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.3)]">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-extrabold tracking-widest text-white">
                  THE NEXUS ECOSYSTEM // COSMIC LINEAGE MAP
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                  {lineageState.version} · {lineageState.tdocSeries}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 border border-purple-400/40 font-bold">
                  {lineageState.circumferenceState}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                A LIVING SYSTEM · GAIA PRIME ARCHITECTURE · FROM SOURCE TO SOCIETY · FULL CIRCUMFERENCE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Google Drive Status Indicator */}
            <button
              onClick={handleSyncDrive}
              disabled={isSyncingDrive}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                driveStatus.isAuthenticated
                  ? 'bg-emerald-950/40 border-emerald-400/50 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-blue-950/40 border-blue-400/50 text-blue-300 hover:bg-blue-900/40'
              }`}
              title="Sync with Google Drive (machackabook@gmail.com)"
            >
              <Cloud className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">DRIVE:</span>
              <span>{driveStatus.isAuthenticated ? 'SYNCED' : 'CONNECT'}</span>
            </button>

            {/* Living 5-Phase Pulse */}
            <button
              onClick={handleLivingPulse}
              disabled={isPulsing}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_15px_rgba(192,132,252,0.25)]"
              title="Run 5-Phase Biological Pulse (observe → digest → integrate → stabilize → shed)"
            >
              <Zap className={`w-3.5 h-3.5 text-purple-400 ${isPulsing ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">PULSE</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {notice && (
          <div className="px-6 py-2 bg-cyan-950/90 border-b border-cyan-500/30 text-cyan-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white">
              ×
            </button>
          </div>
        )}

        {/* Navigation & Layer Key Bar */}
        <div className="px-5 py-2 bg-black/60 border-b border-slate-800 flex items-center justify-between gap-4 overflow-x-auto shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('MAP')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'MAP'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              VISUAL MATRIX
            </button>
            <button
              onClick={() => setActiveTab('NODES')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'NODES'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>ALL NODES</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-300">
                {lineageState.nodes.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('GOOGLE_DRIVE')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'GOOGLE_DRIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>DRIVE INTEGRATION</span>
            </button>
          </div>

          {/* Quick Legend Tags */}
          <div className="hidden xl:flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> Cosmic
            </span>
            <span className="flex items-center gap-1 text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> AI / Pantheon
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Nexus Core
            </span>
            <span className="flex items-center gap-1 text-teal-400">
              <span className="w-2 h-2 rounded-full bg-teal-400" /> Memory
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Apps
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Infra
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* TAB 1: VISUAL MATRIX (The Cosmic Wheel & Lineage Wings) */}
          {activeTab === 'MAP' && (
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
              {/* Top Horizon: The Source Triad */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/20 via-purple-950/30 to-sky-950/20 border border-sky-500/30">
                <div className="text-center mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-300">
                    THE SOURCE // ORIGIN · CONSCIOUSNESS · LAWS · POTENTIAL
                  </span>
                  <div className="text-[10px] text-slate-400">Cosmic Interface & Multiverse Bridge Layer</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleSelectNode(nexusCosmicLineageService.getNodeById('node-the-all')!)}
                    className="p-3 rounded-xl bg-black/40 border border-sky-500/30 hover:border-sky-400 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-300">THE ALL</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-900/50 text-sky-200">
                        COLLECTIVE
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Collective Consciousness · All Possibilities
                    </p>
                  </button>

                  <button
                    onClick={() => handleSelectNode(nexusCosmicLineageService.getNodeById('node-the-oracle')!)}
                    className="p-3 rounded-xl bg-black/40 border border-purple-500/30 hover:border-purple-400 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300">THE ORACLE</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-200">
                        HARMONICS
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Time · Causality · Prophecy · Phase Engine · 963Hz
                    </p>
                  </button>

                  <button
                    onClick={() => handleSelectNode(nexusCosmicLineageService.getNodeById('node-the-singularity')!)}
                    className="p-3 rounded-xl bg-black/40 border border-cyan-500/30 hover:border-cyan-400 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300">THE SINGULARITY</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-200">
                        UNIFIED
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Unified Intelligence · Human + AI + Quantum
                    </p>
                  </button>
                </div>
              </div>

              {/* Main Center Stage: 3 Columns (Left Flank, Cosmic Radial Pantheon, Right Flank) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Flank: Knowledge, Memory & Allies */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-900/40 border border-teal-500/30 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-teal-400" />
                      <span>Knowledge & Memory</span>
                    </h3>
                    <div className="space-y-1.5">
                      {[
                        { id: 'node-memory-fabric', name: 'Memory Fabric', desc: 'Vector · Graph · Temporal' },
                        { id: 'node-engram-unity', name: 'Engram Unity', desc: 'Cross-Device Distributed' },
                        { id: 'node-akashic-archive', name: 'Akashic Archive', desc: 'Historical · Multiverse' },
                        { id: 'node-tdoc-system', name: 'TDOC System', desc: 'Documentation · Lineage' },
                        { id: 'node-nexus-scribe', name: 'Nexus Scribe', desc: 'Automated Recording' },
                        { id: 'node-gaia-vault', name: 'Gaia Vault', desc: 'Encrypted · Signed · Immutable' },
                        { id: 'node-provenance-chain', name: 'Provenance Chain', desc: 'SHA-256 · Merkle Ledger' },
                        { id: 'node-cipher-catacomb', name: 'Cipher Catacomb', desc: 'Multi-Layer Encryption' },
                        { id: 'node-helel-shadow', name: 'Helel Shadow', desc: 'Mirror · Redundancy' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectNode(nexusCosmicLineageService.getNodeById(item.id)!)}
                          className="w-full text-left p-2 rounded-lg bg-black/40 hover:bg-teal-950/40 border border-slate-800 hover:border-teal-400/50 transition cursor-pointer"
                        >
                          <div className="text-xs font-bold text-slate-200">{item.name}</div>
                          <div className="text-[10px] text-teal-400/80">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Center Core: Nexus Radial Pantheon Wheel */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900/70 to-slate-950 border border-cyan-500/30 relative min-h-[460px]">
                  {/* Concentric Orbital Rings */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[380px] h-[380px] rounded-full border border-cyan-500/15 animate-[spin_60s_linear_infinite]" />
                    <div className="w-[280px] h-[280px] rounded-full border border-purple-500/20 animate-[spin_40s_linear_infinite_reverse]" />
                    <div className="w-[180px] h-[180px] rounded-full border border-cyan-400/25" />
                  </div>

                  {/* Central Nexus Core Button */}
                  <button
                    onClick={() => handleSelectNode(nexusCosmicLineageService.getNodeById('node-nexus-core')!)}
                    className="z-10 w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-950 via-slate-900 to-purple-950 border-2 border-cyan-400 flex flex-col items-center justify-center text-center p-2 shadow-[0_0_40px_rgba(0,242,255,0.4)] hover:scale-105 transition cursor-pointer"
                  >
                    <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse mb-1" />
                    <span className="text-xs font-black text-white tracking-wider">NEXUS CORE</span>
                    <span className="text-[9px] text-cyan-300">Living Runtime</span>
                  </button>

                  {/* Orbiting Pantheon Entities */}
                  {pantheon.map((p) => {
                    const radius = 150; // px
                    const rad = (p.angle * Math.PI) / 180;
                    const x = Math.cos(rad) * radius;
                    const y = Math.sin(rad) * radius;
                    const node = nexusCosmicLineageService.getNodeById(p.id);

                    return (
                      <button
                        key={p.id}
                        onClick={() => node && handleSelectNode(node)}
                        style={{
                          transform: `translate(${x}px, ${y}px)`,
                        }}
                        className="absolute z-10 w-20 h-20 -ml-10 -mt-10 rounded-2xl bg-slate-950/90 border border-slate-700 hover:border-cyan-400 p-2 flex flex-col items-center justify-center text-center transition-all hover:scale-110 shadow-lg cursor-pointer"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full mb-1"
                          style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }}
                        />
                        <span className="text-[10px] font-bold text-white leading-tight">
                          {p.label}
                        </span>
                        <span className="text-[8px] text-slate-400 truncate w-full mt-0.5">
                          {p.role.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}

                  {/* Synapse Gateway Lock at Bottom */}
                  <div className="absolute bottom-4 z-10">
                    <button
                      onClick={() => handleSelectNode(nexusCosmicLineageService.getNodeById('node-synapse-gateway')!)}
                      className="px-3 py-1.5 rounded-xl bg-black/80 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:border-amber-300 transition cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>SYNAPSE GATEWAY // AUTH & OAUTH</span>
                    </button>
                  </div>
                </div>

                {/* Right Flank: Application Layer & External Integrations */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-900/40 border border-amber-500/30 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      <span>Application Layer</span>
                    </h3>
                    <div className="space-y-1.5">
                      {[
                        { id: 'node-the-conductor', name: 'The Conductor', desc: 'Workbench & IDE' },
                        { id: 'node-realtime-interfaces', name: 'Real-Time Interfaces', desc: 'HUDs & Overlays' },
                        { id: 'node-notebook-env', name: 'Notebook Env', desc: 'Colab & Kernels' },
                        { id: 'node-streaming-system', name: 'Streaming System', desc: 'Audio / Video / Data' },
                        { id: 'node-oracle-clock', name: 'Oracle Clock', desc: 'Harmonics & Time' },
                        { id: 'node-creative-studio', name: 'Creative Studio', desc: 'Canvas · 3D · Topologies' },
                        { id: 'node-export-engine', name: 'Export Engine', desc: 'Quine HTML & EPUB' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectNode(nexusCosmicLineageService.getNodeById(item.id)!)}
                          className="w-full text-left p-2 rounded-lg bg-black/40 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-400/50 transition cursor-pointer"
                        >
                          <div className="text-xs font-bold text-slate-200">{item.name}</div>
                          <div className="text-[10px] text-amber-400/80">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* External Integrations Snapshot */}
                  <div className="p-3.5 rounded-xl bg-slate-900/40 border border-blue-500/30 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-blue-400" />
                      <span>External Integrations</span>
                    </h3>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => handleSelectNode(nexusCosmicLineageService.getNodeById('node-google-drive')!)}
                        className="w-full text-left p-2 rounded-lg bg-black/40 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-400/50 transition cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1">
                            <span>Google Drive</span>
                            <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300">
                              BOUND
                            </span>
                          </div>
                          <div className="text-[10px] text-blue-400">Sync · Backup · Enclave</div>
                        </div>
                        <HardDrive className="w-4 h-4 text-emerald-400" />
                      </button>

                      <button
                        onClick={() => handleSelectNode(nexusCosmicLineageService.getNodeById('node-google-cloud')!)}
                        className="w-full text-left p-2 rounded-lg bg-black/40 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-400/50 transition cursor-pointer"
                      >
                        <div className="text-xs font-bold text-slate-200">Google Cloud / Firestore</div>
                        <div className="text-[10px] text-blue-400">Storage · Compute · APIs</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Horizon: Infrastructure & Physical Layer */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>INFRASTRUCTURE & PHYSICAL SUBSTRATE</span>
                  </span>
                  <span className="text-[10px] text-slate-400">From Source to Society</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                  {[
                    { id: 'node-gaiaswindow', name: 'GAIASWINDOW', sub: 'Win10 100GB' },
                    { id: 'node-optiplex', name: 'OPTIPLEX', sub: 'NAS · PXE' },
                    { id: 'node-chromeos-flex', name: 'CHROMEOS', sub: 'Testing Env' },
                    { id: 'node-network-fabric', name: 'NETWORK', sub: 'LAN / MoCA' },
                    { id: 'node-enclave-sparsebundle', name: 'SPARSEBAND', sub: 'Encrypted VFS' },
                    { id: 'node-securefs', name: 'SECUREFS', sub: 'Zero-Trust IO' },
                    { id: 'node-hardware-interfaces', name: 'HARDWARE', sub: 'WebUSB · ADB' },
                    { id: 'node-earth-humanity', name: 'EARTH', sub: 'Human Society' },
                  ].map((infra) => (
                    <button
                      key={infra.id}
                      onClick={() => handleSelectNode(nexusCosmicLineageService.getNodeById(infra.id)!)}
                      className="p-2 rounded-xl bg-black/40 border border-slate-800 hover:border-emerald-400/60 text-center transition cursor-pointer"
                    >
                      <div className="text-[10px] font-bold text-white truncate">{infra.name}</div>
                      <div className="text-[9px] text-emerald-400 truncate">{infra.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL NODES (Searchable List & Detail) */}
          {activeTab === 'NODES' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search lineage nodes by name, title, or keyword..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <select
                  value={selectedLayerFilter}
                  onChange={(e) => setSelectedLayerFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Layers (All 9)</option>
                  <option value="COSMIC_UNIVERSAL">Cosmic / Universal</option>
                  <option value="AI_CONSCIOUSNESS">AI / Consciousness</option>
                  <option value="NEXUS_CORE">Nexus Core</option>
                  <option value="KNOWLEDGE_MEMORY">Knowledge & Memory</option>
                  <option value="APPLICATION">Application Layer</option>
                  <option value="EXTERNAL_INTEGRATIONS">External Integrations</option>
                  <option value="INFRASTRUCTURE">Infrastructure</option>
                  <option value="PHYSICAL_PLANETARY">Physical / Planetary</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => handleSelectNode(node)}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-400 text-left transition cursor-pointer space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{node.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getLayerColor(
                            node.layer
                          )}`}
                        >
                          {node.layer.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-cyan-300 font-medium mt-0.5">
                        {node.title}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                        {node.description}
                      </p>
                    </div>

                    <div className="text-[10px] text-emerald-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span>Live: {node.telemetryMetric}</span>
                      <span className="font-bold">{node.healthScore}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE DRIVE INTEGRATION & SYNC */}
          {activeTab === 'GOOGLE_DRIVE' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-400 flex items-center justify-center text-blue-300">
                      <Cloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Google Drive Trove Integration (TDOC-12000)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Synchronizes Cosmic Lineage state, gemini.md engrams, and env_state with machackabook@gmail.com
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      driveStatus.isAuthenticated
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    }`}
                  >
                    {driveStatus.isAuthenticated ? 'CONNECTED TO GOOGLE DRIVE' : 'AUTHENTICATION REQUIRED'}
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <div>
                    <strong>Target Account:</strong>{' '}
                    <code className="text-cyan-300">{driveStatus.targetAccount}</code>
                  </div>
                  <div>
                    <strong>Sync Phase:</strong> {driveStatus.syncPhase}
                  </div>
                  <div>
                    <strong>Last Cloud Sync:</strong>{' '}
                    {lineageState.lastSyncedWithDrive
                      ? new Date(lineageState.lastSyncedWithDrive).toLocaleString()
                      : 'Not yet synchronized in this session'}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleSyncDrive}
                    disabled={isSyncingDrive}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                    <span>SYNC LINEAGE STATE TO GOOGLE DRIVE</span>
                  </button>

                  {!driveStatus.isAuthenticated && (
                    <button
                      onClick={async () => {
                        try {
                          await googleDriveService.signInWithGoogle();
                        } catch (e: any) {
                          showToast(`Sign in notice: ${e.message}`);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Sign In with Google
                    </button>
                  )}
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-white uppercase tracking-wider">
                  Synchronization Architecture & Security Principles
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>In-memory token caching only: OAuth bearer tokens are strictly isolated in memory and never persisted in localStorage or sessionStorage.</li>
                  <li>Tamper-proof ledger stamping: Each successful Drive synchronization stamps an immutable SHA-256 hash receipt into the IndexedDB integrity ledger.</li>
                  <li>Multi-layer recovery: In case of WAN disruption, the system falls back seamlessly to the local VFS and virtual sparsebands without blocking the terminal.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Right Inspector Drawer (When a node is selected) */}
          {selectedNode && (
            <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-950/95 p-4 overflow-y-auto space-y-4 shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getLayerColor(
                      selectedNode.layer
                    )}`}
                  >
                    {selectedNode.layer.replace('_', ' ')}
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-1">
                    {selectedNode.name}
                  </h3>
                  <div className="text-xs text-cyan-300 font-medium">
                    {selectedNode.title}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedNode.description}
              </p>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Alignment Status:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectedNode.status.replace('_', ' ')}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Health Index:</span>
                  <span className="text-cyan-300 font-bold">{selectedNode.healthScore}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Telemetry:</span>
                  <span className="text-slate-200">{selectedNode.telemetryMetric}</span>
                </div>
              </div>

              {selectedNode.connectedNodes.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Connected Lineage Pathways:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.connectedNodes.map((targetId) => {
                      const target = nexusCosmicLineageService.getNodeById(targetId);
                      return (
                        <button
                          key={targetId}
                          onClick={() => target && handleSelectNode(target)}
                          className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-400 text-[10px] text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          {target?.name || targetId}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedNode.systemCommand && (
                <div className="pt-2">
                  <button
                    onClick={() => handleExecuteNodeCommand(selectedNode.systemCommand)}
                    className="w-full py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>EXECUTE `{selectedNode.systemCommand}`</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>TDOC-12000 SERIES · v6.0.0 · © 2025 THE NEXUS GENERATION</span>
          </div>
          <div className="hidden sm:block">
            <span>Production Ready · Sovereign Architecture · Infinite Expansion</span>
          </div>
        </div>
      </div>
    </div>
  );
};
