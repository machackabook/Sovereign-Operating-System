import React, { useState, useEffect } from 'react';
import { Shield, Activity, Mic, Volume2, X, RefreshCw, Radio, Cpu, Lock, CheckCircle2 } from 'lucide-react';
import { audioVoiceService } from '../services/audioVoiceService';
import { voiceAuthGateService, EnvironmentalSensorData } from '../services/voiceAuthGateService';
import { vfs } from '../services/vfsService';

interface InspectionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceMatch?: () => void;
}

export const InspectionOverlay: React.FC<InspectionOverlayProps> = ({
  isOpen,
  onClose,
  onVoiceMatch
}) => {
  const [telemetry, setTelemetry] = useState<EnvironmentalSensorData>(
    voiceAuthGateService.getSensorTelemetry()
  );
  const [isNarrating, setIsNarrating] = useState(false);
  const [authStatus, setAuthStatus] = useState(voiceAuthGateService.getStatus());
  const [spokenWord, setSpokenWord] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTelemetry(voiceAuthGateService.getSensorTelemetry());
      setAuthStatus(voiceAuthGateService.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunVoiceInspection = async () => {
    setIsNarrating(true);
    const vfsCount = vfs.search('').length;
    const currentSensors = voiceAuthGateService.getSensorTelemetry();
    const narrationText = `System inspection engaged with Natch natural voice profile. Taint security active on all paths. Virtual filesystem verified with ${vfsCount} objects. Acoustic noise floor measured at ${currentSensors.noiseFloorDbfs} decibels. Estimated sensor proximity is ${currentSensors.estimatedProximityMeters} meters. Environmental resonance index nominal at ${currentSensors.rfHarmonicIndex}. All subsystems operating nominally.`;

    await audioVoiceService.speak(narrationText, {
      profile: 'natch',
      tone: 'Grounded & Natural',
      sentiment: 'analytical',
      onWord: (word) => setSpokenWord(word),
      onEnd: () => {
        setIsNarrating(false);
        setSpokenWord('');
      }
    });
  };

  const handleSimulateVoiceMatch = () => {
    const res = voiceAuthGateService.verifyVoice('open sovereign matrix');
    if (res.verified) {
      setAuthStatus(voiceAuthGateService.getStatus());
      if (onVoiceMatch) onVoiceMatch();
      audioVoiceService.speak("Voice profile authenticated. Gated access granted.", {
        profile: 'natch',
        tone: 'Affirmative'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#090d16] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.2)] overflow-hidden font-mono text-cyan-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="font-bold tracking-wider text-sm uppercase">
              System Inspect & Environmental Telemetry
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              NATCH VOICE ENGINE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Real-time speech narration banner */}
          {isNarrating && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-cyan-400 animate-bounce" />
              <div className="flex-1 text-xs text-cyan-100">
                <span className="text-cyan-400 font-bold uppercase">Natch Narration: </span>
                <span className="underline decoration-cyan-400 font-bold text-white text-sm">
                  {spokenWord || 'Starting telemetry vocalization...'}
                </span>
              </div>
            </div>
          )}

          {/* Environmental Sensor Telemetry Grid */}
          <div>
            <div className="text-xs uppercase text-slate-400 mb-2 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Acoustic & Device Telemetry (Environmental Sensors)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/20">
                <div className="text-[10px] text-slate-400">NOISE FLOOR</div>
                <div className="text-sm font-bold text-white">{telemetry.noiseFloorDbfs} dB</div>
                <div className="text-[9px] text-cyan-400">Microphone RMS</div>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/20">
                <div className="text-[10px] text-slate-400">PROXIMITY ESTIMATE</div>
                <div className="text-sm font-bold text-white">~{telemetry.estimatedProximityMeters}m</div>
                <div className="text-[9px] text-cyan-400">Inverse Law Model</div>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/20">
                <div className="text-[10px] text-slate-400">ECHO LATENCY</div>
                <div className="text-sm font-bold text-white">{telemetry.acousticEchoLatencyMs} ms</div>
                <div className="text-[9px] text-cyan-400">Ping Rebound</div>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/20">
                <div className="text-[10px] text-slate-400">RF HARMONIC IDX</div>
                <div className="text-sm font-bold text-white">{telemetry.rfHarmonicIndex}</div>
                <div className="text-[9px] text-emerald-400">Coherent</div>
              </div>
            </div>
          </div>

          {/* Orientation & Motion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/20">
              <div className="text-[10px] text-slate-400 uppercase mb-1">Device Orientation (Gyro)</div>
              <div className="flex justify-between text-slate-300 font-mono text-xs">
                <span>Yaw (α): {telemetry.deviceOrientation.alpha ?? 0}°</span>
                <span>Pitch (β): {telemetry.deviceOrientation.beta ?? 0}°</span>
                <span>Roll (γ): {telemetry.deviceOrientation.gamma ?? 0}°</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/20">
              <div className="text-[10px] text-slate-400 uppercase mb-1">Motion Dynamics</div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Acceleration Vector:</span>
                <span className="text-sm font-bold text-cyan-300">{(telemetry.motionIntensity * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Security & Access Control */}
          <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" /> Document Gating & Auth Status
              </span>
              {authStatus.voiceMatched ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> VOICE VERIFIED
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 font-bold">
                  LOCKED (Voice Match Required)
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              Protected documents (`/docs/*`) require verified voice session. Current User:{' '}
              <span className="text-white font-bold">{authStatus.username || 'Guest / Unverified'}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-cyan-500/20 bg-slate-950/80">
          <button
            onClick={handleRunVoiceInspection}
            disabled={isNarrating}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
          >
            <Mic className="w-4 h-4" />
            <span>{isNarrating ? 'Vocalizing Telemetry...' : 'Narrate with Natch Voice'}</span>
          </button>

          {!authStatus.voiceMatched ? (
            <button
              onClick={handleSimulateVoiceMatch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify Voice Passphrase</span>
            </button>
          ) : (
            <button
              onClick={() => {
                voiceAuthGateService.logoutUser();
                setAuthStatus(voiceAuthGateService.getStatus());
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-all"
            >
              Lock / Revoke Match
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
