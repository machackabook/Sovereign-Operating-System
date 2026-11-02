import React, { useState, useEffect, useRef } from 'react';
import { GeminiLiveService, LiveMessage } from '../services/geminiLiveService';
import { Mic, MicOff, Volume2, PhoneOff, MessageSquare, Sparkles } from 'lucide-react';

interface GeminiLiveInterfaceProps {
  onClose?: () => void;
}

export const GeminiLiveInterface: React.FC<GeminiLiveInterfaceProps> = ({ onClose }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const liveServiceRef = useRef<GeminiLiveService | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    liveServiceRef.current = new GeminiLiveService((msg: LiveMessage) => {
      if (msg.audio) {
        // Audio playback is handled by the service
      }
      if (msg.interrupted) {
        setTranscript(prev => [...prev, '[Interrupted]']);
      }
    });

    return () => {
      liveServiceRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const handleToggleVoice = async () => {
    if (!liveServiceRef.current) return;

    if (isConnected) {
      liveServiceRef.current.stop();
      setIsConnected(false);
      setIsMicActive(false);
    } else {
      setIsConnecting(true);
      try {
        await liveServiceRef.current.connect();
        await liveServiceRef.current.startMic();
        setIsConnected(true);
        setIsMicActive(true);
        setTranscript(prev => [...prev, '[System]: Voice session initialized. You are now speaking with Gemini.']);
      } catch (err: any) {
        console.error('Failed to connect to Live API:', err);
        setTranscript(prev => [...prev, `[Error]: ${err.message}`]);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-black/40">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
            <Sparkles className={`w-5 h-5 ${isConnected ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">Gemini Live Neurality</h3>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                {isConnected ? 'Active Real-Time Enclave' : isConnecting ? 'Establishing Link...' : 'Standby Mode'}
              </span>
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
            <PhoneOff className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Transcript Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
        {transcript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center space-y-4">
            <div className="p-4 rounded-full bg-slate-900/50 border border-slate-800">
              <MessageSquare className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-xs max-w-[200px] leading-relaxed">
              Initiate a high-fidelity voice session to engage with the sovereign intelligence core.
            </p>
          </div>
        ) : (
          transcript.map((line, idx) => (
            <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className={`text-[11px] leading-relaxed ${line.startsWith('[Error]') ? 'text-rose-400 font-bold' : line.startsWith('[System]') ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}>
                {line}
              </p>
            </div>
          ))
        )}
        <div ref={transcriptEndRef} />
      </div>

      {/* Controls */}
      <div className="px-6 py-8 border-t border-cyan-500/10 bg-black/20 flex flex-col items-center space-y-6">
        <div className="relative">
          {/* Visual Waves while connected */}
          {isConnected && (
            <div className="absolute inset-0 -m-4 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-24 rounded-full border border-cyan-500/20 animate-ping duration-[3s]" />
              <div className="w-24 h-24 rounded-full border border-cyan-500/10 animate-ping duration-[2s] delay-700" />
            </div>
          )}
          
          <button
            onClick={handleToggleVoice}
            disabled={isConnecting}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${
              isConnected 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40' 
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/40'
            } ${isConnecting ? 'opacity-50 cursor-wait scale-95' : 'hover:scale-110 active:scale-90'}`}
          >
            {isConnecting ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isConnected ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
        </div>

        <div className="flex flex-col items-center space-y-2">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            {isConnected ? 'Press to Terminate Enclave' : 'Initialize Voice Field'}
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-3 h-3 text-cyan-400" />
              <span className="text-[9px] font-bold">24kHz PCM</span>
            </div>
            <span className="text-slate-800 text-xs">|</span>
            <div className="flex items-center gap-1.5">
              <Mic className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-bold">16kHz INPUT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
