import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  Zap,
  Cpu,
  Globe,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Play,
  Terminal,
  Activity,
  X,
  Server,
  Layers,
  Check,
  Copy,
  Radio,
  Download,
  Upload,
} from 'lucide-react';
import { keyVaultService, KeyVaultStatus, VaultKeyItem } from '../services/keyVaultService';
import { tailscaleService, TailscaleStatus, TailscalePeer } from '../services/tailscaleService';
import { synapseService, SynapseStatus, SynapseTensorMatrix } from '../services/synapseService';
import { encryptedKeyVaultService, KeyProviderType } from '../services/encryptedKeyVaultService';
import { audioVoiceService } from '../services/audioVoiceService';

interface KeyVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand?: (cmd: string) => void;
  initialTab?: 'vault' | 'tailscale' | 'synapse' | 'codex';
  onOpenSynapseBridge?: () => void;
}

export const KeyVaultModal: React.FC<KeyVaultModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
  initialTab = 'vault',
  onOpenSynapseBridge,
}) => {
  const [activeTab, setActiveTab] = useState<'vault' | 'tailscale' | 'synapse' | 'codex'>(initialTab);
  const [vaultStatus, setVaultStatus] = useState<KeyVaultStatus | null>(() => keyVaultService.getStatus());
  const [tailscaleStatus, setTailscaleStatus] = useState<TailscaleStatus>(() => tailscaleService.getStatus());
  const [synapseStatus, setSynapseStatus] = useState<SynapseStatus>(() => synapseService.getStatus());
  
  // Add Key Form State
  const [newKeyProvider, setNewKeyProvider] = useState<'gemini' | 'openai' | 'ibm_quantum'>('gemini');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [isSubmittingKey, setIsSubmittingKey] = useState(false);
  const [keySubmitFeedback, setKeySubmitFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Encrypted Local Storage & Hot-Swap State
  const [activePrimaryProvider, setActivePrimaryProvider] = useState<KeyProviderType>(() => encryptedKeyVaultService.getActiveProvider());
  const [isEncryptedUnlocked, setIsEncryptedUnlocked] = useState(() => encryptedKeyVaultService.isUnlocked());
  const [passphraseInput, setPassphraseInput] = useState('');
  const [hotSwapNotice, setHotSwapNotice] = useState<string | null>(null);
  const [keyPingResults, setKeyPingResults] = useState<Record<string, { latencyMs: number; status: string }>>({});
  const [isPingingKey, setIsPingingKey] = useState<string | null>(null);
  const [importJsonInput, setImportJsonInput] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  // Codex Runner State
  const [codexPrompt, setCodexPrompt] = useState('Write a TypeScript function to calculate prime modular residues using M61');
  const [codexModel, setCodexModel] = useState('gpt-4o-mini');
  const [codexOutput, setCodexOutput] = useState('');
  const [codexLoading, setCodexLoading] = useState(false);
  const [codexKeyUsed, setCodexKeyUsed] = useState('');

  // Synapse Math State
  const [mathExpr, setMathExpr] = useState('sin(pi/4)*1000 + 432');
  const [mathResult, setMathResult] = useState<{ expr: string; val: string; residue: string; timeMs: number } | null>(null);
  const [tensorDim, setTensorDim] = useState(4);
  const [tensorMatrix, setTensorMatrix] = useState<SynapseTensorMatrix | null>(null);
  const [twoFaCode, setTwoFaCode] = useState('849201');
  const [twoFaResult, setTwoFaResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Tailscale Ping State
  const [pingTarget, setPingTarget] = useState('openwrt-gateway');
  const [pingOutput, setPingOutput] = useState('');
  const [isPinging, setIsPinging] = useState(false);

  // Copy Feedback
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    keyVaultService.refreshStatus().then(setVaultStatus);
    const unsubVault = keyVaultService.onStatusChange(setVaultStatus);
    const unsubTail = tailscaleService.onStatusChange(setTailscaleStatus);
    const unsubSyn = synapseService.onStatusChange(setSynapseStatus);
    const unsubEncrypted = encryptedKeyVaultService.onVaultChange(() => {
      setActivePrimaryProvider(encryptedKeyVaultService.getActiveProvider());
      setIsEncryptedUnlocked(encryptedKeyVaultService.isUnlocked());
    });

    return () => {
      unsubVault();
      unsubTail();
      unsubSyn();
      unsubEncrypted();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleHotSwapProvider = async (provider: KeyProviderType) => {
    audioVoiceService.playTone(920, 'sine', 90);
    const res = await encryptedKeyVaultService.hotSwapActiveProvider(provider);
    setActivePrimaryProvider(provider);
    setHotSwapNotice(res.message);
    await keyVaultService.refreshStatus().then(setVaultStatus);
    setTimeout(() => setHotSwapNotice(null), 4500);
  };

  const handleHotSwapKey = async (provider: KeyProviderType, keyId: string) => {
    audioVoiceService.playTone(1100, 'sine', 70);
    const res = await encryptedKeyVaultService.hotSwapKey(provider, keyId);
    setHotSwapNotice(res.message);
    await keyVaultService.refreshStatus().then(setVaultStatus);
    setTimeout(() => setHotSwapNotice(null), 4500);
  };

  const handleRotatePool = async (provider: KeyProviderType) => {
    audioVoiceService.playTone(850, 'triangle', 80);
    const res = await encryptedKeyVaultService.rotatePool(provider);
    if (res.success) {
      setHotSwapNotice(`[POOL ROTATED]: Switched to next ${provider.toUpperCase()} key (${res.activeId}).`);
      await keyVaultService.refreshStatus().then(setVaultStatus);
      setTimeout(() => setHotSwapNotice(null), 4500);
    }
  };

  const handlePingKey = async (provider: KeyProviderType, keyId: string) => {
    setIsPingingKey(keyId);
    audioVoiceService.playEarcon('ping');
    const res = await encryptedKeyVaultService.testKeyHealth(provider, keyId);
    setIsPingingKey(null);
    setKeyPingResults((prev) => ({
      ...prev,
      [keyId]: { latencyMs: res.latencyMs, status: res.healthy ? 'OK' : 'ERR' },
    }));
    if (res.healthy) {
      audioVoiceService.playEarcon('success');
      setHotSwapNotice(`[PROBE OK]: ${res.message}`);
    } else {
      audioVoiceService.playTone(330, 'sawtooth', 150);
      setHotSwapNotice(`[PROBE FAILED]: ${res.message}`);
    }
    setTimeout(() => setHotSwapNotice(null), 4500);
  };

  const handleExportVault = () => {
    audioVoiceService.playTone(1000, 'sine', 60);
    const blob = encryptedKeyVaultService.exportVaultBlob();
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(blob);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `hypervault-encrypted-backup-${Date.now()}.hypervault`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setHotSwapNotice('[VAULT EXPORTED]: AES-256 encrypted vault backup downloaded.');
    setTimeout(() => setHotSwapNotice(null), 4000);
  };

  const handleImportVault = async () => {
    if (!importJsonInput.trim()) return;
    try {
      const res = await encryptedKeyVaultService.importVaultBlob(importJsonInput.trim());
      setHotSwapNotice(`[VAULT IMPORTED]: Successfully restored ${res.count} encrypted key records.`);
      setImportJsonInput('');
      setShowImportBox(false);
      await keyVaultService.refreshStatus().then(setVaultStatus);
      setTimeout(() => setHotSwapNotice(null), 4500);
    } catch (err: any) {
      setHotSwapNotice(`[IMPORT ERROR]: ${err.message}`);
    }
  };

  const handleToggleLock = async () => {
    if (isEncryptedUnlocked) {
      await encryptedKeyVaultService.lockVault();
      setIsEncryptedUnlocked(false);
      audioVoiceService.playTone(400, 'sawtooth', 120);
      setHotSwapNotice('[VAULT LOCKED]: In-memory keys purged. Encrypted local store sealed.');
    } else {
      const ok = await encryptedKeyVaultService.unlockVaultWithPassphrase(passphraseInput);
      if (ok) {
        setIsEncryptedUnlocked(true);
        audioVoiceService.playEarcon('success');
        setHotSwapNotice('[VAULT UNLOCKED]: Web Crypto PBKDF2 key derived successfully.');
      } else {
        audioVoiceService.playTone(330, 'sawtooth', 150);
        setHotSwapNotice('[UNLOCK FAILED]: Invalid passphrase for AES-256-GCM vault.');
      }
    }
    setTimeout(() => setHotSwapNotice(null), 4000);
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyValue.trim()) return;
    setIsSubmittingKey(true);
    setKeySubmitFeedback(null);
    audioVoiceService.playTone(880, 'sine', 80);

    const res = await encryptedKeyVaultService.addKey(newKeyProvider, newKeyValue.trim(), newKeyLabel.trim() || undefined);
    setIsSubmittingKey(false);
    if (res.success) {
      setKeySubmitFeedback({ success: true, msg: res.message });
      setNewKeyValue('');
      setNewKeyLabel('');
      await keyVaultService.refreshStatus().then(setVaultStatus);
      audioVoiceService.playEarcon('success');
    } else {
      setKeySubmitFeedback({ success: false, msg: res.message });
      audioVoiceService.playTone(330, 'sawtooth', 150);
    }
  };

  const handleRunCodex = async () => {
    if (!codexPrompt.trim() || codexLoading) return;
    setCodexLoading(true);
    setCodexOutput('');
    audioVoiceService.playEarcon('command');

    const res = await keyVaultService.callCodex(codexPrompt, codexModel);
    setCodexLoading(false);
    if (res.success) {
      setCodexOutput(res.reply);
      setCodexKeyUsed(`${res.model} (Key: ${res.keyId})`);
      audioVoiceService.playEarcon('success');
    } else {
      setCodexOutput(`[ERROR]: ${res.error}`);
      audioVoiceService.playTone(330, 'sawtooth', 150);
    }
  };

  const handleComputeMath = () => {
    if (!mathExpr.trim()) return;
    audioVoiceService.playTone(1050, 'sine', 70);
    const res = synapseService.computeMath(mathExpr);
    setMathResult({
      expr: res.expression,
      val: res.result,
      residue: res.primeResidue,
      timeMs: res.timeMs,
    });
  };

  const handleGenerateTensor = () => {
    audioVoiceService.playTone(963, 'sine', 90);
    const tensor = synapseService.generateSynapticTensor(tensorDim);
    setTensorMatrix(tensor);
  };

  const handleVerify2Fa = () => {
    audioVoiceService.playTone(800, 'triangle', 80);
    const res = synapseService.verify2fa(twoFaCode);
    setTwoFaResult({ success: res.success, msg: res.message });
    if (res.success) audioVoiceService.playEarcon('success');
    else audioVoiceService.playTone(330, 'sawtooth', 120);
  };

  const handlePingPeer = async (host: string) => {
    setIsPinging(true);
    setPingOutput(`Sending WireGuard ICMP ping to ${host}...`);
    audioVoiceService.playEarcon('ping');
    const res = await tailscaleService.pingPeer(host);
    setPingOutput(res.output);
    setIsPinging(false);
    if (res.success) audioVoiceService.playEarcon('success');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 1500);
    audioVoiceService.playTone(1200, 'sine', 40);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-gradient-to-b from-[#090e1a] via-[#050811] to-[#020408] border border-cyan-500/40 shadow-[0_0_50px_rgba(0,242,255,0.25)] overflow-hidden text-slate-200 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/30 bg-black/50 select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,242,255,0.4)]">
              <Key className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-wider text-white">
                  HYPERTERMINAL MULTI-VAULT & SUBSYSTEMS
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ALWAYS-ON INSTANCE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-Provider Key Pools • Tailscale WireGuard Mesh • Synapse Mathematica • Codex Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/40 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800/80 bg-black/30 overflow-x-auto scrollbar-none select-none">
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2 rounded-t-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'vault'
                ? 'bg-[#090e1a] text-cyan-300 border-cyan-500/50 shadow-[0_-4px_12px_rgba(0,242,255,0.15)]'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>API KEY VAULT ({vaultStatus?.totalKeys || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('tailscale')}
            className={`px-4 py-2 rounded-t-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'tailscale'
                ? 'bg-[#090e1a] text-blue-300 border-blue-500/50 shadow-[0_-4px_12px_rgba(59,130,246,0.15)]'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>TAILSCALE MESH & SSO</span>
          </button>

          <button
            onClick={() => setActiveTab('synapse')}
            className={`px-4 py-2 rounded-t-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'synapse'
                ? 'bg-[#090e1a] text-purple-300 border-purple-500/50 shadow-[0_-4px_12px_rgba(168,85,247,0.15)]'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>SYNAPSE MATHEMATICA (963Hz)</span>
          </button>

          <button
            onClick={() => setActiveTab('codex')}
            className={`px-4 py-2 rounded-t-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'codex'
                ? 'bg-[#090e1a] text-amber-300 border-amber-500/50 shadow-[0_-4px_12px_rgba(245,158,11,0.15)]'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>OPENAI CODEX RUNNER</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* =========================================================================
              TAB 1: MULTI-PROVIDER API KEY VAULT
             ========================================================================= */}
          {activeTab === 'vault' && (
            <div className="space-y-5">
              {/* Hot-Swap Notice Banner */}
              {hotSwapNotice && (
                <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-400 text-cyan-200 text-xs font-mono flex items-center justify-between shadow-[0_0_20px_rgba(0,242,255,0.3)] animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="font-bold">{hotSwapNotice}</span>
                  </div>
                  <button
                    onClick={() => setHotSwapNotice(null)}
                    className="text-cyan-400 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
                  >
                    DISMISS
                  </button>
                </div>
              )}

              {/* Primary Provider Hot-Swap Switcher */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-cyan-950/30 to-black border border-cyan-500/40">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-extrabold text-white tracking-wider">
                      PRIMARY AI RUNTIME ENGINE // INSTANTANEOUS HOT-SWAP CONTROLLER
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    Zero-Downtime Multi-Engine Failover Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Option 1: Gemini */}
                  <div
                    onClick={() => handleHotSwapProvider('gemini')}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      activePrimaryProvider === 'gemini'
                        ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.25)]'
                        : 'bg-black/50 border-slate-800 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>GOOGLE GEMINI 3.8</span>
                      </div>
                      {activePrimaryProvider === 'gemini' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/30 text-cyan-300 border border-cyan-400 animate-pulse">
                          ACTIVE ENGINE
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-500">STANDBY</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mb-2">
                      Multi-turn duplex streaming, spatial topology & audio engram synthesis.
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHotSwapProvider('gemini');
                      }}
                      disabled={activePrimaryProvider === 'gemini'}
                      className={`w-full py-1 rounded text-[10px] font-bold transition cursor-pointer border ${
                        activePrimaryProvider === 'gemini'
                          ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/60 opacity-90'
                          : 'bg-black/60 text-slate-400 border-slate-700 hover:text-cyan-300 hover:border-cyan-500'
                      }`}
                    >
                      {activePrimaryProvider === 'gemini' ? 'CURRENTLY ENGAGED' : 'HOT-SWAP TO GEMINI'}
                    </button>
                  </div>

                  {/* Option 2: OpenAI */}
                  <div
                    onClick={() => handleHotSwapProvider('openai')}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      activePrimaryProvider === 'openai'
                        ? 'bg-purple-950/50 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                        : 'bg-black/50 border-slate-800 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-purple-300">
                        <Terminal className="w-3.5 h-3.5 text-purple-400" />
                        <span>OPENAI CODEX</span>
                      </div>
                      {activePrimaryProvider === 'openai' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/30 text-purple-300 border border-purple-400 animate-pulse">
                          ACTIVE ENGINE
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-500">STANDBY</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mb-2">
                      Token preservation codex runner & resilient secondary generation tier.
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHotSwapProvider('openai');
                      }}
                      disabled={activePrimaryProvider === 'openai'}
                      className={`w-full py-1 rounded text-[10px] font-bold transition cursor-pointer border ${
                        activePrimaryProvider === 'openai'
                          ? 'bg-purple-500/30 text-purple-200 border-purple-400/60 opacity-90'
                          : 'bg-black/60 text-slate-400 border-slate-700 hover:text-purple-300 hover:border-purple-500'
                      }`}
                    >
                      {activePrimaryProvider === 'openai' ? 'CURRENTLY ENGAGED' : 'HOT-SWAP TO CODEX'}
                    </button>
                  </div>

                  {/* Option 3: Autonomous Internal */}
                  <div
                    onClick={() => handleHotSwapProvider('internal')}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      activePrimaryProvider === 'internal'
                        ? 'bg-emerald-950/50 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                        : 'bg-black/50 border-slate-800 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300">
                        <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                        <span>AUTONOMOUS NEURAL CORE</span>
                      </div>
                      {activePrimaryProvider === 'internal' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400 animate-pulse">
                          ACTIVE ENGINE
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-500">STANDBY</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mb-2">
                      100% offline heuristic parser & prime Fermat mathematica engrams.
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHotSwapProvider('internal');
                      }}
                      disabled={activePrimaryProvider === 'internal'}
                      className={`w-full py-1 rounded text-[10px] font-bold transition cursor-pointer border ${
                        activePrimaryProvider === 'internal'
                          ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/60 opacity-90'
                          : 'bg-black/60 text-slate-400 border-slate-700 hover:text-emerald-300 hover:border-emerald-500'
                      }`}
                    >
                      {activePrimaryProvider === 'internal' ? 'CURRENTLY ENGAGED' : 'HOT-SWAP TO NEURAL'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Secure Encrypted Local Storage Module (AES-GCM 256 + PBKDF2) */}
              <div className="p-4 rounded-xl bg-black/50 border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        <span>ENCRYPTED LOCAL STORAGE VAULT</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          AES-256-GCM • PBKDF2 (100k rounds)
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Web Crypto hardware-isolated vault with zero unencrypted exposure.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                      isEncryptedUnlocked
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {isEncryptedUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{isEncryptedUnlocked ? 'VAULT UNLOCKED' : 'VAULT SEALED'}</span>
                    </span>

                    <button
                      onClick={handleExportVault}
                      className="px-2.5 py-1 rounded bg-black/60 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Download encrypted .hypervault backup"
                    >
                      <Download className="w-3 h-3" />
                      <span>EXPORT</span>
                    </button>

                    <button
                      onClick={() => setShowImportBox(!showImportBox)}
                      className="px-2.5 py-1 rounded bg-black/60 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Import encrypted .hypervault backup"
                    >
                      <Upload className="w-3 h-3" />
                      <span>IMPORT</span>
                    </button>
                  </div>
                </div>

                {/* Lock / Unlock Passphrase Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-mono">Master Passphrase:</span>
                  <input
                    type="password"
                    placeholder="Custom vault passphrase (optional)"
                    value={passphraseInput}
                    onChange={(e) => setPassphraseInput(e.target.value)}
                    className="flex-1 min-w-[180px] max-w-xs px-2.5 py-1 rounded bg-black/60 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button
                    onClick={handleToggleLock}
                    className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                      isEncryptedUnlocked
                        ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {isEncryptedUnlocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    <span>{isEncryptedUnlocked ? 'PURGE & LOCK' : 'UNLOCK VAULT'}</span>
                  </button>
                </div>

                {/* Import Box */}
                {showImportBox && (
                  <div className="mt-3 p-3 rounded-lg bg-black/80 border border-cyan-500/40 space-y-2">
                    <div className="text-[11px] text-cyan-300 font-bold">Paste Encrypted .hypervault JSON:</div>
                    <textarea
                      rows={3}
                      value={importJsonInput}
                      onChange={(e) => setImportJsonInput(e.target.value)}
                      placeholder='{"version": 1, "keys": [...]}'
                      className="w-full px-2.5 py-1.5 rounded bg-black/90 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowImportBox(false)}
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleImportVault}
                        className="px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400 text-xs font-bold cursor-pointer"
                      >
                        Restore Vault
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Provider Pools Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. Gemini Pool */}
                <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/30 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 font-bold text-xs text-cyan-300">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span>GEMINI POOL</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRotatePool('gemini')}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 cursor-pointer flex items-center gap-1"
                        title="Rotate to next Gemini key"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>ROTATE</span>
                      </button>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        {vaultStatus?.providers?.gemini?.poolSize || 0} KEYS
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-56 pr-1">
                    {vaultStatus?.providers?.gemini?.keys?.map((k) => (
                      <div
                        key={k.index}
                        className={`p-2.5 rounded-lg border text-[11px] ${
                          k.isActive
                            ? 'bg-cyan-950/40 border-cyan-400/60 shadow-[0_0_10px_rgba(0,242,255,0.15)]'
                            : 'bg-black/40 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{k.id}</span>
                          <span className={`text-[10px] font-bold ${k.isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                            {k.isActive ? 'ACTIVE' : 'STANDBY'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>{k.source}</span>
                          <span>Calls: {k.totalCalls} | Fails: {k.consecutiveFailures}</span>
                        </div>
                        {k.cooldownRemainingSec > 0 && (
                          <div className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Cooldown: {k.cooldownRemainingSec}s remaining</span>
                          </div>
                        )}
                        {keyPingResults[k.id] && (
                          <div className="text-[10px] text-emerald-400 mt-1 font-mono">
                            ⚡ Probe Response: {keyPingResults[k.id].latencyMs}ms ({keyPingResults[k.id].status})
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-1.5 mt-2 pt-1 border-t border-slate-800/40">
                          <button
                            onClick={() => handlePingKey('gemini', k.id)}
                            disabled={isPingingKey === k.id}
                            className="px-2 py-0.5 rounded text-[9px] font-bold bg-black/60 hover:bg-white/10 text-slate-300 border border-slate-700 cursor-pointer"
                          >
                            {isPingingKey === k.id ? 'PINGING...' : 'PING'}
                          </button>
                          {!k.isActive && (
                            <button
                              onClick={() => handleHotSwapKey('gemini', k.id)}
                              className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 cursor-pointer"
                            >
                              HOT-SWAP
                            </button>
                          )}
                        </div>
                      </div>
                    )) || <div className="text-slate-500 text-xs py-4 text-center">No keys registered</div>}
                  </div>
                </div>

                {/* 2. OpenAI Pool */}
                <div className="p-4 rounded-xl bg-black/40 border border-purple-500/30 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 font-bold text-xs text-purple-300">
                      <Terminal className="w-4 h-4 text-purple-400" />
                      <span>OPENAI CODEX POOL</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRotatePool('openai')}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 cursor-pointer flex items-center gap-1"
                        title="Rotate to next OpenAI key"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>ROTATE</span>
                      </button>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        {vaultStatus?.providers?.openai?.poolSize || 0} KEYS
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-56 pr-1">
                    {vaultStatus?.providers?.openai?.keys?.map((k) => (
                      <div
                        key={k.index}
                        className={`p-2.5 rounded-lg border text-[11px] ${
                          k.isActive
                            ? 'bg-purple-950/40 border-purple-400/60 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                            : 'bg-black/40 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{k.id}</span>
                          <span className={`text-[10px] font-bold ${k.isActive ? 'text-purple-400' : 'text-slate-500'}`}>
                            {k.isActive ? 'ACTIVE' : 'STANDBY'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>{k.source}</span>
                          <span>Calls: {k.totalCalls} | Fails: {k.consecutiveFailures}</span>
                        </div>
                        {k.cooldownRemainingSec > 0 && (
                          <div className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Cooldown: {k.cooldownRemainingSec}s remaining</span>
                          </div>
                        )}
                        {keyPingResults[k.id] && (
                          <div className="text-[10px] text-emerald-400 mt-1 font-mono">
                            ⚡ Probe Response: {keyPingResults[k.id].latencyMs}ms ({keyPingResults[k.id].status})
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-1.5 mt-2 pt-1 border-t border-slate-800/40">
                          <button
                            onClick={() => handlePingKey('openai', k.id)}
                            disabled={isPingingKey === k.id}
                            className="px-2 py-0.5 rounded text-[9px] font-bold bg-black/60 hover:bg-white/10 text-slate-300 border border-slate-700 cursor-pointer"
                          >
                            {isPingingKey === k.id ? 'PINGING...' : 'PING'}
                          </button>
                          {!k.isActive && (
                            <button
                              onClick={() => handleHotSwapKey('openai', k.id)}
                              className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/50 cursor-pointer"
                            >
                              HOT-SWAP
                            </button>
                          )}
                        </div>
                      </div>
                    )) || <div className="text-slate-500 text-xs py-4 text-center">No keys registered</div>}
                  </div>
                </div>

                {/* 3. IBM Quantum Pool */}
                <div className="p-4 rounded-xl bg-black/40 border border-blue-500/30 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 font-bold text-xs text-blue-300">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      <span>IBM QUANTUM & WATSON</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRotatePool('ibm_quantum')}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 cursor-pointer flex items-center gap-1"
                        title="Rotate to next IBM key"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>ROTATE</span>
                      </button>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        {vaultStatus?.providers?.ibm_quantum?.poolSize || 0} KEYS
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-56 pr-1">
                    {vaultStatus?.providers?.ibm_quantum?.keys?.map((k) => (
                      <div
                        key={k.index}
                        className={`p-2.5 rounded-lg border text-[11px] ${
                          k.isActive
                            ? 'bg-blue-950/40 border-blue-400/60 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                            : 'bg-black/40 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{k.id}</span>
                          <span className={`text-[10px] font-bold ${k.isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                            {k.isActive ? 'ACTIVE' : 'STANDBY'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>{k.source}</span>
                          <span>Calls: {k.totalCalls} | Fails: {k.consecutiveFailures}</span>
                        </div>
                        {keyPingResults[k.id] && (
                          <div className="text-[10px] text-emerald-400 mt-1 font-mono">
                            ⚡ Probe Response: {keyPingResults[k.id].latencyMs}ms ({keyPingResults[k.id].status})
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-1.5 mt-2 pt-1 border-t border-slate-800/40">
                          <button
                            onClick={() => handlePingKey('ibm_quantum', k.id)}
                            disabled={isPingingKey === k.id}
                            className="px-2 py-0.5 rounded text-[9px] font-bold bg-black/60 hover:bg-white/10 text-slate-300 border border-slate-700 cursor-pointer"
                          >
                            {isPingingKey === k.id ? 'PINGING...' : 'PING'}
                          </button>
                          {!k.isActive && (
                            <button
                              onClick={() => handleHotSwapKey('ibm_quantum', k.id)}
                              className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/50 cursor-pointer"
                            >
                              HOT-SWAP
                            </button>
                          )}
                        </div>
                      </div>
                    )) || <div className="text-slate-500 text-xs py-4 text-center">No keys registered</div>}
                  </div>
                </div>
              </div>

              {/* Add Key Form */}
              <div className="p-4 rounded-xl bg-black/50 border border-slate-800">
                <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>REGISTER NEW API KEY INTO SECURE PERSISTENT VAULT</span>
                </h3>
                <form onSubmit={handleAddKey} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">PROVIDER</label>
                      <select
                        value={newKeyProvider}
                        onChange={(e) => setNewKeyProvider(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI Codex</option>
                        <option value="ibm_quantum">IBM Quantum</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-400 mb-1">SECRET KEY STRING</label>
                      <input
                        type="password"
                        placeholder="sk-proj-... / AIza... / ibm-apikey-..."
                        value={newKeyValue}
                        onChange={(e) => setNewKeyValue(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">LABEL / SOURCE TAG</label>
                      <input
                        type="text"
                        placeholder="Operator_Primary"
                        value={newKeyLabel}
                        onChange={(e) => setNewKeyLabel(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[10px] text-slate-400">
                      *Keys are securely retained server-side in config/key_vault.json with zero raw exposure to clients.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmittingKey || !newKeyValue.trim()}
                      className="px-4 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isSubmittingKey ? 'STORING...' : 'ENCRYPT & STORE'}</span>
                    </button>
                  </div>
                  {keySubmitFeedback && (
                    <div className={`text-xs p-2 rounded-lg border ${
                      keySubmitFeedback.success ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                    }`}>
                      {keySubmitFeedback.msg}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: TAILSCALE WIREGUARD MESH & GOOGLE SIGN-IN
             ========================================================================= */}
          {activeTab === 'tailscale' && (
            <div className="space-y-4">
              {/* Header Telemetry Card */}
              <div className="p-4 rounded-xl bg-black/40 border border-blue-500/30">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${tailscaleStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="font-extrabold text-sm text-white">
                      TAILSCALE WIREGUARD MESH // {tailscaleStatus.tailnet}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      {tailscaleStatus.selfIp}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        if (tailscaleStatus.connected) {
                          await tailscaleService.disconnect();
                        } else {
                          await tailscaleService.connect();
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        tailscaleStatus.connected
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      }`}
                    >
                      {tailscaleStatus.connected ? 'DISCONNECT TUNNEL' : 'CONNECT TO TAILNET'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">GOOGLE AUTH SSO</div>
                    <div className="font-bold text-slate-100 truncate">{tailscaleStatus.authEmail}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">MAGIC DNS</div>
                    <div className="font-bold text-slate-100 truncate">{tailscaleStatus.magicDns}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">EXIT NODE</div>
                    <div className="font-bold text-cyan-300 truncate">{tailscaleStatus.activeExitNode || 'Direct Egress'}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">GATEWAY LATENCY</div>
                    <div className="font-bold text-emerald-300">{tailscaleStatus.latencyToGatewayMs} ms</div>
                  </div>
                </div>
              </div>

              {/* Peers Grid */}
              <div className="p-4 rounded-xl bg-black/40 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    <span>CONNECTED TAILNET PEERS ({tailscaleStatus.peers.length})</span>
                  </h3>
                  <div className="text-[10px] text-slate-400">
                    Subnets: {tailscaleStatus.allowedSubnets.join(', ')}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                        <th className="py-2 px-3">HOSTNAME</th>
                        <th className="py-2 px-3">IP ADDRESS</th>
                        <th className="py-2 px-3">OS RUNTIME</th>
                        <th className="py-2 px-3">LATENCY</th>
                        <th className="py-2 px-3">ROLE</th>
                        <th className="py-2 px-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {tailscaleStatus.peers.map((peer) => (
                        <tr key={peer.id} className="hover:bg-white/5 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{peer.hostname}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-cyan-300">{peer.ip}</td>
                          <td className="py-2.5 px-3 text-slate-400">{peer.os}</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400">{peer.latencyMs} ms</td>
                          <td className="py-2.5 px-3">
                            {peer.isExitNode ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                EXIT NODE
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Node</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handlePingPeer(peer.hostname)}
                              disabled={isPinging}
                              className="px-2.5 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[10px] font-bold transition cursor-pointer"
                            >
                              PING
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pingOutput && (
                  <div className="mt-3 p-3 rounded-lg bg-black/80 border border-blue-500/30 text-[11px] font-mono text-blue-200 whitespace-pre-wrap">
                    {pingOutput}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: SYNAPSE COMPUTATIONAL MATHEMATICA
             ========================================================================= */}
          {activeTab === 'synapse' && (
            <div className="space-y-4">
              {/* Daemon Status Banner */}
              <div className="p-4 rounded-xl bg-black/40 border border-purple-500/30">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400 animate-spin" />
                    <span className="font-extrabold text-sm text-white">
                      {synapseStatus.serviceLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      PID: {synapseStatus.pid}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {synapseStatus.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-xs font-mono text-purple-300">
                      Resonance: <span className="font-bold text-white">{synapseStatus.quantumResonanceHz} Hz</span> (963 Carrier)
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenSynapseBridge) onOpenSynapseBridge();
                        else if (onExecuteCommand) onExecuteCommand('synapse bridge');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500/30 to-cyan-500/30 hover:from-purple-500/40 hover:to-cyan-500/40 text-purple-200 border border-purple-400/60 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                    >
                      <Zap className="w-3 h-3 text-cyan-300 animate-pulse" />
                      <span>LAUNCH REASONING BRIDGE</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">SYNAPTIC ORDER</div>
                    <div className="font-bold text-slate-100">Order {synapseStatus.currentSynapseOrder}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">ACTIVE TENSORS</div>
                    <div className="font-bold text-cyan-300">{synapseStatus.activeTensors} Contractions</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">HARDWARE HASH</div>
                    <div className="font-bold text-slate-100 truncate">{synapseStatus.fingerprint.systemFingerprint.slice(0, 16)}...</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">IBM 2FA INTEGRITY</div>
                    <div className="font-bold text-emerald-300">
                      {synapseStatus.fingerprint.is2faVerified ? 'VALIDATED' : 'PENDING'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Math Evaluator & Tensor Generator */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. High-Integer Prime Math */}
                <div className="p-4 rounded-xl bg-black/40 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>PRIME MATHEMATICA EVALUATOR</span>
                    </h3>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={mathExpr}
                        onChange={(e) => setMathExpr(e.target.value)}
                        placeholder="sin(pi/4)*1000 + 432"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
                      />
                      <button
                        onClick={handleComputeMath}
                        className="px-4 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition cursor-pointer"
                      >
                        COMPUTE
                      </button>
                    </div>
                  </div>

                  {mathResult && (
                    <div className="p-3 rounded-lg bg-black/70 border border-purple-500/30 text-xs font-mono space-y-1">
                      <div className="text-slate-400">Computed: <span className="text-white">{mathResult.expr}</span></div>
                      <div className="text-emerald-400 font-bold text-sm">= {mathResult.val}</div>
                      <div className="text-[10px] text-purple-300">Fermat Residue (M61): {mathResult.residue}</div>
                      <div className="text-[10px] text-slate-500">Duration: {mathResult.timeMs} ms</div>
                    </div>
                  )}
                </div>

                {/* 2. Synaptic Tensor Generator */}
                <div className="p-4 rounded-xl bg-black/40 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span>SYNAPTIC TENSOR CONTRACTION</span>
                    </h3>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs text-slate-400 font-mono">Dimension:</span>
                      {[2, 3, 4, 5].map((d) => (
                        <button
                          key={d}
                          onClick={() => setTensorDim(d)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                            tensorDim === d
                              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400'
                              : 'bg-black/50 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {d}x{d}
                        </button>
                      ))}
                      <button
                        onClick={handleGenerateTensor}
                        className="ml-auto px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 text-xs font-bold transition cursor-pointer"
                      >
                        CONTRACT
                      </button>
                    </div>
                  </div>

                  {tensorMatrix && (
                    <div className="p-3 rounded-lg bg-black/70 border border-cyan-500/30 text-xs font-mono space-y-1">
                      <div className="text-[10px] text-slate-400">Trace: {tensorMatrix.trace} | Det: {tensorMatrix.determinant}</div>
                      <div className="text-[10px] text-cyan-300">Eigenvalues: [{tensorMatrix.eigenvaluesApprox.join(', ')}]</div>
                      <div className="text-[10px] text-emerald-400 font-bold">Resonance Score: {tensorMatrix.resonanceScore}% Coherent</div>
                    </div>
                  )}
                </div>
              </div>

              {/* IBM Granite 2FA Check */}
              <div className="p-4 rounded-xl bg-black/40 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>IBM GRANITE BRIDGE 2FA INTEGRITY VALIDATOR</span>
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Validates session hardware fingerprint against expected launchd auth stream.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={twoFaCode}
                    onChange={(e) => setTwoFaCode(e.target.value)}
                    placeholder="849201"
                    className="w-24 px-3 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-xs text-white text-center font-mono focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={handleVerify2Fa}
                    className="px-4 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition cursor-pointer"
                  >
                    VERIFY
                  </button>
                </div>
              </div>
              {twoFaResult && (
                <div className={`p-2.5 rounded-lg border text-xs font-mono ${
                  twoFaResult.success ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                }`}>
                  {twoFaResult.msg}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 4: OPENAI CODEX RUNNER
             ========================================================================= */}
          {activeTab === 'codex' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black/40 border border-amber-500/30">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-sm text-white">
                      OPENAI CODEX & MULTIMODAL CODE GENERATION
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Model:</span>
                    <select
                      value={codexModel}
                      onChange={(e) => setCodexModel(e.target.value)}
                      className="px-2.5 py-1 rounded bg-black/60 border border-slate-700 text-xs text-amber-300 focus:outline-none"
                    >
                      <option value="gpt-4o-mini">gpt-4o-mini (Codex Fast)</option>
                      <option value="gpt-4o">gpt-4o (Codex High-Power)</option>
                      <option value="gemini-3.8-flash">gemini-3.8-flash (Gemini Compat)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <textarea
                    rows={3}
                    value={codexPrompt}
                    onChange={(e) => setCodexPrompt(e.target.value)}
                    placeholder="Enter code generation directive or multimodal query..."
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      *Queries automatically route through OpenAI pool or fallback to Gemini compatibility.
                    </span>
                    <button
                      onClick={handleRunCodex}
                      disabled={codexLoading || !codexPrompt.trim()}
                      className="px-4 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{codexLoading ? 'SYNTHESIZING...' : 'EXECUTE CODEX'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {codexOutput && (
                <div className="p-4 rounded-xl bg-black/70 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Synthesized Result: <strong className="text-amber-300">{codexKeyUsed}</strong></span>
                    <button
                      onClick={() => copyToClipboard(codexOutput, 'codex-out')}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {copiedKeyId === 'codex-out' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKeyId === 'codex-out' ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-black/90 border border-slate-800 text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap font-mono">
                    {codexOutput}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-black/70 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 select-none">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>HyperTerminal Polyglot Quine Subsystems Online</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                if (onExecuteCommand) onExecuteCommand('help');
              }}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Terminal CLI Help
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
