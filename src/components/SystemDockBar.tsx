import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Activity,
  Network,
  Sparkles,
  Tv,
  Code,
  Search,
  Lock,
  Unlock,
  Cpu,
  Layers,
  Eye,
  Volume2,
  Sliders,
  ExternalLink,
  GitCompare,
  Radio,
  Video,
  ShieldCheck,
  Zap,
  Compass,
  FileText,
  Globe,
} from 'lucide-react';
import { EnvironmentState, TerminalDockPosition } from '../types';
import { voiceAuthGateService } from '../services/voiceAuthGateService';
import { audioVoiceService } from '../services/audioVoiceService';
import { livingComputationEngine, LifecycleTelemetry } from '../services/livingComputationEngine';

interface SystemDockBarProps {
  envState: EnvironmentState;
  setEnvState: React.Dispatch<React.SetStateAction<EnvironmentState>>;
  isCanvasMode: boolean;
  onToggleCanvas: () => void;
  onOpenCommandPalette: () => void;
}

export const SystemDockBar: React.FC<SystemDockBarProps> = ({
  envState,
  setEnvState,
  isCanvasMode,
  onToggleCanvas,
  onOpenCommandPalette,
}) => {
  const [voiceAuthStatus, setVoiceAuthStatus] = useState(voiceAuthGateService.getStatus());
  const [lifecycle, setLifecycle] = useState<LifecycleTelemetry>(livingComputationEngine.getTelemetry());

  useEffect(() => {
    const unsubVoice = voiceAuthGateService.subscribe(setVoiceAuthStatus);
    const unsubLife = livingComputationEngine.subscribe(setLifecycle);
    return () => {
      unsubVoice();
      unsubLife();
    };
  }, []);

  const handleDockChange = (dock: TerminalDockPosition) => {
    if (isCanvasMode) {
      onToggleCanvas();
    }
    setEnvState((prev) => ({ ...prev, terminalDock: dock }));
  };

  const handleToggleClear = () => {
    const next = envState.terminalOpacity <= 0.15 ? 0.85 : 0.05;
    setEnvState((prev) => ({ ...prev, terminalOpacity: next }));
  };

  const isClearMode = envState.terminalOpacity <= 0.15;

  return (
    <footer
      aria-label="System Dock and Telemetry Status Bar"
      className="fixed bottom-0 left-0 right-0 z-40 h-9 bg-slate-950/90 backdrop-blur-xl border-t border-cyan-500/20 px-3 flex items-center justify-between text-xs font-mono select-none shadow-[0_-4px_30px_rgba(0,0,0,0.7)] text-slate-300"
    >
      {/* Left: Operational Telemetry & Health Gauges */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Terminal instance / CWD indicator */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-300 font-semibold">HYPER_OS</span>
          <span aria-hidden="true" className="text-slate-600">/</span>
          <span className="text-slate-400 hidden sm:inline">VFS: RAM-BOUND</span>
        </div>

        {/* Divider */}
        <span aria-hidden="true" className="text-slate-700 hidden md:inline">·</span>

        {/* Swarm RingBuffer Status Button */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('gaia:open-swarm'));
            audioVoiceService.playEarcon('stream');
          }}
          className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition cursor-pointer"
          title="Open Swarm Telemetry & Network Buffer"
        >
          <Cpu className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>SWARM 16K</span>
        </button>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('gaia:open-remote-hub'));
            audioVoiceService.playEarcon('switch');
          }}
          className="hidden lg:flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
          title="Open Nexus Remote: SSH, ADB, SMB & Mounting Hub"
        >
          <Network className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>NEXUS REMOTE</span>
        </button>

        {/* Divider */}
        <span aria-hidden="true" className="text-slate-700 hidden sm:inline">·</span>

        {/* GitHub ↔ AI Studio Diff & Merge Status */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:open-diff-modal'))}
          className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
          title="GitHub ↔ AI Studio Compare Diff: 100% Merged (0 Diffs)"
        >
          <GitCompare className="w-3 h-3 text-emerald-400" />
          <span>GH·AIS: 0 DIFF</span>
        </button>

        {/* Divider */}
        <span aria-hidden="true" className="text-slate-700 hidden lg:inline">·</span>

        {/* Voice Auth Security Status */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('gaia:open-voice-auth'));
          }}
          className="hidden lg:flex items-center gap-1.5 text-[11px] transition cursor-pointer"
          title={
            voiceAuthStatus.isAuthenticated
              ? `Authenticated Operator: ${voiceAuthStatus.username}`
              : 'Voice Authentication Standby (Click to calibrate/authenticate)'
          }
        >
          {voiceAuthStatus.isAuthenticated ? (
            <>
              <Unlock className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300 font-medium">{(voiceAuthStatus.username || 'OPERATOR').toUpperCase()}</span>
            </>
          ) : (
            <>
              <Lock className="w-3 h-3 text-amber-400/80" />
              <span className="text-amber-300/80">GUEST MODE</span>
            </>
          )}
        </button>

        {/* Solfeggio 963Hz Indicator */}
        {envState.solfeggio963 && (
          <span className="hidden xl:inline text-[10px] text-emerald-400">
            963Hz ACTIVE
          </span>
        )}
      </div>

      {/* Center: Quick Subsystem Launchers */}
      <div className="flex items-center gap-1">
        {/* Living Computation 5-Phase Pulse Launcher */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:open-lifecycle'))}
          className="px-2 py-0.5 rounded-lg border border-purple-500/40 bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 hover:border-purple-400 text-[10px] font-bold transition cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(192,132,252,0.25)]"
          title={`Living Computation State Machine: ${lifecycle.currentPhase} (observe → digest → integrate → stabilize → shed)`}
        >
          <Zap className="w-3 h-3 text-purple-400 animate-pulse" />
          <span className="hidden sm:inline">PULSE:</span>
          <span className="text-cyan-300 font-extrabold">{lifecycle.currentPhase}</span>
        </button>

        {/* The Nexus Ecosystem Cosmic Lineage Map (TDOC-12000 v6.0.0) */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:open-lineage-map'))}
          className="px-2 py-0.5 rounded-lg border border-cyan-400/50 bg-cyan-950/50 text-cyan-200 hover:bg-cyan-900/60 hover:border-cyan-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
          title="Open The Nexus Ecosystem Cosmic Lineage Map (TDOC-12000 SERIES v6.0.0 | GAIA PRIME)"
        >
          <Compass className="w-3 h-3 text-cyan-300" />
          <span className="hidden sm:inline">LINEAGE</span>
          <span className="text-[9px] text-cyan-400 font-mono">v6.0</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:toggle-cognition-panel'))}
          className="px-2 py-0.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-400 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
          title="Open GAIA Cognition Mesh V4"
        >
          <Network className="w-3 h-3" />
          <span className="hidden sm:inline">MESH V4</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:toggle-resonance'))}
          className="px-2 py-0.5 rounded-lg border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
          title="Open Resonance Dynamics Console"
        >
          <Activity className="w-3 h-3" />
          <span className="hidden sm:inline">RESONANCE</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:toggle-crossvoid'))}
          className="px-2 py-0.5 rounded-lg border border-amber-500/30 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 hover:border-amber-400 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
          title="Open Crystalline CrossVoid Gate"
        >
          <Sparkles className="w-3 h-3" />
          <span className="hidden sm:inline">CROSSVOID</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:open-x-card'))}
          className="px-2 py-0.5 rounded-lg border border-purple-500/30 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 hover:border-purple-400 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
          title="Open 𝕏 Comms & Together Card"
        >
          <Tv className="w-3 h-3" />
          <span className="hidden md:inline">COMMS</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:open-youtube-portal'))}
          className="px-2 py-0.5 rounded-lg border border-red-500/40 bg-red-950/40 text-red-300 hover:bg-red-900/50 hover:border-red-400 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.25)]"
          title="Open YouTube Claunch Portal: Interactive Login & Music Selection"
        >
          <Globe className="w-3 h-3 text-red-400" />
          <span className="hidden md:inline">PORTAL</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:open-listening'))}
          className="px-2 py-0.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-400 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
          title="Open Dynamic Acoustic Listening & Shazam Trivia Game"
        >
          <Radio className="w-3 h-3" />
          <span className="hidden md:inline">LISTEN</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:toggle-meet'))}
          className="px-2 py-0.5 rounded-lg border border-blue-500/30 bg-blue-950/30 text-blue-300 hover:bg-blue-900/40 hover:border-blue-400 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
          title="Open Google Meet Executive Session"
        >
          <Video className="w-3 h-3" />
          <span className="hidden md:inline">MEET</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:toggle-voice-live'))}
          className="px-2 py-0.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-400 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
          title="Open Gemini Voice Live Real-Time Enclave"
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span className="hidden md:inline">VOICE</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:toggle-transcription'))}
          className="px-2 py-0.5 rounded-lg border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
          title="Open Audio Transcription Substrate"
        >
          <FileText className="w-3 h-3 text-cyan-400" />
          <span className="hidden md:inline">TRANSCR</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:toggle-entropy-panel'))}
          className="px-2 py-0.5 rounded-lg border border-rose-500/30 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 hover:border-rose-400 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
          title="Open Quantum Entropy Metrics Panel"
        >
          <Zap className="w-3 h-3 text-rose-400" />
          <span className="hidden md:inline">ENTROPY</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:open-workbench'))}
          className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-lg border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400 text-[10px] font-semibold transition cursor-pointer"
          title="Open Polyglot Workbench IDE"
        >
          <Code className="w-3 h-3 text-cyan-400" />
          <span>BENCH</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:open-inspection'))}
          className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-lg border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400 text-[10px] font-semibold transition cursor-pointer"
          title="Open System Diagnostics & Inspector HUD"
        >
          <Search className="w-3 h-3 text-cyan-400" />
          <span>INSPECT</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:open-diff-modal'))}
          className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 text-[10px] font-semibold transition cursor-pointer"
          title="Open GitHub ↔ AI Studio Compare Diff & Consolidation Matrix (0 Diffs)"
        >
          <GitCompare className="w-3 h-3 text-cyan-400" />
          <span>DIFF (0)</span>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:open-integrity-ledger'))}
          className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-400 text-[10px] font-semibold transition cursor-pointer"
          title="Open Cryptographic Integrity Ledger (Tamper Detection & Hashed Receipts)"
        >
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>LEDGER</span>
        </button>
      </div>

      {/* Right: Dock Viewport Controls & Command Palette Trigger */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Terminal Dock Modes */}
        <div className="flex items-center p-0.5 rounded-xl bg-black/60 border border-slate-800 text-[10px]">
          <button
            type="button"
            onClick={() => handleDockChange('center')}
            className={`px-1.5 py-0.5 rounded-lg font-medium transition cursor-pointer ${
              envState.terminalDock === 'center' && !isCanvasMode
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/80 shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Dock to Center"
          >
            ⊞ Center
          </button>
          <button
            type="button"
            onClick={() => handleDockChange('bottom')}
            className={`px-1.5 py-0.5 rounded-lg font-medium transition cursor-pointer hidden sm:inline ${
              envState.terminalDock === 'bottom' && !isCanvasMode
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/80 shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Dock to Bottom"
          >
            ⎁ Bottom
          </button>
          <button
            type="button"
            onClick={() => handleDockChange('floating')}
            className={`px-1.5 py-0.5 rounded-lg font-medium transition cursor-pointer hidden md:inline ${
              envState.terminalDock === 'floating' && !isCanvasMode
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/80 shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Floating Window"
          >
            ❐ Float
          </button>
          <button
            type="button"
            onClick={() => handleDockChange('fullscreen')}
            className={`px-1.5 py-0.5 rounded-lg font-medium transition cursor-pointer ${
              envState.terminalDock === 'fullscreen' && !isCanvasMode
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/80 shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Fullscreen Window"
          >
            ⛶ Full
          </button>
        </div>

        {/* Clear Glass Toggle */}
        <button
          type="button"
          onClick={handleToggleClear}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer hidden sm:flex items-center gap-1 ${
            isClearMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
              : 'bg-black/40 text-slate-400 border-slate-800 hover:text-white'
          }`}
          title="Toggle Ultra-Clear Glass Mode"
        >
          <Layers className="w-3 h-3 text-amber-400" />
          <span>{isClearMode ? 'SOLID' : 'CLEAR'}</span>
        </button>

        {/* Canvas Mode Toggle */}
        <button
          type="button"
          onClick={onToggleCanvas}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
            isCanvasMode
              ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(0,242,255,0.5)] font-bold'
              : 'bg-cyan-950/40 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/50'
          }`}
          title="Toggle pure 100% 3D Void Background View"
        >
          <Eye className="w-3 h-3" />
          <span>{isCanvasMode ? 'RESTORE' : 'CANVAS'}</span>
        </button>

        {/* Drone View Toggle */}
        <button
          type="button"
          onClick={() => setEnvState((prev) => ({ ...prev, droneViewActive: !prev.droneViewActive }))}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
            envState.droneViewActive
              ? 'bg-purple-500/20 text-purple-300 border-purple-400/60 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
              : 'bg-black/40 text-slate-400 border-slate-800 hover:text-white'
          }`}
          title="Toggle Auto-Orbiting Drone View Camera"
        >
          <Video className="w-3 h-3 text-purple-400" />
          <span>{envState.droneViewActive ? 'DRONE' : 'FIXED'}</span>
        </button>

        {/* Quick Spotlight Shortcut */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="px-2 py-0.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
          title="Open Command Spotlight (Ctrl+K or ⌘K)"
        >
          <span>⌘K</span>
        </button>
      </div>
    </footer>
  );
};
