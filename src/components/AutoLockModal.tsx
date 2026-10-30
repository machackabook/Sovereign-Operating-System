import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Key,
  X,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { autoLockService, AutoLockState } from '../services/autoLockService';
import { audioVoiceService } from '../services/audioVoiceService';

interface AutoLockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutoLockModal: React.FC<AutoLockModalProps> = ({ isOpen, onClose }) => {
  const [lockState, setLockState] = useState<AutoLockState>(autoLockService.getState());
  const [passphrase, setPassphrase] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    return autoLockService.subscribe(setLockState);
  }, []);

  if (!isOpen) return null;

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = autoLockService.unlock(passphrase);
    if (res.success) {
      setSuccessMsg(res.message);
      setPassphrase('');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 700);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleLockNow = () => {
    autoLockService.triggerLock('MANUAL_LOCK');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl font-mono text-slate-200">
      <div className="relative w-full max-w-md bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.25)] p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                lockState.isLocked
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
              }`}
            >
              {lockState.isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wider">
                CRYPTOGRAPHIC ENCLAVE AUTO-LOCK
              </h2>
              <span className="text-[10px] text-slate-400">
                5-Minute Inactivity Volatile Memory Clearing
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Section */}
        <div className="py-4 space-y-4">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              lockState.isLocked
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-xs font-bold text-white">
                  {lockState.isLocked ? 'VAULT STATUS: LOCKED' : 'VAULT STATUS: UNLOCKED & ACTIVE'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {lockState.isLocked
                    ? `Locked due to ${lockState.lockReason || 'INACTIVITY'}`
                    : `Inactivity Timer: ${formatTime(lockState.remainingSeconds)} remaining`}
                </div>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                lockState.isLocked
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
              }`}
            >
              {lockState.isLocked ? 'LOCKED' : 'ARMED'}
            </span>
          </div>

          {/* Volatile Memory Clearing Notice */}
          <div className="p-3 rounded-lg bg-black/50 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span>Volatile Key Memory:</span>
              <span className={lockState.isLocked ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {lockState.isLocked ? 'CLEARED (0 in RAM)' : 'ACTIVE (Encrypted)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>IndexedDB Key Isolation:</span>
              <span className={lockState.isLocked ? 'text-amber-400 font-bold' : 'text-cyan-400'}>
                {lockState.isLocked ? 'ACCESS BLOCKED' : 'PERMITTED'}
              </span>
            </div>
            {lockState.purgedBytes > 0 && (
              <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Nirvana Purge / Shed:</span>
                <span className="text-purple-300">{(lockState.purgedBytes / 1024).toFixed(1)} KB freed</span>
              </div>
            )}
          </div>

          {/* Error / Success messages */}
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form / Unlock Actions */}
          {lockState.isLocked ? (
            <form onSubmit={handleUnlock} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">
                  Operator Passphrase (or press Unlock)
                </label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter passphrase ('open sovereign matrix')..."
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.2)]"
              >
                <Unlock className="w-4 h-4" />
                <span>UNLOCK SOVEREIGN ENCLAVE</span>
              </button>
            </form>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleLockNow}
                className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>LOCK VAULT & FLUSH VOLATILE MEMORY NOW</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Inactivity Threshold: 5 Minutes (300s)</span>
          <span>Zero Memory Bloat / Anti-Tamper</span>
        </div>
      </div>
    </div>
  );
};
