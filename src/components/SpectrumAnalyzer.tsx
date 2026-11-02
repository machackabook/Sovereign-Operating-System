import React from 'react';
import { VisualSpectrumAnalyzer } from './VisualSpectrumAnalyzer';

export const SpectrumAnalyzer: React.FC = () => {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-black text-white uppercase tracking-tighter">RF Spectrum Telemetry</h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time SINR / Frequency Tracking Engine</p>
      </div>
      <VisualSpectrumAnalyzer compact={false} />
    </div>
  );
};
