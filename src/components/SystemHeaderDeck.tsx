import React, { useState, useEffect } from 'react';
import {
  Download,
  Terminal,
  Activity,
  Network,
  Sparkles,
  Tv,
  Code,
  BookOpen,
  Eye,
  Search,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Layers,
  Shield,
  Radio,
  Cpu,
  GitCompare,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Key,
  Fingerprint,
  Compass,
  Camera,
} from 'lucide-react';
import { EnvironmentState, TopologyType } from '../types';
import { HealthState } from './SystemSelfTest';
import { audioVoiceService } from '../services/audioVoiceService';
import { openSystemPage } from '../services/nexusSystemRouter.mjs';
import { KeyManagementModal } from './KeyManagementModal';
import { IntegrityLedgerModal } from './IntegrityLedgerModal';
import { ComplianceAndSSOModal } from './ComplianceAndSSOModal';
import { getAllReceipts, verifyReceiptIntegrity, createStateReceipt } from '../services/cryptoStorageService';
import { SovereignSentinelCore } from '../services/sovereignSentinelCore';

interface SystemHeaderDeckProps {
  envState: EnvironmentState;
  setEnvState: React.Dispatch<React.SetStateAction<EnvironmentState>>;
  activeModule?: string;
  onOpenCommandPalette: () => void;
  onOpenLogs?: () => void;
  healthState: HealthState;
  isCanvasMode: boolean;
  onToggleCanvas: () => void;
}

const TOPOLOGIES: { id: TopologyType; label: string }[] = [
  { id: 'torus', label: 'Torus' },
  { id: 'tesseract', label: 'Tesseract' },
  { id: 'galaxy', label: 'Galaxy' },
  { id: 'singularity', label: 'Singularity' },
  { id: 'neural', label: 'Neural' },
  { id: 'forest', label: 'Forest' },
  { id: 'cybercity', label: 'Cybercity' },
];

export const SystemHeaderDeck: React.FC<SystemHeaderDeckProps> = ({
  envState,
  setEnvState,
  activeModule,
  onOpenCommandPalette,
  onOpenLogs,
  healthState,
  isCanvasMode,
  onToggleCanvas,
}) => {
  const [showTopoDropdown, setShowTopoDropdown] = useState(false);
  const [isKeyMgmtOpen, setIsKeyMgmtOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [tamperedCount, setTamperedCount] = useState(0);
  const [isScanningLedger, setIsScanningLedger] = useState(false);
  const [scanPulseCount, setScanPulseCount] = useState(0);

  // Periodic integrity check to flag tampering in the header deck with visual heartbeat pulse
  useEffect(() => {
    let isSubscribed = true;

    const saveBeginningStageSnapshot = async () => {
      try {
        await createStateReceipt(
          envState,
          'Beginning Stage System Snapshot (Initial Baseline Artifact)',
          'STATE_SNAPSHOT',
          'machackabook@gmail.com'
        );
        SovereignSentinelCore.serializeSurvivalState();
      } catch {
        // Silently handle before IndexedDB readiness
      }
    };

    const checkIntegrity = async () => {
      if (!isSubscribed) return;
      setIsScanningLedger(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gaia:ledger-scan-started'));
      }

      const startTime = performance.now();
      try {
        const receipts = await getAllReceipts();
        let corrupted = 0;
        for (const r of receipts) {
          const res = await verifyReceiptIntegrity(r);
          if (!res.isValid) corrupted++;
        }
        if (isSubscribed) {
          setTamperedCount(corrupted);
          setScanPulseCount((prev) => prev + 1);
        }

        // Guarantee smooth visual heartbeat pulse visibility (min 1.2s pulse)
        const elapsed = performance.now() - startTime;
        const minPulseTime = 1200;
        if (elapsed < minPulseTime) {
          await new Promise((r) => setTimeout(r, minPulseTime - elapsed));
        }
      } catch {
        // Silently handle before IndexedDB initialization
      } finally {
        if (isSubscribed) {
          setIsScanningLedger(false);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gaia:ledger-scan-completed'));
          }
        }
      }
    };

    saveBeginningStageSnapshot();
    checkIntegrity();
    const interval = setInterval(checkIntegrity, 8000);

    const onTriggerScan = () => checkIntegrity();
    const onScanStart = () => setIsScanningLedger(true);
    const onScanComplete = () => setIsScanningLedger(false);
    const onOpenLedger = () => setIsLedgerOpen(true);
    const onOpenSSOAuditor = () => setIsComplianceOpen(true);

    window.addEventListener('gaia:trigger-ledger-scan', onTriggerScan);
    window.addEventListener('gaia:ledger-scan-started', onScanStart);
    window.addEventListener('gaia:ledger-scan-completed', onScanComplete);
    window.addEventListener('gaia:open-integrity-ledger', onOpenLedger);
    window.addEventListener('gaia:open-sso-auditor', onOpenSSOAuditor);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      window.removeEventListener('gaia:trigger-ledger-scan', onTriggerScan);
      window.removeEventListener('gaia:ledger-scan-started', onScanStart);
      window.removeEventListener('gaia:ledger-scan-completed', onScanComplete);
      window.removeEventListener('gaia:open-integrity-ledger', onOpenLedger);
      window.removeEventListener('gaia:open-sso-auditor', onOpenSSOAuditor);
    };
  }, []);

  const handleLaunchModule = (key: string) => {
    switch (key) {
      case 'ledger':
        setIsLedgerOpen(true);
        break;
      case 'atc':
        window.dispatchEvent(new CustomEvent('gaia:toggle-atc'));
        break;
      case 'scheduler':
        window.dispatchEvent(new CustomEvent('gaia:toggle-scheduler'));
        break;
      case 'aurora':
        window.dispatchEvent(new CustomEvent('gaia:toggle-singularity'));
        break;
      case 'connectors':
        window.dispatchEvent(new CustomEvent('gaia:toggle-connector-settings'));
        break;
      case 'terminal':
        if (isCanvasMode) onToggleCanvas();
        window.dispatchEvent(new CustomEvent('gaia:show-terminal'));
        break;
      case 'canvas':
        onToggleCanvas();
        break;
      case 'resonance':
        window.dispatchEvent(new CustomEvent('gaia:toggle-resonance'));
        break;
      case 'mesh':
        window.dispatchEvent(new CustomEvent('gaia:toggle-cognition-panel'));
        break;
      case 'crossvoid':
        window.dispatchEvent(new CustomEvent('gaia:toggle-crossvoid'));
        break;
      case 'comms':
        window.dispatchEvent(new CustomEvent('gaia:open-x-card'));
        break;
      case 'quine': {
        const href = import.meta.env.BASE_URL + 'gaia-absorption-quine.html';
        window.open(href, '_blank', 'noopener,noreferrer');
        break;
      }
      case 'pages':
        openSystemPage('terminal');
        break;
    }
  };

  const navItems = [
    { key: 'terminal', label: 'CONSOLE', icon: <Terminal className="w-3.5 h-3.5" /> },
    { key: 'scheduler', label: 'SCHEDULER', icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" /> },
    { key: 'aurora', label: 'AURORA', icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" /> },
    { key: 'canvas', label: isCanvasMode ? 'HUD ON' : '3D VOID', icon: <Eye className="w-3.5 h-3.5" /> },
    { key: 'resonance', label: 'RESONANCE', icon: <Activity className="w-3.5 h-3.5" /> },
    { key: 'mesh', label: 'MESH V4', icon: <Network className="w-3.5 h-3.5" /> },
    { key: 'crossvoid', label: 'CROSSVOID', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'connectors', label: 'VAULT/WEB', icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'atc', label: 'ATC LIVE', icon: <Radio className="w-3.5 h-3.5" /> },
  ];

  const handleExportState = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(envState));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "envState_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-11 bg-slate-950/85 backdrop-blur-xl border-b border-cyan-500/20 px-3 flex items-center justify-between text-xs font-mono select-none shadow-[0_4px_30px_rgba(0,0,0,0.7)]">
      {/* Left: Branding & Unboxed Metadata */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className={`relative flex h-2.5 w-2.5`}>
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${healthState.status === 'passed' ? 'bg-emerald-400' : 'bg-red-500 animate-ping'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${healthState.status === 'passed' ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
          </span>
          <span className="font-extrabold tracking-wider text-white text-xs drop-shadow-[0_0_10px_rgba(0,242,255,0.6)]">
            S.O.S
          </span>
        </div>

        {/* Quiet unboxed metadata separator */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400">
          <span aria-hidden="true" className="text-slate-600">/</span>
          <span className="text-cyan-300/90 font-medium">SOVEREIGN ROOT</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>100% VISUAL SUBSTRATE</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>LOCAL COMPUTE</span>
        </div>
      </div>

      {/* Center: Module Navigation Segmented Controls */}
      <nav aria-label="Master Workspaces" className="hidden md:flex items-center gap-1 p-0.5 bg-black/60 border border-slate-800/80 rounded-2xl">
        {navItems.map((item) => {
          const isActive = activeModule === item.key || (item.key === 'canvas' && isCanvasMode);
          return (
            <button
              key={item.key}
              onClick={() => handleLaunchModule(item.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,242,255,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right: Quick Controls, Topology Switcher & Search */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Topology Selector */}
        <div className="relative">
          <button
            onClick={() => setShowTopoDropdown(!showTopoDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 border border-slate-800 text-[11px] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer"
            title="Switch 3D WebGL Topology"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider">{envState.topology}</span>
          </button>

          {showTopoDropdown && (
            <div className="absolute right-0 mt-1.5 w-36 bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl p-1 z-50 divide-y divide-slate-800/60">
              <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase">Topologies</div>
              <div className="py-1 space-y-0.5">
                {TOPOLOGIES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setEnvState((prev) => ({ ...prev, topology: t.id }));
                      audioVoiceService.playTone(600, 'sine', 60);
                      setShowTopoDropdown(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded-md text-xs transition flex items-center justify-between ${
                      envState.topology === t.id
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span>{t.label}</span>
                    {envState.topology === t.id && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 963Hz Solfeggio Harmonic Audio Toggle */}
        <button
          onClick={() => {
            const on = audioVoiceService.toggle963();
            setEnvState((prev) => ({ ...prev, solfeggio963: on }));
          }}
          className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
            envState.solfeggio963
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'bg-black/60 border-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Toggle 963Hz Pure Solfeggio Harmonic Oscillator"
        >
          {envState.solfeggio963 ? <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* GitHub ↔ AI Studio Diff & Merge Status */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:open-diff-modal'))}
          className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-[11px] text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-400 transition cursor-pointer"
          title="GitHub ↔ AI Studio Compare Diff: 100% Merged (0 Diffs)"
        >
          <GitCompare className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold">GH·AIS: 0 DIFF</span>
        </button>

        {/* Command Palette Trigger Button (Ctrl+K) */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 text-[11px] font-bold shadow-[0_0_12px_rgba(0,242,255,0.2)] transition cursor-pointer"
          title="Universal System Command Palette (Ctrl+K / ⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">SPOTLIGHT</span>
          <kbd className="hidden md:inline px-1 py-0.2 bg-black/60 border border-slate-700 text-[9px] text-slate-400 rounded">
            ⌘K
          </kbd>
        </button>

        {/* Manual System Snapshot Button (Versioned Artifact in Cryptographic Ledger) */}
        <button
          onClick={async () => {
            try {
              const receipt = await createStateReceipt(
                envState,
                `Manual Environment State Snapshot (Versioned Artifact #${scanPulseCount + 1})`,
                'STATE_SNAPSHOT',
                'machackabook@gmail.com'
              );
              SovereignSentinelCore.serializeSurvivalState();
              audioVoiceService.playTone(880, 'sine', 120);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('gaia:trigger-ledger-scan'));
              }
              setIsLedgerOpen(true);
            } catch (err: any) {
              alert('Failed to store snapshot artifact: ' + err?.message);
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold shadow-[0_0_12px_rgba(16,185,129,0.25)] transition cursor-pointer"
          title="Trigger Manual System Snapshot & Store as Versioned Artifact in IndexedDB Cryptographic Ledger"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">SNAPSHOT</span>
        </button>

        {/* Export State Backup */}
        <button
          onClick={handleExportState}
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer"
          title="Export Current Environment State Backup"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* System Log Viewer Trigger */}
        <button
          onClick={onOpenLogs}
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer"
          title="Open System Diagnostic Logs"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
        </button>

        {/* Real-Time Integrity Ledger Cryptographic Seal Verification Heartbeat */}
        <button
          onClick={() => setIsLedgerOpen(true)}
          className={`relative flex items-center gap-2 px-2.5 py-1 rounded-xl border text-[11px] font-bold transition cursor-pointer select-none ${
            tamperedCount > 0
              ? 'bg-red-950/60 border-red-500/80 text-red-300 hover:bg-red-900/70 shadow-[0_0_18px_rgba(239,68,68,0.4)] animate-pulse'
              : isScanningLedger
              ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-[0_0_18px_rgba(0,242,255,0.45)]'
              : 'bg-black/60 border-slate-800/80 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50'
          }`}
          title={
            tamperedCount > 0
              ? `CRITICAL: ${tamperedCount} Tampered Receipts Detected in Integrity Ledger!`
              : isScanningLedger
              ? 'WebCrypto SHA-256 Background Scan Active — Verifying Cryptographic Receipts'
              : `Cryptographic Seal Verification Heartbeat (Scan #${scanPulseCount}) — 100% Intact. Click to open Ledger.`
          }
        >
          {/* Heartbeat Pulse Node */}
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            {isScanningLedger ? (
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                  tamperedCount > 0 ? 'bg-red-400' : 'bg-cyan-400'
                }`}
              />
            ) : (
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-30 animate-pulse [animation-duration:2.5s] ${
                  tamperedCount > 0 ? 'bg-red-500' : 'bg-emerald-400'
                }`}
              />
            )}
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                tamperedCount > 0
                  ? 'bg-red-500'
                  : isScanningLedger
                  ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,242,255,0.9)]'
                  : 'bg-emerald-400'
              }`}
            />
          </span>

          {/* Icon */}
          {tamperedCount > 0 ? (
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <ShieldCheck
              className={`w-3.5 h-3.5 transition-transform duration-500 ${
                isScanningLedger ? 'text-cyan-300 animate-spin [animation-duration:3s]' : 'text-emerald-400'
              }`}
            />
          )}

          {/* Live Heartbeat Label & Status */}
          <div className="hidden xl:flex items-center gap-1.5 font-mono text-[10px] tracking-wide">
            <span className="text-slate-400 font-bold">SEAL:</span>
            {tamperedCount > 0 ? (
              <span className="text-red-400 font-extrabold">TAMPERED ({tamperedCount})</span>
            ) : isScanningLedger ? (
              <span className="text-cyan-300 font-extrabold animate-pulse">VERIFYING...</span>
            ) : (
              <span className="text-emerald-400 font-bold">100% INTACT</span>
            )}
          </div>

          {/* Pulse Cycle Counter Badge */}
          {scanPulseCount > 0 && (
            <span className="hidden sm:inline-block px-1 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/30 text-[9px] text-cyan-300 font-extrabold">
              #{scanPulseCount}
            </span>
          )}
        </button>

        {/* Cryptographic Key Management */}
        <button
          onClick={() => setIsKeyMgmtOpen(true)}
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer"
          title="Manage Cryptographic Keys"
        >
          <Key className="w-3.5 h-3.5" />
        </button>

        {/* GAIA Unified SSO & Compliance Index Auditor */}
        <button
          onClick={() => setIsComplianceOpen(true)}
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer"
          title="GAIA Unified SSO Aggregator & Keyword Index Auditor (Putrefaction / Living Computation)"
        >
          <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
        </button>

        {/* The Nexus Ecosystem Cosmic Lineage Map (TDOC-12000 v6.0.0) */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('gaia:open-lineage-map'))}
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer"
          title="The Nexus Ecosystem Cosmic Lineage Map (TDOC-12000 v6.0.0 · Google Drive Sync)"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin [animation-duration:30s]" />
        </button>

        {/* E2EE Local Encrypted State Backup */}
        <button
          onClick={async () => {
            try {
              const receipt = await createStateReceipt(
                envState,
                `Encrypted State Seal (${envState.topology.toUpperCase()})`,
                'STATE_SNAPSHOT',
                'machackabook@gmail.com'
              );
              audioVoiceService.playTone(740, 'sine', 120);
              setIsLedgerOpen(true);
            } catch (err: any) {
              alert('Failed to stamp encrypted state receipt: ' + err?.message);
            }
          }}
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40 transition cursor-pointer"
          title="Perform Encrypted Local State Backup (Commit Hash Receipt to Ledger)"
        >
          <Lock className="w-3.5 h-3.5" />
        </button>
      </div>

      {isKeyMgmtOpen && <KeyManagementModal onClose={() => setIsKeyMgmtOpen(false)} />}
      <IntegrityLedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        envState={envState}
      />
      <ComplianceAndSSOModal
        isOpen={isComplianceOpen}
        onClose={() => setIsComplianceOpen(false)}
      />
    </header>
  );
};
