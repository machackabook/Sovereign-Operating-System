import React, { useRef, useEffect, useState } from 'react';
import { dynamicListeningService } from '../services/dynamicListeningService';
import { Activity, Zap, Sparkles, Sliders, Volume2, ShieldCheck, Maximize2 } from 'lucide-react';

export interface VisualSpectrumAnalyzerProps {
  bloomIntensity?: number;
  audioReactiveLevel?: number;
  isListening?: boolean;
  onUpdateBloom?: (bloom: number) => void;
  onUpdateAudioReactive?: (level: number) => void;
  compact?: boolean;
}

export type VisualizerMode = 'BARS' | 'CURVE' | 'RADIAL';

export const VisualSpectrumAnalyzer: React.FC<VisualSpectrumAnalyzerProps> = ({
  bloomIntensity = 1.2,
  audioReactiveLevel = 1.0,
  isListening = true,
  onUpdateBloom,
  onUpdateAudioReactive,
  compact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('BARS');
  const [bandCount, setBandCount] = useState<number>(36);
  const [currentIntensity, setCurrentIntensity] = useState<number>(0.2);
  const [peakDb, setPeakDb] = useState<number>(-34);
  const [isMicLive, setIsMicLive] = useState<boolean>(false);
  const [sensitivityBoost, setSensitivityBoost] = useState<number>(1.0);
  const [showControls, setShowControls] = useState<boolean>(false);

  // Peak hold buffers
  const peakHoldRef = useRef<number[]>(new Array(48).fill(0));
  const peakHoldDecayRef = useRef<number[]>(new Array(48).fill(0));

  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let smoothedIntensity = 0.15;

    const render = () => {
      // Query spectrum snapshot from dynamicListeningService
      const spectrum = dynamicListeningService.getLiveSpectrum(bandCount);
      setIsMicLive(spectrum.isLiveMic);

      const effectiveReactive = audioReactiveLevel * sensitivityBoost;
      const rawIntensity = spectrum.intensity * (isListening ? 1.0 : 0.2);
      smoothedIntensity += (rawIntensity - smoothedIntensity) * 0.2;
      setCurrentIntensity(smoothedIntensity);

      const computedDb = Math.max(-60, Math.min(0, Math.round(20 * Math.log10(Math.max(1e-3, spectrum.peak * effectiveReactive)))));
      setPeakDb(computedDb);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Base background gradient with dynamic bloom tint
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, 'rgba(4, 10, 24, 0.95)');
      bgGrad.addColorStop(1, 'rgba(2, 6, 16, 0.98)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle frequency grid lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.08)';
      for (let y = 0.2; y <= 0.8; y += 0.2) {
        ctx.beginPath();
        ctx.moveTo(0, height * y);
        ctx.lineTo(width, height * y);
        ctx.stroke();
      }

      // Solfeggio resonance markers vertical lines (432Hz ~ 20% width, 528Hz ~ 38% width, 963Hz ~ 70% width)
      const solfeggioFrequencies = [
        { label: '432Hz', xRatio: 0.20, color: 'rgba(192, 132, 252, ' },
        { label: '528Hz', xRatio: 0.38, color: 'rgba(0, 242, 255, ' },
        { label: '963Hz', xRatio: 0.70, color: 'rgba(52, 211, 153, ' },
      ];

      solfeggioFrequencies.forEach((sf) => {
        const x = width * sf.xRatio;
        const resonanceAlpha = (0.15 + smoothedIntensity * 0.45) * Math.min(2.0, bloomIntensity);
        ctx.strokeStyle = `${sf.color}${resonanceAlpha})`;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, 15);
        ctx.lineTo(x, height - 15);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label at top
        ctx.font = '9px monospace';
        ctx.fillStyle = `${sf.color}${Math.min(1.0, resonanceAlpha + 0.3)})`;
        ctx.fillText(sf.label, x - 14, 12);
      });

      // Data array processing with peak hold
      const data = spectrum.data;
      if (peakHoldRef.current.length !== data.length) {
        peakHoldRef.current = new Array(data.length).fill(0);
        peakHoldDecayRef.current = new Array(data.length).fill(0);
      }

      const glowBlur = Math.round((8 + smoothedIntensity * 20) * bloomIntensity);

      if (mode === 'BARS') {
        const barSpacing = 3;
        const totalBarWidth = (width - 20) / data.length;
        const barWidth = Math.max(2, totalBarWidth - barSpacing);
        const startX = 10;
        const usableHeight = height - 30;

        for (let i = 0; i < data.length; i++) {
          const rawVal = data[i] * (isListening ? 1.0 : 0.15);
          const scaledVal = Math.min(1.0, rawVal * effectiveReactive);
          const barHeight = Math.max(3, scaledVal * usableHeight);
          const x = startX + i * totalBarWidth;
          const y = height - 15 - barHeight;

          // Update peak hold
          if (scaledVal >= peakHoldRef.current[i]) {
            peakHoldRef.current[i] = scaledVal;
            peakHoldDecayRef.current[i] = 0;
          } else {
            peakHoldDecayRef.current[i] += 0.008;
            peakHoldRef.current[i] = Math.max(0, peakHoldRef.current[i] - peakHoldDecayRef.current[i]);
          }

          // Bar gradient from bottom to top
          const barGrad = ctx.createLinearGradient(0, height - 15, 0, y);
          const hueProgress = i / data.length;
          
          if (hueProgress < 0.33) {
            // Bass / Low Mids: Cyan to Aqua
            barGrad.addColorStop(0, 'rgba(0, 242, 255, 0.4)');
            barGrad.addColorStop(1, 'rgba(6, 182, 212, 0.95)');
          } else if (hueProgress < 0.66) {
            // Mids / Solfeggio 528: Violet to Lavender
            barGrad.addColorStop(0, 'rgba(147, 51, 234, 0.4)');
            barGrad.addColorStop(1, 'rgba(192, 132, 252, 0.95)');
          } else {
            // Highs / Brilliance: Emerald to Gold
            barGrad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
            barGrad.addColorStop(1, 'rgba(52, 211, 153, 0.95)');
          }

          // Draw Glowing Bar
          ctx.save();
          ctx.shadowBlur = glowBlur;
          ctx.shadowColor = hueProgress < 0.5 ? 'rgba(0, 242, 255, 0.6)' : 'rgba(192, 132, 252, 0.6)';
          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();
          ctx.restore();

          // Peak hold cap
          const peakY = height - 15 - Math.max(3, peakHoldRef.current[i] * usableHeight);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(x, peakY - 2, barWidth, 1.5);
        }
      } else if (mode === 'CURVE') {
        const usableHeight = height - 35;
        const step = width / (data.length - 1);

        ctx.save();
        ctx.shadowBlur = glowBlur * 1.3;
        ctx.shadowColor = 'rgba(0, 242, 255, 0.7)';

        ctx.beginPath();
        ctx.moveTo(0, height - 15);

        for (let i = 0; i < data.length; i++) {
          const rawVal = data[i] * (isListening ? 1.0 : 0.15);
          const scaledVal = Math.min(1.0, rawVal * effectiveReactive);
          const x = i * step;
          const y = height - 15 - scaledVal * usableHeight;

          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            const prevX = (i - 1) * step;
            const prevVal = Math.min(1.0, (data[i - 1] * (isListening ? 1.0 : 0.15)) * effectiveReactive);
            const prevY = height - 15 - prevVal * usableHeight;
            const cpX = (prevX + x) / 2;
            ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
          }
        }

        ctx.lineTo(width, height - 15);
        ctx.closePath();

        // Translucent neon gradient fill under curve
        const curveGrad = ctx.createLinearGradient(0, 0, 0, height);
        curveGrad.addColorStop(0, `rgba(0, 242, 255, ${0.45 * Math.min(1.5, bloomIntensity)})`);
        curveGrad.addColorStop(0.5, `rgba(168, 85, 247, ${0.25 * Math.min(1.5, bloomIntensity)})`);
        curveGrad.addColorStop(1, 'rgba(2, 6, 23, 0.1)');
        ctx.fillStyle = curveGrad;
        ctx.fill();

        // Stroke line
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.stroke();
        ctx.restore();
      } else if (mode === 'RADIAL') {
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(centerX, centerY) * (0.35 + smoothedIntensity * 0.25);
        const maxExtend = Math.min(centerX, centerY) * 0.55;

        ctx.save();
        ctx.shadowBlur = glowBlur * 1.2;
        ctx.shadowColor = 'rgba(0, 242, 255, 0.8)';

        // Inner pulsing core
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 242, 255, ${0.15 + smoothedIntensity * 0.4})`;
        ctx.fill();

        // Radial rays
        const angleStep = (Math.PI * 2) / data.length;
        for (let i = 0; i < data.length; i++) {
          const angle = i * angleStep;
          const rawVal = data[i] * (isListening ? 1.0 : 0.15);
          const scaledVal = Math.min(1.0, rawVal * effectiveReactive);
          const rayLen = baseRadius + scaledVal * maxExtend;

          const x1 = centerX + Math.cos(angle) * baseRadius;
          const y1 = centerY + Math.sin(angle) * baseRadius;
          const x2 = centerX + Math.cos(angle) * rayLen;
          const y2 = centerY + Math.sin(angle) * rayLen;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 242, 255, 0.85)' : 'rgba(192, 132, 252, 0.85)';
          ctx.stroke();
        }
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [mode, bandCount, bloomIntensity, audioReactiveLevel, isListening, sensitivityBoost]);

  // Dynamic pulsing aura intensity calculation for container CSS
  const auraGlow = Math.round(18 * bloomIntensity * currentIntensity);
  const pulseScale = 1.0 + currentIntensity * 0.02 * audioReactiveLevel;

  return (
    <div
      className="relative rounded-2xl border border-cyan-500/40 bg-slate-950/90 overflow-hidden shadow-2xl transition-all duration-100"
      style={{
        boxShadow: `0 0 ${auraGlow}px rgba(0, 242, 255, ${0.25 * bloomIntensity})`,
        transform: `scale(${pulseScale})`,
      }}
    >
      {/* Visual Spectrum Analyzer Deck Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-black/70 border-b border-cyan-500/30 gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 transition-transform duration-75"
            style={{
              transform: `scale(${1 + currentIntensity * 0.3})`,
              boxShadow: `0 0 ${12 * bloomIntensity * currentIntensity}px rgba(0, 242, 255, 0.8)`,
            }}
          >
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white tracking-wider uppercase">
                Acoustic Spectrum Analyzer
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold border transition ${
                  isMicLive
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-800 text-cyan-300 border-cyan-500/30'
                }`}
              >
                {isMicLive ? 'LIVE MIC BUS' : 'SYNTH TELEMETRY'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>Intensity: <strong className="text-cyan-300">{Math.round(currentIntensity * 100)}%</strong></span>
              <span>·</span>
              <span>Peak: <strong className={peakDb > -6 ? 'text-amber-400' : 'text-emerald-400'}>{peakDb} dBFS</strong></span>
              <span>·</span>
              <span>Global Bloom: <strong className="text-purple-300">{bloomIntensity.toFixed(1)}x</strong></span>
              <span>·</span>
              <span>Audio Reactive: <strong className="text-cyan-300">{audioReactiveLevel.toFixed(1)}x</strong></span>
            </div>
          </div>
        </div>

        {/* Mode Selector and Quick Actions */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg bg-black/60 p-0.5 border border-slate-800 text-[10px]">
            <button
              onClick={() => setMode('BARS')}
              className={`px-2 py-1 rounded font-bold transition ${
                mode === 'BARS' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bars
            </button>
            <button
              onClick={() => setMode('CURVE')}
              className={`px-2 py-1 rounded font-bold transition ${
                mode === 'CURVE' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              Curve
            </button>
            <button
              onClick={() => setMode('RADIAL')}
              className={`px-2 py-1 rounded font-bold transition ${
                mode === 'RADIAL' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              Radial
            </button>
          </div>

          <button
            onClick={() => setShowControls((prev) => !prev)}
            className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
              showControls
                ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Configure Spectrum Analyzer Bloom & Reactive Sensitivities"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">Sync Tuning</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative p-2.5 bg-black/40">
        <canvas
          ref={canvasRef}
          width={compact ? 540 : 720}
          height={compact ? 130 : 170}
          className="w-full h-auto rounded-xl block cursor-crosshair"
          style={{
            filter: `drop-shadow(0 0 ${Math.round(8 * bloomIntensity * currentIntensity)}px rgba(0, 242, 255, 0.4))`,
          }}
        />

        {/* Dynamic Audio Intensity VU Pulsing Overlay Bar */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/80 border border-cyan-500/30 backdrop-blur-sm">
          <Volume2 className="w-3 h-3 text-cyan-400" />
          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 transition-all duration-75"
              style={{ width: `${Math.min(100, currentIntensity * 100 * audioReactiveLevel)}%` }}
            />
          </div>
          <span className="text-[9px] font-bold text-cyan-300 w-8 text-right">
            {Math.round(currentIntensity * 100)}%
          </span>
        </div>

        {/* Frequency Band Scale Legend */}
        <div className="flex justify-between px-2 pt-2 text-[9px] font-mono text-slate-500">
          <span>20 Hz (SUB)</span>
          <span>80 Hz</span>
          <span className="text-purple-400 font-bold">432 Hz ★</span>
          <span className="text-cyan-400 font-bold">528 Hz ✦</span>
          <span>1 kHz</span>
          <span className="text-emerald-400 font-bold">963 Hz ◈</span>
          <span>4 kHz</span>
          <span>16 kHz (AIR)</span>
        </div>
      </div>

      {/* Interactive Sync Tuning Drawer */}
      {showControls && (
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
          {/* Audio Reactive Level Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400 font-bold">AUDIO-REACTIVE LEVEL</span>
              <span className="text-cyan-300 font-bold">{audioReactiveLevel.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.05"
              value={audioReactiveLevel}
              onChange={(e) => onUpdateAudioReactive && onUpdateAudioReactive(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[9px] text-slate-500 block">Controls dynamic range scaling & pulse magnitude</span>
          </div>

          {/* Global Bloom Intensity Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400 font-bold">GLOBAL BLOOM INTENSITY</span>
              <span className="text-purple-300 font-bold">{bloomIntensity.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.05"
              value={bloomIntensity}
              onChange={(e) => onUpdateBloom && onUpdateBloom(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
            <span className="text-[9px] text-slate-500 block">Controls neon radiance, drop-shadow, & aura halo</span>
          </div>

          {/* Local Sensitivity Boost & Resolution */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400 font-bold">ANALYZER BANDS / GAIN</span>
              <span className="text-emerald-300 font-bold">{bandCount} BANDS · {sensitivityBoost}x</span>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={() => setSensitivityBoost((prev) => (prev === 1.0 ? 1.5 : prev === 1.5 ? 2.0 : 1.0))}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] border border-slate-700"
              >
                Gain: {sensitivityBoost}x
              </button>
              <button
                onClick={() => setBandCount((prev) => (prev === 24 ? 36 : prev === 36 ? 48 : 24))}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] border border-slate-700"
              >
                Bands: {bandCount}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
