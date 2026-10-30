import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Square,
  Zap,
  Activity,
  Layers,
  Cpu,
  Radio,
  Server,
  RefreshCw,
  Trash2,
  Sliders,
  CheckCircle,
  Shield
} from 'lucide-react';
import {
  swarmTelemetryService,
  SwarmStats,
  DispatchLedgerEntry
} from '../services/swarmTelemetryService';
import { advancedMathEngine } from '../services/advancedMathEngine';

interface SwarmTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwarmTelemetryModal: React.FC<SwarmTelemetryModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<SwarmStats>(() => swarmTelemetryService.getStats());
  const [ledger, setLedger] = useState<DispatchLedgerEntry[]>([]);
  const [autoReallocate, setAutoReallocate] = useState(true);
  const [circuitBreaker, setCircuitBreaker] = useState(true);

  const swarmCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const oscCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = swarmTelemetryService.subscribe((s) => {
      setStats(s);
      setLedger([...swarmTelemetryService.ledger]);
    });
    return unsub;
  }, [isOpen]);

  // Canvas render loop for Swarm Topology Ring & Oscilloscope
  useEffect(() => {
    if (!isOpen) return;

    const render = () => {
      // 1. Swarm Canvas
      const sc = swarmCanvasRef.current;
      if (sc) {
        const ctx = sc.getContext('2d');
        if (ctx) {
          const w = (sc.width = sc.clientWidth);
          const h = (sc.height = sc.clientHeight);
          const cx = w / 2;
          const cy = h / 2;
          const time = Date.now() * 0.001;

          ctx.fillStyle = '#020409';
          ctx.fillRect(0, 0, w, h);

          // Center Hub Ring
          ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 28 + Math.sin(time * 3) * 3, 0, 2 * Math.PI);
          ctx.stroke();

          // Hub Core
          ctx.fillStyle = '#00f3ff';
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
          ctx.fill();

          // Concentric Reference Mesh
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.beginPath();
          ctx.arc(cx, cy, 65, 0, 2 * Math.PI);
          ctx.arc(cx, cy, 105, 0, 2 * Math.PI);
          ctx.stroke();

          // Agents
          const agents = swarmTelemetryService.swarmAgents;
          agents.forEach((ag) => {
            const curAngle = ag.angle + time * 0.25;
            const radius = Math.min(w, h) * 0.36;
            const ax = cx + Math.cos(curAngle) * radius;
            const ay = cy + Math.sin(curAngle) * radius;
            const loadRatio = Math.min(1, ag.load / ag.capacity);

            // Beam from center
            ctx.strokeStyle =
              ag.tier === 'edge'
                ? `rgba(0, 243, 255, ${0.15 + loadRatio * 0.6})`
                : ag.tier === 'compute'
                ? `rgba(245, 158, 11, ${0.15 + loadRatio * 0.6})`
                : `rgba(168, 85, 247, ${0.15 + loadRatio * 0.6})`;
            ctx.lineWidth = 1 + loadRatio * 2.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ax, ay);
            ctx.stroke();

            // Node
            ctx.fillStyle = ag.tier === 'edge' ? '#00f3ff' : ag.tier === 'compute' ? '#f59e0b' : '#a855f7';
            ctx.beginPath();
            ctx.arc(ax, ay, 4 + loadRatio * 4, 0, 2 * Math.PI);
            ctx.fill();

            if (loadRatio > 0.25) {
              ctx.fillStyle = 'rgba(0, 255, 153, 0.35)';
              ctx.beginPath();
              ctx.arc(ax, ay, 8 + loadRatio * 6, 0, 2 * Math.PI);
              ctx.fill();
            }
          });
        }
      }

      // 2. Oscilloscope Canvas
      const oc = oscCanvasRef.current;
      if (oc) {
        const octx = oc.getContext('2d');
        if (octx) {
          const w = (oc.width = oc.clientWidth);
          const h = (oc.height = oc.clientHeight);

          octx.fillStyle = '#020409';
          octx.fillRect(0, 0, w, h);

          // Grid Lines
          octx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          octx.lineWidth = 1;
          for (let y = 0; y < h; y += 25) {
            octx.beginPath();
            octx.moveTo(0, y);
            octx.lineTo(w, y);
            octx.stroke();
          }

          const inHist = swarmTelemetryService.inputHistory;
          const outHist = swarmTelemetryService.outputHistory;
          if (inHist.length >= 2) {
            const stepX = w / (inHist.length - 1);
            const maxVal = Math.max(8000, ...inHist);

            // Influx Line (Cyan)
            octx.strokeStyle = '#00f3ff';
            octx.lineWidth = 2;
            octx.beginPath();
            inHist.forEach((val, i) => {
              const x = i * stepX;
              const y = h - (val / maxVal) * (h * 0.8) - 8;
              if (i === 0) octx.moveTo(x, y);
              else octx.lineTo(x, y);
            });
            octx.stroke();

            // Handled Line (Neon Green)
            octx.strokeStyle = '#00ff99';
            octx.lineWidth = 1.5;
            octx.beginPath();
            outHist.forEach((val, i) => {
              const x = i * stepX;
              const y = h - (val / maxVal) * (h * 0.8) - 8;
              if (i === 0) octx.moveTo(x, y);
              else octx.lineTo(x, y);
            });
            octx.stroke();

            // Zero-Error Baseline
            octx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
            octx.setLineDash([4, 4]);
            octx.beginPath();
            octx.moveTo(0, h - 8);
            octx.lineTo(w, h - 8);
            octx.stroke();
            octx.setLineDash([]);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none font-mono">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-[#050811] border border-cyan-500/40 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.15)] text-slate-100">
        
        {/* Header Deck */}
        <div className="p-3.5 px-5 bg-[#080d1a] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-bold font-orbitron">
              ⨋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold tracking-wider text-white font-orbitron">
                  ⨋Ⓖန⇔နⒼ⨋ // SWARM TELEMETRY & PROJECT X HANDLER
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ZERO-STRESS ENGINE
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                16K Dynamic Agent Balancer • Loss-Free RingBuffer • ADAM Proof Gates (Project X)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => swarmTelemetryService.toggle()}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                stats.isRunning
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,243,255,0.4)]'
              }`}
            >
              {stats.isRunning ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{stats.isRunning ? 'HALT SWARM' : 'START SWARM'}</span>
            </button>

            <button
              onClick={() => swarmTelemetryService.injectBurst(5000)}
              className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Inject 5,000 packet surge into RingBuffer"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>SURGE (5k)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Gauges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-black/60 border-b border-slate-800 text-xs">
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col">
            <span className="text-[9px] text-slate-400">PACKET THROUGHPUT</span>
            <span className="text-cyan-300 font-bold">{stats.packetRate.toLocaleString()} pkts/s</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col">
            <span className="text-[9px] text-slate-400">TOTAL DISPATCHED</span>
            <span className="text-emerald-300 font-bold">{stats.totalDispatched.toLocaleString()}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col">
            <span className="text-[9px] text-slate-400">RINGBUFFER SATURATION</span>
            <span className="text-amber-300 font-bold">{stats.saturationPct}% ({stats.stressIndex})</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col">
            <span className="text-[9px] text-slate-400">ACTIVE SWARM UNITS</span>
            <span className="text-purple-300 font-bold">{stats.agentCount} Nodes (0.00% Drops)</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Row 1: Source Selector & Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Source Ingestion Selector */}
            <div className="md:col-span-5 p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-400" />
                  TELEMETRY INGESTION HIGHWAY
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {stats.isRunning ? 'STREAM ACTIVE' : 'STANDBY'}
                </span>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Source Highway Pipeline:</label>
                <select
                  value={stats.source}
                  onChange={(e) => swarmTelemetryService.setSource(e.target.value)}
                  className="w-full bg-[#030612] border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-cyan-400"
                >
                  <option value="harvester-360">HOP-251 HarvesterWeb 360 NVMe Slot Highway (714 MB/s)</option>
                  <option value="neural-sdf">Unified Neural SDF Clifford Rotor & Manifold Entropy Stream</option>
                  <option value="quantum-resonance">Sum-Integral Quantum Resonance & Bathymetry Array</option>
                  <option value="omni-macro">OmniAutomation multi-layer Playwright & Macro Burst</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded bg-black/60 border border-slate-800/80">
                  <span className="text-slate-400 block">Backpressure Cap</span>
                  <span className="text-emerald-300 font-bold">{swarmTelemetryService.ringBuffer.capacity.toLocaleString()} pkts</span>
                </div>
                <div className="p-2 rounded bg-black/60 border border-slate-800/80">
                  <span className="text-slate-400 block">Rebalance Latency</span>
                  <span className="text-cyan-300 font-bold">{stats.rebalanceLatencyMs} ms</span>
                </div>
              </div>
            </div>

            {/* Ingestion Rate & Swarm Size Sliders */}
            <div className="md:col-span-7 p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  DYNAMIC REALLOCATION CONTROLLER
                </span>
                <span className="text-[10px] text-slate-400">Adaptive Flow Rate</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Ingestion Flow Rate:</span>
                    <span className="text-cyan-300 font-bold">{stats.flowRate.toLocaleString()}/s</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="8000"
                    step="100"
                    value={stats.flowRate}
                    onChange={(e) => swarmTelemetryService.setFlowRate(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Swarm Node Allocation:</span>
                    <span className="text-amber-300 font-bold">{stats.agentCount} Nodes</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="64"
                    step="2"
                    value={stats.agentCount}
                    onChange={(e) => swarmTelemetryService.initSwarm(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px] pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoReallocate}
                    onChange={(e) => setAutoReallocate(e.target.checked)}
                    className="accent-cyan-400"
                  />
                  <span>Auto-Reallocate Agents</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={circuitBreaker}
                    onChange={(e) => setCircuitBreaker(e.target.checked)}
                    className="accent-emerald-400"
                  />
                  <span>Zero-Drop Guarantee</span>
                </label>
              </div>
            </div>

          </div>

          {/* Row 2: Visual Canvas Displays */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Swarm Agent Topology Map (Cols 1-7) */}
            <div className="md:col-span-7 p-3 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  AGENT CLUSTER TOPOLOGY (EDGE / COMPUTE / SINK)
                </span>
                <span className="text-[10px] text-slate-400">Live Orbit Vectors</span>
              </div>
              <div className="w-full h-56 bg-[#020409] rounded-lg border border-slate-900 overflow-hidden relative">
                <canvas ref={swarmCanvasRef} className="w-full h-full block" />
              </div>
            </div>

            {/* Bit-Diffusion Oscilloscope (Cols 8-12) */}
            <div className="md:col-span-5 p-3 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  ENTROPY OSCILLOSCOPE (BIT-DIFFUSION)
                </span>
                <span className="text-[10px] text-cyan-400">Cyan: Influx | Green: Output</span>
              </div>
              <div className="w-full h-56 bg-[#020409] rounded-lg border border-slate-900 overflow-hidden relative">
                <canvas ref={oscCanvasRef} className="w-full h-full block" />
              </div>
            </div>

          </div>

          {/* Row 3: Dispatch Ledger */}
          <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                REAL-TIME AGENT DISPATCH TRANSACTION LEDGER
              </span>
              <button
                onClick={() => swarmTelemetryService.clearLedger()}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 text-xs pr-1">
              {ledger.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-[11px]">
                  No dispatch transactions recorded yet. Click 'START SWARM' to route telemetry.
                </div>
              ) : (
                ledger.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2 rounded bg-black/60 border border-slate-800/80 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          entry.tier === 'EDGE'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : entry.tier === 'COMPUTE'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        [{entry.tier}] Node #{entry.agentId}
                      </span>
                      <span className="text-slate-300 font-mono">
                        {entry.source} ({entry.sampleType})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-bold">+{entry.count} pkts</span>
                      <span className="text-slate-500 text-[10px]">{entry.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
