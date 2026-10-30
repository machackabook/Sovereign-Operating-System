import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  Terminal,
  X,
  CheckCircle,
  Copy,
  Check,
  Send,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import {
  synapseReasoningEngine,
  MathematicalReasoningType,
  MathematicalReasoningResult,
  REASONING_PRESETS,
  ReasoningPreset,
} from '../services/synapseReasoningEngine';
import { synapseService, SynapseStatus } from '../services/synapseService';
import { audioVoiceService } from '../services/audioVoiceService';

interface SynapseBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportToTerminal?: (text: string) => void;
}

export const SynapseBridgeModal: React.FC<SynapseBridgeModalProps> = ({
  isOpen,
  onClose,
  onExportToTerminal,
}) => {
  const [synapseStatus, setSynapseStatus] = useState<SynapseStatus>(() => synapseService.getStatus());
  const [selectedType, setSelectedType] = useState<MathematicalReasoningType>('riemann_zeta');
  const [inputValues, setInputValues] = useState<Record<string, any>>({
    s: 2,
    terms: 500,
    candidate: '849201928374',
    n: 104729,
    dimension: 4,
    baseFrequency: 963.0,
    qubits: 2,
  });

  const [activeResult, setActiveResult] = useState<MathematicalReasoningResult | null>(() =>
    synapseReasoningEngine.solve('riemann_zeta', { s: 2, terms: 500 })
  );

  const [isComputing, setIsComputing] = useState(false);
  const [copiedProof, setCopiedProof] = useState(false);
  const [exportedNotice, setExportedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = synapseService.onStatusChange(setSynapseStatus);
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ReasoningPreset) => {
    audioVoiceService.playTone(880, 'sine', 60);
    setSelectedType(preset.type);
    setInputValues((prev) => ({ ...prev, ...preset.defaultInputs }));
    const result = synapseReasoningEngine.solve(preset.type, preset.defaultInputs);
    setActiveResult(result);
  };

  const handleCompute = () => {
    setIsComputing(true);
    audioVoiceService.playTone(963, 'sine', 100);
    setTimeout(() => {
      const res = synapseReasoningEngine.solve(selectedType, inputValues);
      setActiveResult(res);
      setIsComputing(false);
      audioVoiceService.playEarcon('success');
    }, 120);
  };

  const handleExportToTerminal = () => {
    if (!activeResult) return;
    audioVoiceService.playEarcon('stream');

    if (onExportToTerminal) {
      onExportToTerminal(activeResult.formattedTerminalStream);
    }

    setExportedNotice('STREAMED TO ACTIVE HYPERTERMINAL STREAM');
    setTimeout(() => setExportedNotice(null), 3000);
  };

  const handleCopyProof = () => {
    if (!activeResult) return;
    navigator.clipboard?.writeText(activeResult.formattedTerminalStream);
    setCopiedProof(true);
    audioVoiceService.playTone(1200, 'sine', 40);
    setTimeout(() => setCopiedProof(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-gradient-to-b from-[#0c0817] via-[#07050f] to-[#020205] border border-purple-500/40 shadow-[0_0_60px_rgba(168,85,247,0.25)] overflow-hidden text-slate-200 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-purple-500/30 bg-black/60 select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-wider text-white">
                  SYNAPSE REASONING BRIDGE // HYPERTERMINAL INTEGRATION
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  963 Hz COHERENT
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Complex Mathematical Proofs • Fermat Residue Field • Dynamic Terminal Stream Exporter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-black/40 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="px-5 py-2.5 bg-purple-950/20 border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Substrate Daemon:</span>
            <span className="font-bold text-white">{synapseStatus.serviceLabel}</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] border border-purple-500/40">
              PID {synapseStatus.pid}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <div className="text-slate-400">
              Carrier: <span className="text-purple-300 font-bold">{synapseStatus.quantumResonanceHz} Hz</span>
            </div>
            <div className="text-slate-400">
              Synaptic Order: <span className="text-cyan-300 font-bold">Order {synapseStatus.currentSynapseOrder}</span>
            </div>
            <div className="text-slate-400">
              Active Tensors: <span className="text-emerald-300 font-bold">{synapseStatus.activeTensors}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Preset Buttons */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>MATHEMATICAL REASONING PRESET THEOREMS:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {REASONING_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    selectedType === p.type
                      ? 'bg-purple-950/50 border-purple-400/80 shadow-[0_0_15px_rgba(168,85,247,0.25)] text-white'
                      : 'bg-black/40 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-white/5'
                  }`}
                >
                  <div className="font-bold text-xs truncate mb-1">{p.title}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-2">{p.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Form & Controls */}
          <div className="p-4 rounded-xl bg-black/50 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {selectedType === 'riemann_zeta' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-400">Exponent s:</label>
                    <input
                      type="number"
                      step="1"
                      min="2"
                      max="8"
                      value={inputValues.s}
                      onChange={(e) => setInputValues({ ...inputValues, s: Number(e.target.value) })}
                      className="w-16 px-2.5 py-1 rounded bg-black/70 border border-purple-500/40 text-white text-center focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-400">Terms:</label>
                    <input
                      type="number"
                      step="100"
                      min="50"
                      max="10000"
                      value={inputValues.terms}
                      onChange={(e) => setInputValues({ ...inputValues, terms: Number(e.target.value) })}
                      className="w-24 px-2.5 py-1 rounded bg-black/70 border border-purple-500/40 text-white text-center focus:outline-none"
                    />
                  </div>
                </>
              )}

              {selectedType === 'prime_mersenne' && (
                <div className="flex items-center gap-2">
                  <label className="text-slate-400">Integer Candidate N:</label>
                  <input
                    type="text"
                    value={inputValues.candidate}
                    onChange={(e) => setInputValues({ ...inputValues, candidate: e.target.value })}
                    className="w-48 px-2.5 py-1 rounded bg-black/70 border border-purple-500/40 text-white focus:outline-none"
                  />
                </div>
              )}

              {selectedType === 'euler_totient' && (
                <div className="flex items-center gap-2">
                  <label className="text-slate-400">Target n:</label>
                  <input
                    type="number"
                    min="2"
                    max="1000000"
                    value={inputValues.n}
                    onChange={(e) => setInputValues({ ...inputValues, n: Number(e.target.value) })}
                    className="w-28 px-2.5 py-1 rounded bg-black/70 border border-purple-500/40 text-white text-center focus:outline-none"
                  />
                </div>
              )}

              {selectedType === 'synaptic_tensor' && (
                <div className="flex items-center gap-2">
                  <label className="text-slate-400">Matrix Dimension:</label>
                  {[2, 3, 4, 5, 6].map((d) => (
                    <button
                      key={d}
                      onClick={() => setInputValues({ ...inputValues, dimension: d })}
                      className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
                        inputValues.dimension === d
                          ? 'bg-purple-500/40 text-purple-200 border border-purple-400 font-bold'
                          : 'bg-black/60 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {d}x{d}
                    </button>
                  ))}
                </div>
              )}

              {selectedType === 'harmonic_solfeggio' && (
                <div className="flex items-center gap-2">
                  <label className="text-slate-400">Carrier Frequency:</label>
                  {[432, 528, 963].map((f) => (
                    <button
                      key={f}
                      onClick={() => setInputValues({ ...inputValues, baseFrequency: f })}
                      className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                        inputValues.baseFrequency === f
                          ? 'bg-purple-500/40 text-purple-200 border border-purple-400 font-bold'
                          : 'bg-black/60 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {f} Hz
                    </button>
                  ))}
                </div>
              )}

              {selectedType === 'quantum_hadamard' && (
                <div className="flex items-center gap-2">
                  <label className="text-slate-400">Qubits:</label>
                  {[1, 2, 3, 4].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInputValues({ ...inputValues, qubits: q })}
                      className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
                        inputValues.qubits === q
                          ? 'bg-purple-500/40 text-purple-200 border border-purple-400 font-bold'
                          : 'bg-black/60 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {q} Qubit{q > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCompute}
                disabled={isComputing}
                className="px-4 py-1.5 rounded-lg bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 border border-purple-400/60 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>{isComputing ? 'DERIVING...' : 'COMPUTE PROOF'}</span>
              </button>
            </div>
          </div>

          {/* Results Display */}
          {activeResult && (
            <div className="space-y-4">
              {/* Proof Header Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-cyan-950/20 to-black/60 border border-purple-500/40">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-extrabold text-sm text-white">{activeResult.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-bold text-cyan-300">{activeResult.metrics.executionTimeMs} ms</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400">Fermat Residue:</span>
                    <span className="font-bold text-purple-300">{activeResult.metrics.primeResidue}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 mb-2 leading-relaxed">
                  <span className="text-purple-400 font-bold">LEMMA: </span>
                  {activeResult.formalTheorem}
                </div>

                <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800 text-xs text-slate-400">
                  <strong className="text-white">Problem Statement:</strong> {activeResult.problemStatement}
                </div>
              </div>

              {/* Step-by-Step Reasoning Chain */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DETERMINISTIC REASONING DERIVATIONS:</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {activeResult.steps.map((s) => (
                    <div
                      key={s.stepIndex}
                      className="p-3 rounded-xl bg-black/50 border border-purple-500/20 flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            STEP {s.stepIndex}
                          </span>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> VERIFIED
                          </span>
                        </div>
                        <div className="font-bold text-xs text-white mb-1">{s.title}</div>
                        <div className="p-2 rounded bg-black/70 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                          {s.formula}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 mb-1.5 leading-snug">{s.explanation}</div>
                        <div className="p-1.5 rounded bg-purple-950/30 border border-purple-500/30 text-xs font-bold text-emerald-300 text-right">
                          {s.outputValue}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Solution & QED Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-purple-950/30 to-black/60 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>FINAL CONVERGED SOLUTION:</span>
                  </div>
                  <div className="text-sm font-extrabold text-white">{activeResult.finalSolution}</div>
                  <div className="text-xs text-purple-300 font-italic">{activeResult.qed}</div>
                </div>

                {/* Stream Exporter Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyProof}
                    className="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-slate-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedProof ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedProof ? 'COPIED' : 'COPY'}</span>
                  </button>

                  <button
                    onClick={handleExportToTerminal}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-emerald-500/30 hover:from-cyan-500/40 hover:to-emerald-500/40 text-cyan-200 border border-cyan-400/60 text-xs font-extrabold shadow-[0_0_20px_rgba(0,242,255,0.25)] transition flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-cyan-400" />
                    <span>EXPORT TO HYPERTERMINAL STREAM</span>
                  </button>
                </div>
              </div>

              {exportedNotice && (
                <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{exportedNotice}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-black/70 border-t border-purple-500/20 flex items-center justify-between text-[11px] text-slate-400 select-none">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span>Synapse Mathematica Bi-Directional Bridge Synchronized</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500">Run 'synapse bridge' or 'synapse compute' in terminal</span>
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
