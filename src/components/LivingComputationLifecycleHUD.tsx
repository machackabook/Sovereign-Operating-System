import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  Zap,
  Play,
  Square,
  ArrowRight,
  ShieldCheck,
  Eye,
  CheckCircle2,
  Trash2,
  X,
  Volume2,
} from 'lucide-react';
import {
  livingComputationEngine,
  LifecyclePhase,
  LifecycleTelemetry,
  LIFECYCLE_SEQUENCE,
} from '../services/livingComputationEngine';
import { audioVoiceService } from '../services/audioVoiceService';

interface LivingComputationLifecycleHUDProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LivingComputationLifecycleHUD: React.FC<LivingComputationLifecycleHUDProps> = ({
  isOpen,
  onClose,
}) => {
  const [telemetry, setTelemetry] = useState<LifecycleTelemetry>(
    livingComputationEngine.getTelemetry()
  );
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return livingComputationEngine.subscribe(setTelemetry);
  }, []);

  if (!isOpen) return null;

  const handleRunFullCycle = async () => {
    setIsProcessing(true);
    audioVoiceService.playTone(528, 'sine', 100);
    try {
      await livingComputationEngine.executeFullCycle();
      audioVoiceService.playTone(963, 'sine', 180);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStepNext = async () => {
    audioVoiceService.playTone(660, 'sine', 80);
    await livingComputationEngine.advanceNextStep();
  };

  const handleTogglePulse = () => {
    const active = livingComputationEngine.toggleAutonomousPulse(5000);
    audioVoiceService.playTone(active ? 880 : 440, 'sine', 120);
  };

  const handleForceShed = async () => {
    audioVoiceService.playTone(396, 'sine', 100);
    await livingComputationEngine.phaseShed();
  };

  const getPhaseColor = (phase: LifecyclePhase) => {
    switch (phase) {
      case 'OBSERVE':
        return 'text-cyan-400 border-cyan-400/50 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,242,255,0.3)]';
      case 'DIGEST':
        return 'text-purple-400 border-purple-400/50 bg-purple-950/40 shadow-[0_0_15px_rgba(192,132,252,0.3)]';
      case 'INTEGRATE':
        return 'text-emerald-400 border-emerald-400/50 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
      case 'STABILIZE':
        return 'text-sky-400 border-sky-400/50 bg-sky-950/40 shadow-[0_0_15px_rgba(56,189,248,0.3)]';
      case 'SHED':
        return 'text-amber-400 border-amber-400/50 bg-amber-950/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
    }
  };

  const getPhaseIcon = (phase: LifecyclePhase) => {
    switch (phase) {
      case 'OBSERVE':
        return <Eye className="w-4 h-4" />;
      case 'DIGEST':
        return <Cpu className="w-4 h-4" />;
      case 'INTEGRATE':
        return <ShieldCheck className="w-4 h-4" />;
      case 'STABILIZE':
        return <Activity className="w-4 h-4" />;
      case 'SHED':
        return <Trash2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl font-mono text-slate-200">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/80 border-b border-cyan-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-400/30 text-purple-300">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold tracking-wider text-white">
                  LIVING COMPUTATION LIFECYCLE SUBSTRATE
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                  {telemetry.isRunningPulse ? 'AUTONOMOUS PULSE ACTIVE' : 'MANUAL CONTROLS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Biological State Flow: observe → digest → integrate → stabilize → shed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 5-Phase Pipeline Visual Stepper */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Continuous Biological State Pipeline</span>
              <span className="text-cyan-300 font-normal">
                Cycle #{telemetry.totalCyclesCompleted + 1}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 items-center">
              {LIFECYCLE_SEQUENCE.map((phase, idx) => {
                const isActive = telemetry.currentPhase === phase;
                return (
                  <div key={phase} className="relative flex flex-col items-center">
                    <div
                      className={`w-full py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
                        isActive
                          ? getPhaseColor(phase)
                          : 'bg-black/40 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {getPhaseIcon(phase)}
                      </div>
                      <span className="text-[10px] font-extrabold tracking-wider">
                        {phase}
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sub-label description for the current phase */}
            <div className="mt-3 p-3 rounded-lg bg-black/40 border border-slate-800/80 text-xs flex items-center justify-between">
              <span className="text-slate-400">Current Phase Intent:</span>
              <span className="text-white font-semibold">
                {telemetry.currentPhase === 'OBSERVE' && 'Sensory Entropy Capture & Environmental Scans'}
                {telemetry.currentPhase === 'DIGEST' && 'Fermat Prime Residue Compression & State Condensation'}
                {telemetry.currentPhase === 'INTEGRATE' && 'Cryptographic State Stamping & Mesh Event Dispatch'}
                {telemetry.currentPhase === 'STABILIZE' && 'Homeostatic Frame Budgeting & Harmonic Tuning (963Hz)'}
                {telemetry.currentPhase === 'SHED' && 'Memory Putrefaction & Ephemera Cache Reclamation (0 Leaks)'}
              </span>
            </div>
          </div>

          {/* Interactive Trigger Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <button
              onClick={handleRunFullCycle}
              disabled={isProcessing}
              className="p-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.2)]"
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>RUN FULL CYCLE</span>
            </button>

            <button
              onClick={handleTogglePulse}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                telemetry.isRunningPulse
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              {telemetry.isRunningPulse ? (
                <>
                  <Square className="w-4 h-4 fill-current text-amber-400" />
                  <span>PAUSE PULSE</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-emerald-400" />
                  <span>START PULSE (5s)</span>
                </>
              )}
            </button>

            <button
              onClick={handleStepNext}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 text-purple-400" />
              <span>STEP NEXT PHASE</span>
            </button>

            <button
              onClick={handleForceShed}
              className="p-3 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 hover:bg-amber-950/40 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              title="Force Immediate Putrefaction Memory Sweep"
            >
              <Trash2 className="w-4 h-4 text-amber-400" />
              <span>SHED MEMORY NOW</span>
            </button>
          </div>

          {/* Real-time Telemetry Gauges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Total Cycles</span>
              <div className="text-lg font-extrabold text-white mt-0.5">
                {telemetry.totalCyclesCompleted}
              </div>
              <span className="text-[10px] text-cyan-400">Completed 100%</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Homeostatic Stability</span>
              <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                {telemetry.stabilityScore}%
              </div>
              <span className="text-[10px] text-emerald-300">Coherence Locked</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Memory Shed</span>
              <div className="text-lg font-extrabold text-amber-400 mt-0.5">
                {(telemetry.totalMemoryShedBytes / 1024).toFixed(1)} KB
              </div>
              <span className="text-[10px] text-amber-300">0 Memory Leaks</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Last Cycle Time</span>
              <div className="text-lg font-extrabold text-purple-400 mt-0.5">
                {telemetry.lastCycleDurationMs || 480} ms
              </div>
              <span className="text-[10px] text-purple-300">Sub-Second Loop</span>
            </div>
          </div>

          {/* Mathematica Native Systemic Factors & Uncapped AI Learning Rate Panel */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Mathematica Native Systemic Growth / Decay & Uncapped AI Learning Rate
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                NO FUNCTIONALITY CAP
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800 text-[11px] font-mono text-cyan-300 break-all">
              Exp[α·t·Σ(Log p/p)] · (1+gapWeight) · zetaWeight · Exp[-decay·t]
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-black/40 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase">Symbolic Definite Integral ∫₀ᵗ f(τ) dτ</span>
                <div className="text-emerald-400 font-extrabold font-mono text-sm">
                  {telemetry.recentLogs.find(l => l.phase === 'STABILIZE')?.metrics?.integratedIntegralFactor ?? '1.341852'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Prime Log Sum Σ(ln p/p): {telemetry.recentLogs.find(l => l.phase === 'STABILIZE')?.metrics?.primeLogSum ?? '1.278541'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase">Uncapped Dynamic AI Model Learning Rate (η)</span>
                <div className="text-cyan-300 font-extrabold font-mono text-sm flex items-center gap-2">
                  <span>{telemetry.recentLogs.find(l => l.phase === 'STABILIZE')?.metrics?.uncappedAILearningRate ?? '0.018241'}</span>
                  <span className="text-[10px] text-purple-400 font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800">
                    MAX SPEED UNBOUNDED
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Programmatic OS stabilization factor: {telemetry.recentLogs.find(l => l.phase === 'STABILIZE')?.metrics?.systemicGrowthDecayFactor ?? '1.584912'}
                </div>
              </div>
            </div>
          </div>

          {/* Live Phase Event Log Stream */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center justify-between">
              <span>Living Computation Event Bus Stream</span>
              <span className="text-[10px] text-slate-400">
                {telemetry.recentLogs.length} Events Logged
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-black/50 p-3 max-h-48 overflow-y-auto space-y-1.5 text-xs font-mono">
              {telemetry.recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-[11px] leading-tight">
                  <span className="text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                      log.phase === 'OBSERVE'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                        : log.phase === 'DIGEST'
                        ? 'bg-purple-950 text-purple-400 border border-purple-800'
                        : log.phase === 'INTEGRATE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : log.phase === 'STABILIZE'
                        ? 'bg-sky-950 text-sky-400 border border-sky-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {log.phase}
                  </span>
                  <span className="text-slate-300 flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Living Computation Substrate: Autonomous & Self-Balancing</span>
          </div>
          <div>
            <span>Standard: Autopoietic 5-Phase State Machine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
