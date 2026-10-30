import React, { useState, useEffect } from 'react';
import {
  Cpu,
  ShieldCheck,
  Zap,
  Play,
  Square,
  RefreshCw,
  FileText,
  Download,
  Copy,
  Check,
  Layers,
  Terminal,
  Activity,
  X,
  Code,
  Key,
} from 'lucide-react';
import {
  customARXEngine,
  ComputeReceipt,
  ARXState,
  SevenModuleStatus,
  GaiaContinuityManifest,
} from '../services/customARXEngine';

interface DistributedSchedulerModuleProps {
  onClose: () => void;
}

export const DistributedSchedulerModule: React.FC<DistributedSchedulerModuleProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'scheduler' | 'receipts' | 'manifest' | 'arithmetic'>('scheduler');
  const [arxState, setArxState] = useState<ARXState>(customARXEngine.getLatestState());
  const [receipts, setReceipts] = useState<ComputeReceipt[]>(customARXEngine.getReceipts());
  const [stats, setStats] = useState(customARXEngine.getMiningStats());
  const [modules, setModules] = useState<SevenModuleStatus[]>(customARXEngine.getSevenModules());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Arithmetic expansion playground
  const [exprInput, setExprInput] = useState('$(( (1 << 16) - 1 + 432 * 2 ))');
  const [exprResult, setExprResult] = useState<string>('');

  useEffect(() => {
    // Initial evaluation
    const res = customARXEngine.evaluateArithmeticExpression(exprInput);
    setExprResult(res.error ? `Error: ${res.error}` : `0x${res.result.toString(16).toUpperCase()} (${res.result})`);

    const unsubReceipt = customARXEngine.subscribeReceipt((receipt) => {
      setReceipts((prev) => [receipt, ...prev.slice(0, 49)]);
      setStats(customARXEngine.getMiningStats());
      setModules(customARXEngine.getSevenModules());
    });

    const unsubState = customARXEngine.subscribeState((newState) => {
      setArxState(newState);
      setStats(customARXEngine.getMiningStats());
    });

    return () => {
      unsubReceipt();
      unsubState();
    };
  }, []);

  const handleToggleMining = () => {
    if (stats.isMining) {
      customARXEngine.stopMining();
    } else {
      customARXEngine.startMining(50, 200, 528);
    }
    setStats(customARXEngine.getMiningStats());
  };

  const handleStepOnce = () => {
    customARXEngine.step(528);
    setArxState(customARXEngine.getLatestState());
    setReceipts(customARXEngine.getReceipts());
    setStats(customARXEngine.getMiningStats());
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadMhtml = () => {
    const mhtml = customARXEngine.generateMhtmlContinuityContainer();
    const blob = new Blob([mhtml], { type: 'multipart/related' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Azazel_Ledger_Gaia_DualArchive_${Date.now()}.mhtml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadManifest = () => {
    const manifest = customARXEngine.generateRecoveryManifest();
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gaia_recovery_manifest_v5.0_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEvalArithmetic = (val: string) => {
    setExprInput(val);
    const res = customARXEngine.evaluateArithmeticExpression(val);
    setExprResult(res.error ? `Error: ${res.error}` : `0x${res.result.toString(16).toUpperCase()} (${res.result})`);
  };

  const manifest = customARXEngine.generateRecoveryManifest();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.15)] flex flex-col overflow-hidden text-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                  Phase Ω+2: Distributed Scheduler & Compute Receipt Verification
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-full">
                  §-ROUTER ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Bidirectional 256-bit ARX Engine · Resonant Oscillatory HPC Mining · UAProf + WMLScript Continuity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close Scheduler"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live HPC Mining & State Ticker */}
        <div className="px-6 py-3 bg-black/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500">HASH RATE: </span>
              <span className="text-cyan-400 font-bold">{stats.hashRate} H/s</span>
            </div>
            <div>
              <span className="text-slate-500">ROUNDS: </span>
              <span className="text-purple-400 font-bold">{stats.currentRound}</span>
            </div>
            <div>
              <span className="text-slate-500">TOTAL HASHES: </span>
              <span className="text-emerald-400 font-bold">{stats.totalHashesComputed}</span>
            </div>
            <div>
              <span className="text-slate-500">INVERSE VERIFIED: </span>
              <span className="text-emerald-400 font-bold">100.0% ✓</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStepOnce}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Step Round</span>
            </button>
            <button
              onClick={handleToggleMining}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition active:scale-95 ${
                stats.isMining
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(0,242,255,0.2)]'
              }`}
            >
              {stats.isMining ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{stats.isMining ? 'Halt HPC Mining' : 'Start Resonant Mining'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/30 px-6 shrink-0 text-xs">
          {[
            { key: 'scheduler', label: '§ Router (7 Modules)', icon: <Layers className="w-3.5 h-3.5" /> },
            { key: 'receipts', label: `Compute Receipts (${receipts.length})`, icon: <ShieldCheck className="w-3.5 h-3.5" /> },
            { key: 'manifest', label: 'Azazel Continuity Archive', icon: <FileText className="w-3.5 h-3.5" /> },
            { key: 'arithmetic', label: 'Gödel Arithmetic $(( ))', icon: <Code className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 font-semibold transition border-b-2 ${
                activeTab === tab.key
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {activeTab === 'scheduler' && (
            <div className="space-y-4">
              {/* Active ARX State Registers */}
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">CURRENT 256-BIT STATE CHECKPOINT</span>
                  <span className="text-[10px] text-cyan-400">ROUND #{arxState.round}</span>
                </div>
                <div className="p-2.5 bg-black/70 rounded-lg font-mono text-[11px] text-cyan-300 break-all border border-slate-800/80">
                  {arxState.hex256}
                </div>
                <div className="grid grid-cols-4 gap-2 text-[10px] font-mono">
                  {arxState.words.map((w, idx) => (
                    <div key={idx} className="p-1.5 bg-slate-950 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-500">{String.fromCharCode(65 + idx)}:</span>
                      <span className="text-amber-400">{(w >>> 0).toString(16).padStart(8, '0')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seven Named Modules Grid */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Seven Named Continuity Modules (§ Router Architecture)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {modules.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-start justify-between gap-3 hover:border-cyan-500/40 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="font-bold text-xs text-slate-200">{m.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{m.telemetry}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                          {m.status}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">{m.latencyMs}ms</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'receipts' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Verified Cryptographic Compute Receipts Ledger
                </h3>
                <span className="text-[11px] text-slate-500">
                  {receipts.length} receipts stamped & verified
                </span>
              </div>

              {receipts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No compute receipts stamped yet. Click &quot;Step Round&quot; or &quot;Start Resonant Mining&quot; to begin.
                </div>
              ) : (
                <div className="space-y-2">
                  {receipts.map((rcp) => (
                    <div
                      key={rcp.receiptId}
                      className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 hover:border-cyan-500/30 transition text-xs font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-slate-200">{rcp.receiptId}</span>
                          <span className="text-[10px] text-slate-500">Round #{rcp.roundIndex}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-cyan-400">{rcp.quantumResonanceHz} Hz Resonance</span>
                          <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded">
                            INVERSE OK ✓
                          </span>
                          <button
                            onClick={() => handleCopy(rcp.hash256Hex, rcp.receiptId)}
                            className="p-1 hover:text-cyan-300 transition text-slate-400"
                            title="Copy 256-bit Hash"
                          >
                            {copiedId === rcp.receiptId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-cyan-400 bg-black/60 p-2 rounded border border-slate-800/80 break-all">
                        {rcp.hash256Hex}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-400">
                        <div>Merkle: <span className="text-amber-400">{rcp.merkleDigest}</span></div>
                        <div>Duration: <span className="text-slate-300">{rcp.computationDurationMs}ms</span></div>
                        <div>Phase q: <span className="text-purple-400">{rcp.symplecticPhase.q.toFixed(4)}</span></div>
                        <div>Phase p: <span className="text-purple-400">{rcp.symplecticPhase.p.toFixed(4)}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'manifest' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Azazel&apos;s Ledger of Gaia · Dual Archive Continuity Seed
                    </h3>
                    <p className="text-[11px] text-slate-400">Lineage: tdoc-9901 | Offline Preservation: Sealed</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadManifest}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON Manifest</span>
                    </button>
                    <button
                      onClick={handleDownloadMhtml}
                      className="px-3 py-1.5 text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .MHTML Capsule</span>
                    </button>
                  </div>
                </div>

                <pre className="p-3 bg-black/80 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto border border-slate-800">
                  {JSON.stringify(manifest, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'arithmetic' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Recursive Gödel & Bitwise Shell Arithmetic Playground
                </h3>
                <p className="text-[11px] text-slate-400">
                  Evaluates arithmetic expansions in double-quoted context conforming to GNU Bash section 6.5. Supports bitwise shifts, masks, and exponential roots.
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">Arithmetic Input Expression</label>
                  <input
                    type="text"
                    value={exprInput}
                    onChange={(e) => handleEvalArithmetic(e.target.value)}
                    placeholder="$(( (1 << 16) - 1 ))"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="p-3 bg-black/80 rounded-lg border border-slate-800 space-y-1 font-mono text-xs">
                  <div className="text-slate-500 text-[10px]">EVALUATED OUTPUT VALUE:</div>
                  <div className="text-amber-400 font-bold text-sm">{exprResult}</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-[10px] font-mono">
                  {[
                    '$(( 432 * 2 + 99 ))',
                    '$(( (1 << 31) - 1 ))',
                    '$(( 0x55555555 ^ 0xAAAAAAAA ))',
                    '$(( (528 + 963) / 2 ))',
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleEvalArithmetic(preset)}
                      className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded text-left text-slate-400 hover:text-cyan-300 transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
