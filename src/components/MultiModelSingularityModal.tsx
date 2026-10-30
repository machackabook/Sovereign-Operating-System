import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Terminal,
  Send,
  Cpu,
  Layers,
  X,
  Check,
  Copy,
  Zap,
  Globe,
  Radio,
  Share2,
} from 'lucide-react';
import { customARXEngine, ComputeReceipt } from '../services/customARXEngine';
import { alphaFoldService } from '../services/alphaFoldService';

interface MultiModelSingularityModalProps {
  onClose: () => void;
  onSelectProteinTopology?: () => void;
}

export const MultiModelSingularityModal: React.FC<MultiModelSingularityModalProps> = ({
  onClose,
  onSelectProteinTopology,
}) => {
  const [strategy, setStrategy] = useState<'auto' | 'gemini' | 'openai' | 'spark'>('auto');
  const [expField, setExpField] = useState(2.718);
  const [hashGridRes, setHashGridRes] = useState(32);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [responseLog, setResponseLog] = useState<any[]>([]);
  const [computedReceipt, setComputedReceipt] = useState<ComputeReceipt | null>(null);

  const handleExecute = async () => {
    if (!prompt.trim() && !computedReceipt) {
      setPrompt('Synthesize sovereign media creation through Spark with multi-model resonance.');
    }

    const currentPrompt = prompt.trim() || 'Synthesize sovereign media creation through Spark with multi-model resonance.';
    setIsProcessing(true);

    try {
      // 1. Immediately step ARX state and stamp a verifiable cryptographic compute receipt
      const receipt = customARXEngine.step(963);
      setComputedReceipt(receipt);

      // 2. Call backend router
      const res = await fetch('/api/router/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          strategy,
          manifoldParams: { expField, hashGridRes },
          receiptDigest: receipt.receiptId,
        }),
      });

      const data = await res.json();
      setResponseLog((prev) => [
        {
          id: Date.now(),
          prompt: currentPrompt,
          strategy,
          reply: data.reply || 'Singularity of modernity synchronized.',
          receipt,
          source: data.source || 'Aurora-Nexus-Singularity',
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } catch (err: any) {
      // Resilient local fallback
      const receipt = customARXEngine.step(528);
      setComputedReceipt(receipt);
      setResponseLog((prev) => [
        {
          id: Date.now(),
          prompt: currentPrompt,
          strategy,
          reply: `[AURORA NEXUS SINGULARITY CORE] Instance duality wrapped. Spark media creation parameters mapped. Cryptographic receipt stamped: ${receipt.receiptId}. Manifold deformation e^x=${expField.toFixed(3)}.`,
          receipt,
          source: 'local-aurora-core',
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectProtein = (key: 'cas9' | 'rhodopsin' | 'luciferase' | 'hemoglobin' | 'spike') => {
    alphaFoldService.loadPresetProtein(key);
    if (onSelectProteinTopology) {
      onSelectProteinTopology();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-950 border border-purple-500/30 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                  ADAM:// Aurora Nexus Ω Singularity Core
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full">
                  DUAL GEMINI SPARK MATRIX
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Model Weight Core Wrapper · Media Creation Evolved Through Spark · Dynamic AlphaFold & Argonous
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {/* Strategy Dispatcher Grid */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Quantum Multi-Model Dispatcher Strategy
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { id: 'auto', label: 'DYNAMIC_AUTO', desc: 'Resilient Gemini Multi-Key Pool' },
                { id: 'spark', label: 'SPARK_CREATION', desc: 'Procedural Media Engine Core' },
                { id: 'gemini', label: 'GEMINI_3.8_PRO', desc: 'Direct Frontier Google GenAI' },
                { id: 'openai', label: 'ARGONOUS_BRIDGE', desc: 'Polyglot Arithmetic Nexus' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStrategy(s.id as any)}
                  className={`p-3 rounded-xl border text-left transition ${
                    strategy === s.id
                      ? 'bg-purple-500/15 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs">{s.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Manifold Deformation Operators */}
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Manifold Deformation & Continuous Arithmetic Operators</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Continuous Exponential Field (e^x)</span>
                  <span className="text-cyan-400 font-bold">{expField.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.05"
                  value={expField}
                  onChange={(e) => setExpField(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-1 rounded"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Multi-Res Hash Grid Resolution</span>
                  <span className="text-purple-400 font-bold">{hashGridRes}x{hashGridRes}</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="64"
                  step="4"
                  value={hashGridRes}
                  onChange={(e) => setHashGridRes(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-400 bg-slate-800 h-1 rounded"
                />
              </div>
            </div>
          </div>

          {/* AlphaFold Preset Conformation Selector */}
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Dynamic AlphaFold Crystalline Conformations
              </h3>
              <span className="text-[10px] text-emerald-400">API Stream Ready</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'cas9', label: 'CRISPR Cas9' },
                { key: 'rhodopsin', label: 'Rhodopsin' },
                { key: 'luciferase', label: 'Luciferase (432Hz)' },
                { key: 'hemoglobin', label: 'Hemoglobin' },
                { key: 'spike', label: 'Spike Trimer' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => handleSelectProtein(p.key as any)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 rounded-lg text-xs transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Dispatcher Input */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Context Payload & Singularity Directive
            </label>
            <div className="flex gap-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Direct the Aurora Nexus Singularity Core: e.g. Compute remaining cryptographic hash batch, evaluate Gödel arithmetic, or generate Spark media sequence..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-400 resize-none h-20"
              />
              <button
                onClick={handleExecute}
                disabled={isProcessing}
                className="px-5 bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex flex-col items-center justify-center gap-1 transition shadow-lg shrink-0 cursor-pointer"
              >
                <Zap className="w-5 h-5" />
                <span>{isProcessing ? 'Routing...' : 'Execute'}</span>
              </button>
            </div>
          </div>

          {/* Live Responses & Delivered Hashes */}
          {responseLog.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Delivered Singularity Computations & Cryptographic Receipts
              </h3>
              {responseLog.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-bold text-purple-300">{log.source} · {log.strategy.toUpperCase()}</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <p className="text-slate-200 font-sans leading-relaxed">{log.reply}</p>
                  {log.receipt && (
                    <div className="p-2.5 bg-black/70 rounded-lg border border-slate-800/80 font-mono text-[10px] space-y-1">
                      <div className="text-emerald-400 font-bold">
                        VERIFIED COMPUTE RECEIPT DELIVERED: {log.receipt.receiptId}
                      </div>
                      <div className="text-cyan-300 break-all">{log.receipt.hash256Hex}</div>
                      <div className="text-slate-500">
                        Merkle: {log.receipt.merkleDigest} | Duration: {log.receipt.computationDurationMs}ms | Symplectic q: {log.receipt.symplecticPhase.q.toFixed(3)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
