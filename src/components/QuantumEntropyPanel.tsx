import React, { useEffect, useState } from 'react';
import { EnvironmentState } from '../types';
import { Zap, Activity, AlertCircle } from 'lucide-react';

interface QuantumEntropyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  envState: EnvironmentState;
}

export const QuantumEntropyPanel: React.FC<QuantumEntropyPanelProps> = ({
  isOpen,
  onClose,
  envState,
}) => {
  const { jitterMs, packetLossPct } = envState.d3Stream;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0a0f1d] border border-cyan-500/50 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/30 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/40">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wider uppercase">Quantum Entropy Metrics</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Real-time Jitter & Packet Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Jitter Gauge */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-cyan-300">JITTER LATENCY</span>
              <span className="text-2xl font-black text-white tabular-nums">{jitterMs.toFixed(1)} <span className="text-xs text-slate-500 font-normal">ms</span></span>
            </div>
            <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-rose-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (jitterMs / 50) * 100)}%` }}
              />
            </div>
          </div>

          {/* Packet Loss Gauge */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-rose-300">PACKET LOSS</span>
              <span className="text-2xl font-black text-white tabular-nums">{packetLossPct.toFixed(2)} <span className="text-xs text-slate-500 font-normal">%</span></span>
            </div>
            <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-rose-500 transition-all duration-300"
                style={{ width: `${Math.min(100, packetLossPct * 10)}%` }}
              />
            </div>
          </div>

          {/* Status Indicator */}
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${packetLossPct > 5 ? 'bg-rose-950/30 border-rose-500/30' : 'bg-emerald-950/30 border-emerald-500/30'}`}>
            <Activity className={`w-5 h-5 ${packetLossPct > 5 ? 'text-rose-400' : 'text-emerald-400'}`} />
            <div>
              <p className="text-xs font-bold text-white">System Coherence Status</p>
              <p className="text-[10px] text-slate-400">
                {packetLossPct > 5 ? 'High entropy environment. Stability compromised.' : 'System stable. Entropy within nominal parameters.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
