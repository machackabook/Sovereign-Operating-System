import React, { useEffect, useRef, useState } from 'react';

interface SdrDemodulatorBridgeProps {
  gatewayUrl?: string; // e.g., 'ws://<host-ip>:8765'
}

export const SdrDemodulatorBridge: React.FC<SdrDemodulatorBridgeProps> = ({ gatewayUrl = 'ws://localhost:8765' }) => {
  const [active, setActive] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const startStream = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 48000 });
      await audioCtxRef.current.audioWorklet.addModule('/audio-demodulator-processor.js');
    }
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    const workletNode = new AudioWorkletNode(ctx, 'audio-demodulator-processor');
    workletNode.connect(ctx.destination);
    workletNodeRef.current = workletNode;

    const ws = new WebSocket(gatewayUrl);
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => {
      console.log('Connected to SDR Gateway');
      setActive(true);
    };

    ws.onmessage = (event) => {
      const audioData = new Float32Array(event.data);
      if (workletNodeRef.current) {
        workletNodeRef.current.port.postMessage(audioData);
      }
    };

    wsRef.current = ws;
  };

  const stopStream = () => {
    if (wsRef.current) wsRef.current.close();
    if (workletNodeRef.current) workletNodeRef.current.disconnect();
    setActive(false);
  };

  useEffect(() => {
    return () => {
      stopStream();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    <div className="p-4 bg-slate-900 border border-purple-500/30 rounded-2xl">
      <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-4">SDR FM Demodulator</h3>
      <button 
        onClick={active ? stopStream : startStream}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition ${active ? 'bg-red-500/20 text-red-300' : 'bg-purple-500/20 text-purple-300'}`}
      >
        {active ? 'Stop FM Stream' : 'Start FM Stream'}
      </button>
    </div>
  );
};
