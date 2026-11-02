import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface SshTerminalProps {
  config: {
    host: string;
    username: string;
    password?: string;
  };
  onClose?: () => void;
}

export const SshTerminal: React.FC<SshTerminalProps> = ({ config, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 13,
      theme: {
        background: '#020617',
        foreground: '#00f2ff',
        cursor: '#ff007f'
      }
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ssh`);
    socketRef.current = socket;

    socket.onopen = () => {
      term.writeln('\x1b[1;32m[SYSTEM] Socket Connected. Initializing SSH session...\x1b[0m');
      socket.send(JSON.stringify({ type: 'connect', ...config }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'output') {
        term.write(data.data);
      } else if (data.type === 'status') {
        term.writeln(`\x1b[1;36m[SYSTEM] ${data.message}\x1b[0m`);
      } else if (data.type === 'error') {
        term.writeln(`\x1b[1;31m[ERROR] ${data.message}\x1b[0m`);
      }
    };

    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'input', data }));
      }
    });

    const handleResize = () => {
      fitAddon.fit();
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.close();
      term.dispose();
    };
  }, [config]);

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-xl overflow-hidden border border-cyan-500/20 shadow-2xl">
      <div className="px-4 py-2 bg-slate-900 flex justify-between items-center border-b border-cyan-500/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">SSH: {config.username}@{config.host}</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-red-400 transition text-[10px] uppercase font-bold">Disconnect</button>
      </div>
      <div ref={terminalRef} className="flex-1 p-2" />
    </div>
  );
};
