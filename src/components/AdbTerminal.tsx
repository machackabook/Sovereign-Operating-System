import React, { useState, useEffect, useRef } from 'react';
import { AdbDaemonWebUsbDevice, AdbDaemonWebUsbDeviceManager } from '@yume-chan/adb-daemon-webusb';
import { Adb } from '@yume-chan/adb';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

interface AdbTerminalProps {
  onClose?: () => void;
}

export const AdbTerminal: React.FC<AdbTerminalProps> = ({ onClose }) => {
  const [adb, setAdb] = useState<Adb | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);

  const connectDevice = async () => {
    try {
      const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
      if (!manager) {
        alert('WebUSB is not supported in this browser.');
        return;
      }
      const selectedDevice = await manager.requestDevice();
      if (!selectedDevice) return;

      const connection = await selectedDevice.connect() as any;
      const adbInstance = new Adb(connection) as any;
      setAdb(adbInstance);

      if (xtermRef.current) {
        xtermRef.current.writeln('\x1b[1;32m[SYSTEM] ADB Connection Established. Opening shell...\x1b[0m');
        
        // Tango ADB v0.22+ uses subprocess.shell() which returns a promise of AdbSubprocessShell
        const shell = await adbInstance.subprocess.shell();
        
        const reader = (shell.stdout as any).getReader();
        const read = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            xtermRef.current?.write(new Uint8Array(value));
          }
        };
        read();

        xtermRef.current.onData((data) => {
          (shell.stdin as any).write(new TextEncoder().encode(data));
        });
      }
    } catch (err: any) {
      console.error('[ADB Error]:', err);
      alert(`ADB Error: ${err.message}`);
    }
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 13,
      theme: {
        background: '#020617',
        foreground: '#ffd700', // Gold for ADB
        cursor: '#ff007f'
      }
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;

    term.writeln('\x1b[1;36m[SYSTEM] ADB Ready. Please select a device via WebUSB.\x1b[0m');

    return () => {
      term.dispose();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-xl overflow-hidden border border-yellow-500/20 shadow-2xl">
      <div className="px-4 py-2 bg-slate-900 flex justify-between items-center border-b border-yellow-500/10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${adb ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">ADB INTERFACE {adb ? '(ACTIVE)' : '(STANDBY)'}</span>
        </div>
        <div className="flex items-center gap-4">
          {!adb && <button onClick={connectDevice} className="text-cyan-400 hover:text-cyan-300 transition text-[10px] uppercase font-bold">Request Device</button>}
          <button onClick={onClose} className="text-slate-500 hover:text-red-400 transition text-[10px] uppercase font-bold">Close</button>
        </div>
      </div>
      <div ref={terminalRef} className="flex-1 p-2" />
    </div>
  );
};
