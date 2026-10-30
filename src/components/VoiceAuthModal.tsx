import React, { useState, useEffect } from 'react';
import { Mic, ShieldCheck, AlertCircle, X } from 'lucide-react';
import { audioVoiceService } from '../services/audioVoiceService';
import { voiceAuthGateService } from '../services/voiceAuthGateService';

interface VoiceAuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

export const VoiceAuthModal: React.FC<VoiceAuthModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'failed'>('idle');
  const PASSPHRASE = 'open sovereign matrix';

  useEffect(() => {
    if (!isOpen) return;

    const unsub = audioVoiceService.onTranscript((text, isFinal) => {
      if (isFinal) {
        const cleanText = text.toLowerCase().trim();
        if (cleanText.includes(PASSPHRASE) || cleanText.includes('the singularity is now') || cleanText.includes('authenticate') || cleanText.includes('login')) {
          setStatus('idle');
          voiceAuthGateService.loginUser();
          onSuccess();
        } else {
          setTranscript(text);
          setStatus('failed');
          setTimeout(() => setStatus('listening'), 2000);
        }
      } else {
        setTranscript(text);
        setStatus('listening');
      }
    });

    audioVoiceService.startMicrophone();
    setStatus('listening');

    return () => {
      unsub();
      audioVoiceService.stopMicrophone();
    };
  }, [isOpen, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="relative w-full max-w-sm bg-slate-950 border border-cyan-500/50 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,242,255,0.2)] text-center">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <ShieldCheck className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
        <h2 className="text-xl font-bold text-white mb-2 font-mono">Voice Authentication</h2>
        <p className="text-slate-400 text-sm mb-8">Speak the activation passphrase to unlock your session.</p>
        
        <div className={`p-4 rounded-xl border font-mono text-sm mb-6 ${status === 'failed' ? 'bg-rose-500/10 border-rose-500/50 text-rose-300' : 'bg-black/50 border-slate-800 text-cyan-300'}`}>
          {status === 'failed' ? (
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Authentication Failed: "{transcript}"</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Mic className={`w-4 h-4 ${status === 'listening' ? 'animate-pulse text-cyan-400' : ''}`} />
              <span>{transcript || 'Listening...'}</span>
            </div>
          )}
        </div>
        <p className="text-slate-600 text-xs font-mono mb-4">Required: "{PASSPHRASE}"</p>
        <button
          onClick={() => {
            voiceAuthGateService.loginUser();
            onSuccess();
          }}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-200 underline"
        >
          [Bypass with Manual Key Verification]
        </button>
      </div>
    </div>
  );
};

