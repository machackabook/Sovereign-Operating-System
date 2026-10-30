import React, { useState, useEffect } from 'react';
import { runtimeLogService, RuntimeLogEntry } from '../services/runtimeLogService';
import { auth } from '../services/firebase';
import { X, ShieldAlert } from 'lucide-react';

export const SystemLogViewer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<RuntimeLogEntry[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = runtimeLogService.subscribe(setLogs);
    return unsub;
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    setIsAdmin(user?.email === 'machackabook@gmail.com');
  }, []);

  if (!isOpen) return null;
  if (!isAdmin) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-red-500">ADMIN ACCESS REQUIRED</div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-4xl h-[80vh] bg-slate-950 border border-cyan-500/40 rounded-xl flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-cyan-400" /> SYSTEM DIAGNOSTIC LOGS</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400 hover:text-white" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
          {logs.map(log => (
            <div key={log.id} className={`p-2 rounded border ${log.level === 'error' ? 'bg-red-950/20 border-red-900 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
              [{new Date(log.timestamp).toLocaleTimeString()}] [{log.source}] {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
