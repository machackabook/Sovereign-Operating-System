import React, { useState, useEffect, useRef } from 'react';
import { Mic, ShieldCheck, AlertCircle, X, LockKeyhole } from 'lucide-react';
import { audioVoiceService } from '../services/audioVoiceService';
import { voiceAuthGateService } from '../services/voiceAuthGateService';

interface VoiceAuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

export const VoiceAuthModal: React.FC<VoiceAuthModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'verifying' | 'failed'>('idle');
  const [message, setMessage] = useState('Verify your signed-in Google identity and Cloudflare Access session.');
  const micStartedByModal = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  const activationPhrase = 'open sovereign matrix';

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = audioVoiceService.onTranscript(async (text, isFinal) => {
      setTranscript(text);
      if (!isFinal) return;
      const phrase = voiceAuthGateService.verifyVoice(text);
      if (!phrase.verified) {
        setStatus('failed');
        setMessage('Phrase not recognized. No access has been granted.');
        return;
      }
      setStatus('verifying');
      setMessage('Phrase recognized. Verifying Google identity and the signed Cloudflare Access assertion…');
      if (micStartedByModal.current) {
        audioVoiceService.stopMicrophone();
        micStartedByModal.current = false;
      }
      const result = await voiceAuthGateService.verifyIdentity();
      if (result.verified) {
        setStatus('idle');
        setMessage(result.message);
        onSuccessRef.current();
      } else {
        setStatus('failed');
        setMessage(result.message);
      }
    });
    return () => {
      unsubscribe();
      if (micStartedByModal.current) {
        audioVoiceService.stopMicrophone();
        micStartedByModal.current = false;
      }
    };
  }, [isOpen]);

  const startPhraseChallenge = async () => {
    const alreadyActive = audioVoiceService.isMicrophoneActive();
    const started = await audioVoiceService.startMicrophone();
    if (!started) {
      setStatus('failed');
      setMessage('Microphone permission or speech recognition is unavailable. You can still verify the signed-in account below.');
      return;
    }
    micStartedByModal.current = !alreadyActive;
    setStatus('listening');
    setMessage('Listening for the optional activation phrase. The phrase is not an identity credential.');
  };

  const verifySignedInAccount = async () => {
    setStatus('verifying');
    setMessage('Checking the existing Firebase Google session and Cloudflare Access assertion…');
    const result = await voiceAuthGateService.verifyIdentity();
    if (result.verified) {
      setStatus('idle');
      setMessage(result.message);
      onSuccess();
    } else {
      setStatus('failed');
      setMessage(result.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="relative w-full max-w-sm bg-slate-950 border border-cyan-500/50 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,242,255,0.2)] text-center">
        {onClose && (
          <button onClick={onClose} aria-label="Close identity check" className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
        <ShieldCheck className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
        <h2 className="text-xl font-bold text-white mb-2 font-mono">Identity Verification</h2>
        <p className="text-slate-400 text-sm mb-5">
          Protected paths require the existing verified Google session and a valid Cloudflare Access assertion.
        </p>

        <div className={`p-4 rounded-xl border font-mono text-xs mb-5 ${status === 'failed' ? 'bg-rose-500/10 border-rose-500/50 text-rose-300' : 'bg-black/50 border-slate-800 text-cyan-300'}`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            {status === 'verifying' ? <LockKeyhole className="w-4 h-4 animate-pulse" /> : <Mic className={`w-4 h-4 ${status === 'listening' ? 'animate-pulse text-cyan-400' : ''}`} />}
            <span>{status === 'verifying' ? 'VERIFYING IDENTITY' : status === 'listening' ? 'LISTENING' : status === 'failed' ? 'VERIFICATION NOT COMPLETE' : 'READY'}</span>
          </div>
          {transcript && <p className="text-slate-300 mb-2">{transcript}</p>}
          <p>{message}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={startPhraseChallenge}
            disabled={status === 'verifying'}
            className="w-full rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-4 py-3 text-sm font-mono text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
          >
            <Mic className="inline w-4 h-4 mr-2" /> Start optional voice phrase
          </button>
          <button
            onClick={verifySignedInAccount}
            disabled={status === 'verifying'}
            className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-mono font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          >
            <ShieldCheck className="inline w-4 h-4 mr-2" /> Verify Google + Cloudflare Access
          </button>
        </div>

        <p className="text-slate-600 text-[10px] font-mono mt-4">
          Optional phrase: “{activationPhrase}”. It is not a secret, voiceprint, or authentication factor.
        </p>
      </div>
    </div>
  );
};
