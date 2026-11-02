import React, { useState, useEffect } from 'react';
import { Activity, Globe, Zap, RotateCcw, ShieldCheck, Radio, X } from 'lucide-react';
import { ravenEyeEngineService, PulsePayload } from '../services/raveneytePulseEngine';
import { ravenEyeStreamingService } from '../services/ravenEyeStreamingService';

interface RavenEyePulsePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RavenEyePulsePanel: React.FC<RavenEyePulsePanelProps> = ({ isOpen, onClose }) => {
  const [pulse, setPulse] = useState<PulsePayload | null>(null);
  const [streamCount, setStreamCount] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = ravenEyeStreamingService.subscribe((pulse) => {
      setPulse(pulse);
      setStreamCount(ravenEyeStreamingService.getSnapshot().length);
      setIsRunning(ravenEyeEngineService.getPulseEngine().isRunning());
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePulse = () => {
    const engine = ravenEyeEngineService.getPulseEngine();
    if (engine.isRunning()) {
      engine.stop();
      setIsRunning(false);
    } else {
      engine.start();
      setIsRunning(true);
    }
  };

  const plutoPhasePct = pulse ? ((pulse.cycle % 248) / 248) * 100 : 0;
  const pulseSymbol = pulse ? (pulse.phase < 0.5 ? '●' : '○') : '●';

  return (
    <div className="fixed bottom-20 right-6 z-50 w-96 rounded-xl border border-cyan-500/40 bg-slate-950/95 p-5 text-cyan-50 shadow-2xl backdrop-blur-md font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold text-cyan-300">RAVENEYTE TELEMETRY CORE</h3>
            <p className="text-[10px] text-slate-400">NEXTBENCHUP PULSE • PLANETARIUM PLUTO RETURN</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Live Pulse Metrics */}
      <div className="space-y-3">
        {/* NextBenchUp Pulse Engine */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-bold text-cyan-400">NEXTBENCHUP PULSE</span>
            <button
              onClick={togglePulse}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                isRunning
                  ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950 border-amber-500/50 text-amber-300'
              }`}
            >
              {isRunning ? 'PULSE ACTIVE (96 BPM)' : 'PAUSED'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-500">TICK</div>
              <div className="text-sm font-bold text-cyan-200">{pulse ? pulse.tick : 0}</div>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-500">CYCLE</div>
              <div className="text-sm font-bold text-cyan-200">{pulse ? pulse.cycle : 0}</div>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-500">PHASE</div>
              <div className="text-sm font-bold text-purple-300">
                {pulse ? pulse.phase.toFixed(2) : '0.00'}
              </div>
            </div>
          </div>

          {/* Phase Progress Bar */}
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-cyan-400 h-full transition-all duration-75"
              style={{ width: `${pulse ? pulse.phase * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Planetarium Pluto Return Core */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-300">PLANETARIUM // PLUTO RETURN</span>
            <span className="text-base text-cyan-400 font-bold">{pulseSymbol}</span>
          </div>
          <div className="text-[11px] text-slate-300 flex justify-between">
            <span>Orbit Phase (248-Cycle):</span>
            <span className="text-purple-300 font-bold">{plutoPhasePct.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-purple-500 h-full transition-all duration-300"
              style={{ width: `${plutoPhasePct}%` }}
            />
          </div>
        </div>

        {/* Agent Auto-Enhancer & Gateway Telemetry */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>AGENT AUTO-ENHANCE:</span>
            <span className="text-emerald-400 font-bold">{pulse?.agent_status || '[AGENT] steady state'}</span>
          </div>
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>GATEWAY TELEMETRY:</span>
            <span className="text-cyan-300 font-bold">{pulse?.gateway_data || 'online'}</span>
          </div>
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>STREAM BUFFER DEQUE:</span>
            <span className="text-slate-200 font-bold">{streamCount} / 4096</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
        <span>URL SYNC: http://127.0.0.1:8080/pulse</span>
        <span className="text-emerald-400">SYNAPTIC HOOK OK</span>
      </div>
    </div>
  );
};
