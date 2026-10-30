import React, { useState } from 'react';
import { X, Save, Trash2, Edit2, Plus } from 'lucide-react';
import { EnvironmentState } from '../types';

interface MacroEditorModalProps {
  envState: EnvironmentState;
  setEnvState: React.Dispatch<React.SetStateAction<EnvironmentState>>;
  onClose: () => void;
}

export const MacroEditorModal: React.FC<MacroEditorModalProps> = ({ envState, setEnvState, onClose }) => {
  const macros = envState.macros;
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  const saveMacro = () => {
    if (!newKey.trim()) return;
    setEnvState(prev => ({
      ...prev,
      macros: { ...prev.macros, [newKey]: newVal }
    }));
    setNewKey('');
    setNewVal('');
    setEditingKey(null);
  };

  const deleteMacro = (key: string) => {
    setEnvState(prev => {
      const next = { ...prev.macros };
      delete next[key];
      return { ...prev, macros: next };
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-black/90 border border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,242,255,0.2)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-cyan-300 font-mono">Macro Editor</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>
        
        <div className="space-y-4 mb-6">
          {Object.entries(macros).map(([key, val]) => (
            <div key={key} className="flex gap-2 items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800">
              <span className="font-mono text-cyan-400 w-24 truncate">{key}</span>
              <span className="font-mono text-white flex-1 truncate">{val}</span>
              <button onClick={() => deleteMacro(key)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4"/></button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <input 
            placeholder="Macro Name" 
            value={newKey} 
            onChange={(e) => setNewKey(e.target.value)}
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs"
          />
          <input 
            placeholder="Command Sequence" 
            value={newVal} 
            onChange={(e) => setNewVal(e.target.value)}
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs"
          />
          <button onClick={saveMacro} className="w-full flex justify-center gap-2 items-center p-2 bg-cyan-600 rounded text-slate-950 font-bold hover:bg-cyan-500">
            <Save className="w-4 h-4"/> Save Macro
          </button>
        </div>
      </div>
    </div>
  );
};
