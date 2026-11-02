import React, { useEffect, useRef, useState } from 'react';
import { sdrDemodulatorBridge, SdrTelemetry } from '../services/sdrDemodulatorBridge';

interface SdrDemodulatorBridgeProps {
  onFrequencyChange?: (mhz: number) => void;
  className?: string;
}

const PRESET_STATIONS = [
  { name: 'NPR / Jazz', freqMhz: 88.5, tag: 'PUBLIC' },
  { name: 'Classical FM', freqMhz: 91.5, tag: 'MUSIC' },
  { name: 'Gaia 963 Harmonic', freqMhz: 96.3, tag: 'SOLFEGGIO' },
  { name: 'Metro Hits', freqMhz: 101.1, tag: 'TOP 40' },
  { name: 'Classic Rock', freqMhz: 104.3, tag: 'ROCK' },
  { name: 'Indie Wave', freqMhz: 107.9, tag: 'INDIE' },
  { name: 'NOAA Weather', freqMhz: 162.4, tag: 'WEATHER' },
];

export const SdrDemodulatorBridge: React.FC<SdrDemodulatorBridgeProps> = ({ onFrequencyChange, className = '' }) => {
  const [telemetry, setTelemetry] = useState<SdrTelemetry>(sdrDemodulatorBridge.getTelemetry());
  const [currentMhz, setCurrentMhz] = useState<number>(101.1);
  const [volume, setVolume] = useState<number>(0.8);
  const [squelch, setSquelch] = useState<number>(-90);
  const [isSynthetic, setIsSynthetic] = useState<boolean>(true);
  const [hardwareStatusMsg, setHardwareStatusMsg] = useState<string>('');
  const [isConnectingHardware, setIsConnectingHardware] = useState<boolean>(false);

  const constellationCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state from service
  useEffect(() => {
    const unsub = sdrDemodulatorBridge.subscribeTelemetry((t) => {
      setTelemetry(t);
    });

    setCurrentMhz(sdrDemodulatorBridge.getTelemetry().frequencyMhz);
    setVolume(sdrDemodulatorBridge.getVolume());
    setSquelch(sdrDemodulatorBridge.getSquelch());
    setIsSynthetic(sdrDemodulatorBridge.isSyntheticMode());

    return () => unsub();
  }, []);

  // Draw I/Q constellation diagram
  useEffect(() => {
    const canvas = constellationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // Fade background for phosphor persistence effect
    ctx.fillStyle = 'rgba(10, 15, 29, 0.25)';
    ctx.fillRect(0, 0, w, h);

    // Crosshairs
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();

    // Concentric grid circles
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.2, 0, 2 * Math.PI);
    ctx.arc(cx, cy, w * 0.4, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw I/Q points
    const points = telemetry.constellation;
    if (points && points.length > 0) {
      ctx.fillStyle = telemetry.sinrDb > 18 ? '#22d3ee' : '#f59e0b';
      ctx.shadowBlur = 4;
      ctx.shadowColor = ctx.fillStyle;

      points.forEach((pt) => {
        const x = cx + pt.i * (w * 0.42);
        const y = cy - pt.q * (h * 0.42);
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      });
      ctx.shadowBlur = 0;
    }
  }, [telemetry.constellation, telemetry.sinrDb]);

  const handleTogglePower = async () => {
    if (telemetry.isRunning) {
      sdrDemodulatorBridge.stop();
    } else {
      await sdrDemodulatorBridge.start();
    }
  };

  const handleTune = (mhz: number) => {
    const clamped = Math.max(87.5, Math.min(165.0, Number(mhz.toFixed(2))));
    setCurrentMhz(clamped);
    sdrDemodulatorBridge.tuneMhz(clamped);
    if (onFrequencyChange) onFrequencyChange(clamped);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    sdrDemodulatorBridge.setVolume(v);
  };

  const handleSquelchChange = (sq: number) => {
    setSquelch(sq);
    sdrDemodulatorBridge.setSquelch(sq);
  };

  const handleToggleSynthetic = (enabled: boolean) => {
    setIsSynthetic(enabled);
    sdrDemodulatorBridge.setSyntheticMode(enabled);
    setHardwareStatusMsg(enabled ? 'Operating on Synthetic Carrier Generator' : 'Switched to External Hardware stream');
  };

  const handleConnectSerial = async () => {
    setIsConnectingHardware(true);
    setHardwareStatusMsg('Opening Web Serial port selector...');
    const res = await sdrDemodulatorBridge.connectSerial(921600);
    setIsConnectingHardware(false);
    setHardwareStatusMsg(res.message);
    if (res.success) {
      setIsSynthetic(false);
    }
  };

  const handleConnectUsb = async () => {
    setIsConnectingHardware(true);
    setHardwareStatusMsg('Opening WebUSB device selector (RTL2832U / HackRF)...');
    const res = await sdrDemodulatorBridge.connectUsb();
    setIsConnectingHardware(false);
    setHardwareStatusMsg(res.message);
    if (res.success) {
      setIsSynthetic(false);
    }
  };

  return (
    <div className={`bg-slate-950/95 border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-xl shadow-2xl text-slate-100 font-mono ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-3.5 h-3.5 rounded-full ${telemetry.isRunning ? 'bg-cyan-400 animate-ping absolute' : ''}`} />
            <div className={`w-3.5 h-3.5 rounded-full ${telemetry.isRunning ? 'bg-cyan-400' : 'bg-slate-600'}`} />
          </div>
          <div>
            <h2 className="text-base font-black tracking-wider uppercase bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              SDR Demodulator & Sovereign Tuner
            </h2>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Polar Discriminator</span>
              <span>•</span>
              <span>75µs De-emphasis</span>
              <span>•</span>
              <span className="text-cyan-300 uppercase font-bold">{telemetry.sourceType}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePower}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${
              telemetry.isRunning
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50 hover:bg-rose-600/40'
                : 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-600/40 shadow-cyan-500/10'
            }`}
          >
            <span>{telemetry.isRunning ? '■' : '▶'}</span>
            <span>{telemetry.isRunning ? 'STOP RECEIVER' : 'START RECEIVER'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Frequency Display & Constellation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Frequency & RF Readout */}
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs uppercase tracking-widest text-slate-400">TUNED FREQUENCY</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              {currentMhz >= 160 ? 'NOAA NFM' : 'WIDEBAND FM'}
            </span>
          </div>

          {/* Big LCD-style Frequency Display */}
          <div className="flex items-baseline justify-center gap-2 my-2 py-2 bg-black/60 rounded-xl border border-cyan-500/20 shadow-inner">
            <span className="text-4xl md:text-5xl font-black text-cyan-400 tracking-tight font-mono drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">
              {currentMhz.toFixed(2)}
            </span>
            <span className="text-lg font-bold text-slate-500">MHz</span>
          </div>

          {/* Frequency Tuning Controls */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTune(currentMhz - 1.0)}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                -1.0
              </button>
              <button
                onClick={() => handleTune(currentMhz - 0.1)}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                -0.1
              </button>
              <input
                type="range"
                min="88.0"
                max="108.0"
                step="0.1"
                value={currentMhz > 108 ? 108 : currentMhz}
                onChange={(e) => handleTune(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <button
                onClick={() => handleTune(currentMhz + 0.1)}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                +0.1
              </button>
              <button
                onClick={() => handleTune(currentMhz + 1.0)}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                +1.0
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_STATIONS.map((st) => (
                <button
                  key={st.freqMhz}
                  onClick={() => handleTune(st.freqMhz)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                    Math.abs(currentMhz - st.freqMhz) < 0.05
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {st.freqMhz.toFixed(1)} <span className="text-[9px] opacity-70">({st.tag})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time I/Q Constellation & Signal Metrics */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest text-slate-400">I/Q CONSTELLATION</span>
            <span className="text-[10px] text-emerald-400 font-bold">POLAR PHASE</span>
          </div>

          <canvas
            ref={constellationCanvasRef}
            width={160}
            height={160}
            className="rounded-lg border border-slate-800 shadow-inner bg-slate-950"
          />

          <div className="w-full grid grid-cols-2 gap-2 mt-3 text-center text-xs">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">RSSI</div>
              <div className="font-bold text-cyan-300">{telemetry.rssiDbm} dBm</div>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">SINR</div>
              <div className="font-bold text-emerald-300">{telemetry.sinrDb} dB</div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Spectrum Bar Visualizer */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 mb-5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>DEMODULATED AUDIO SPECTRUM (48 kHz)</span>
          <span>RMS: {telemetry.audioRms}</span>
        </div>
        <div className="h-10 flex items-end gap-1 px-1 bg-black/40 rounded-lg">
          {telemetry.audioSpectrum && telemetry.audioSpectrum.length > 0 ? (
            telemetry.audioSpectrum.map((val, idx) => (
              <div
                key={idx}
                className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-300 rounded-t transition-all duration-75"
                style={{ height: `${Math.max(4, val * 100)}%` }}
              />
            ))
          ) : (
            <div className="w-full text-center text-[11px] text-slate-600 py-2">Audio spectrum waiting for carrier lock...</div>
          )}
        </div>
      </div>

      {/* Audio & Hardware Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
        {/* Audio Volume & Squelch */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">AUDIO VOLUME:</span>
            <span className="font-bold text-cyan-300">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">SQUELCH THRESHOLD:</span>
            <span className="font-bold text-amber-300">{squelch} dBm</span>
          </div>
          <input
            type="range"
            min="-110"
            max="-40"
            step="1"
            value={squelch}
            onChange={(e) => handleSquelchChange(parseFloat(e.target.value))}
            className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
        </div>

        {/* Hardware Ingestion Buttons & Synthetic Mode */}
        <div className="space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">INGESTION MODE:</span>
            <button
              onClick={() => handleToggleSynthetic(!isSynthetic)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                isSynthetic
                  ? 'bg-purple-900/40 text-purple-300 border-purple-500/40'
                  : 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {isSynthetic ? 'SYNTHETIC CARRIER ACTIVE' : 'LIVE HARDWARE INPUT'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleConnectSerial}
              disabled={isConnectingHardware}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
            >
              CONNECT WEB SERIAL
            </button>
            <button
              onClick={handleConnectUsb}
              disabled={isConnectingHardware}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
            >
              CONNECT WEB USB
            </button>
          </div>

          {hardwareStatusMsg && (
            <div className="text-[11px] text-cyan-300 bg-slate-900 p-2 rounded-lg border border-cyan-900 truncate">
              {hardwareStatusMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
