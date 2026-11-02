import React, { useState } from 'react';
import { portfolioService, CryptoAlert } from '../services/portfolioService';
import { Plus, Trash2, Bell } from 'lucide-react';

export const CryptoAlertManager: React.FC<{ userId: string, alerts: CryptoAlert[], onUpdate: () => void }> = ({ userId, alerts, onUpdate }) => {
  const [symbol, setSymbol] = useState('BTC');
  const [threshold, setThreshold] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const addAlert = async () => {
    if (!threshold) return;
    const newAlert: CryptoAlert = {
      id: Date.now().toString(),
      symbol,
      threshold: parseFloat(threshold),
      condition,
      triggered: false
    };
    await portfolioService.updateAlerts(userId, [...alerts, newAlert]);
    onUpdate();
    setThreshold('');
  };

  const removeAlert = async (id: string) => {
    await portfolioService.updateAlerts(userId, alerts.filter(a => a.id !== id));
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input type="text" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} className="w-16 p-2 bg-black/40 border border-emerald-900 rounded text-xs text-white" placeholder="BTC" />
        <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} className="flex-1 p-2 bg-black/40 border border-emerald-900 rounded text-xs text-white" placeholder="Price Threshold" />
        <select value={condition} onChange={e => setCondition(e.target.value as any)} className="p-2 bg-black/40 border border-emerald-900 rounded text-xs text-white">
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>
        <button onClick={addAlert} className="p-2 bg-emerald-600 text-white rounded"><Plus className="w-4 h-4" /></button>
      </div>

      <div className="space-y-2">
        {alerts.map(a => (
          <div key={a.id} className="flex justify-between items-center p-2 bg-black/30 border border-emerald-900/30 rounded text-xs text-white">
            <span className="flex items-center gap-2"><Bell className="w-3 h-3 text-cyan-400" /> {a.symbol} {a.condition} ${a.threshold}</span>
            <button onClick={() => removeAlert(a.id)} className="text-rose-400"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};
