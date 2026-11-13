import React, { useState, useEffect } from 'react';
import { Shield, Activity, Mic, Volume2, X, Radio, Lock, CheckCircle2 } from 'lucide-react';
import { audioVoiceService } from '../services/audioVoiceService';
import { voiceAuthGateService, EnvironmentalSensorData } from '../services/voiceAuthGateService';
import { vfs } from '../services/vfsService';

interface InspectionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceMatch?: () => void;
}

const displayMetric = (value: number | null, suffix = '') =>
  value === null || !Number.isFinite(value) ? 'N/A' : value.toFixed(1) + suffix;

export const InspectionOverlay: React.FC<InspectionOverlayProps> = ({ isOpen, onClose, onVoiceMatch }) => {
  const [telemetry, setTelemetry] = useState<EnvironmentalSensorData>(voiceAuthGateService.getSensorTelemetry());
  const [isNarrating, setIsNarrating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authStatus, setAuthStatus] = useState(voiceAuthGateService.getStatus());
  const [spokenWord, setSpokenWord] = useState('');
  const [identityMessage, setIdentityMessage] = useState('');

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
    const count = vfs.search('').length;
    const current = voiceAuthGateService.getSensorTelemetry();
    const mic = current.microphoneLevel === null
      ? 'Microphone input level is not available.'
      : `Relative microphone input level is ${Math.round(current.microphoneLevel * 100)} percent.`;
    const motion = current.motionIntensity === null
      ? 'Motion sensor data is not available.'
      : `Measured acceleration magnitude is ${current.motionIntensity.toFixed(2)} meters per second squared.`;
    const access = voiceAuthGateService.isAuthorized()
      ? 'Protected document access is verified for this session.'
      : 'Protected document access remains locked until Google and Cloudflare Access identity checks pass.';
    const narration = `System inspection. The selected device speech voice is ${audioVoiceService.getSelectedVoiceURI() ? 'configured' : 'using the browser default'}. The virtual filesystem currently exposes ${count} indexed objects. ${mic} ${motion} Unavailable environmental sensors are reported as unavailable, not estimated. ${access}`;

    try {
      await audioVoiceService.speak(narration, {
        tone: 'Grounded & Natural',
        sentiment: 'analytical',
        onWord: (word) => setSpokenWord(word),
        onEnd: () => {
          setIsNarrating(false);
          setSpokenWord('');
        }
      });
    } finally {
      setIsNarrating(false);
      setSpokenWord('');
    }
  };

  const handleVerifyIdentity = async () => {
    setIsVerifying(true);
    setIdentityMessage('Checking Firebase Google identity and the signed Cloudflare Access assertion…');
    try {
      const result = await voiceAuthGateService.verifyIdentity();
      setIdentityMessage(result.message);
      setAuthStatus(voiceAuthGateService.getStatus());
      if (result.verified) onVoiceMatch?.();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLock = () => {
    voiceAuthGateService.logoutUser();
    setAuthStatus(voiceAuthGateService.getStatus());
    setIdentityMessage('Local bridge session revoked and protected paths locked.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#090d16] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.2)] overflow-hidden font-mono text-cyan-300">
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="font-bold tracking-wider text-sm uppercase">System Inspection & Available Device Telemetry</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">DEVICE TTS</span>
          </div>
          <button onClick={onClose} aria-label="Close inspection" className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {isNarrating && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-cyan-400 animate-bounce" />
              <div className="flex-1 text-xs text-cyan-100">
                <span className="text-cyan-400 font-bold uppercase">Device narration: </span>
                <span className="underline decoration-cyan-400 font-bold text-white text-sm">{spokenWord || 'Preparing available telemetry…'}</span>
              </div>
            </div>
          )}

          <div>
            <div className="text-xs uppercase text-slate-400 mb-2 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Measured values only · unsupported sensors show N/A</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/20">
                <div className="text-[10px] text-slate-400">MIC INPUT LEVEL</div>
                <div className="text-sm font-bold text-white">{telemetry.microphoneLevel === null ? 'N/A' : `${Math.round(telemetry.microphoneLevel * 100)}%`}</div>
                <div className="text-[9px] text-cyan-400">Live relative level</div>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/20">
                <div className="text-[10px] text-slate-400">PROXIMITY</div>
                <div className="text-sm font-bold text-white">{displayMetric(telemetry.estimatedProximityMeters, ' m')}</div>
                <div className="text-[9px] text-slate-500">No proximity sensor</div>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/20">
                <div className="text-[10px] text-slate-400">ECHO LATENCY</div>
                <div className="text-sm font-bold text-white">{displayMetric(telemetry.acousticEchoLatencyMs, ' ms')}</div>
                <div className="text-[9px] text-slate-500">Not measured</div>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/20">
                <div className="text-[10px] text-slate-400">RF HARMONIC</div>
                <div className="text-sm font-bold text-white">{displayMetric(telemetry.rfHarmonicIndex)}</div>
                <div className="text-[9px] text-slate-500">Not measured</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/20">
              <div className="text-[10px] text-slate-400 uppercase mb-1">Device Orientation</div>
              <div className="flex justify-between text-slate-300 font-mono text-xs">
                <span>α: {displayMetric(telemetry.deviceOrientation.alpha, '°')}</span>
                <span>β: {displayMetric(telemetry.deviceOrientation.beta, '°')}</span>
                <span>γ: {displayMetric(telemetry.deviceOrientation.gamma, '°')}</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/20">
              <div className="text-[10px] text-slate-400 uppercase mb-1">Motion Sensor</div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Acceleration magnitude:</span>
                <span className="text-sm font-bold text-cyan-300">{displayMetric(telemetry.motionIntensity, ' m/s²')}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" /> Protected Document Access
              </span>
              {authStatus.isAuthenticated ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> IDENTITY VERIFIED
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 font-bold">LOCKED · GOOGLE + ACCESS REQUIRED</span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              Protected documents require a verified Firebase Google identity and a valid Cryptic-verified Cloudflare Access assertion. Current user:{' '}
              <span className="text-white font-bold">{authStatus.username || 'Guest / Unverified'}</span>
            </div>
            {identityMessage && <p role="status" className="text-xs text-cyan-200">{identityMessage}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-cyan-500/20 bg-slate-950/80">
          <button onClick={handleRunVoiceInspection} disabled={isNarrating} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold disabled:opacity-50">
            <Activity className="w-4 h-4" />
            <span>{isNarrating ? 'Narrating…' : 'Narrate available telemetry'}</span>
          </button>
          {authStatus.isAuthenticated ? (
            <button onClick={handleLock} className="px-3 py-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs font-bold">
              Lock / Revoke Session
            </button>
          ) : (
            <button onClick={handleVerifyIdentity} disabled={isVerifying} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold disabled:opacity-50">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying…' : 'Verify Google + Access'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
