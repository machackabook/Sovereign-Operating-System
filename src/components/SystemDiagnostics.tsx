import React, { useState, useEffect } from 'react';
import { ShieldCheck, Database, Zap, Cpu, Bluetooth } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

export function SystemDiagnostics() {
  const [status, setStatus] = useState<Record<string, { ok: boolean; message: string }>>({
    database: { ok: false, message: 'Checking...' },
    webSerial: { ok: !!(navigator as any).serial, message: (navigator as any).serial ? 'Available' : 'Not Available' },
    webBluetooth: { ok: !!(navigator as any).bluetooth, message: (navigator as any).bluetooth ? 'Available' : 'Not Available' },
    webUsb: { ok: !!(navigator as any).usb, message: (navigator as any).usb ? 'Available' : 'Not Available' },
    audioContext: { ok: !!(window as any).AudioContext, message: (window as any).AudioContext ? 'Available' : 'Not Available' },
  });

  useEffect(() => {
    async function checkDb() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        setStatus(s => ({ ...s, database: { ok: true, message: 'Connected' } }));
      } catch (err: any) {
        setStatus(s => ({ ...s, database: { ok: false, message: err.message || 'Error' } }));
      }
    }
    checkDb();
  }, []);

  const items = [
    { label: 'Firestore Database', status: status.database, icon: Database },
    { label: 'Web Serial API', status: status.webSerial, icon: Zap },
    { label: 'Web Bluetooth API', status: status.webBluetooth, icon: Bluetooth },
    { label: 'WebUSB API', status: status.webUsb, icon: Cpu },
    { label: 'AudioContext', status: status.audioContext, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-cyan-200">System Compatibility Diagnostics</h2>
      <div className="grid gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700">
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${item.status.ok ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="text-xs text-slate-200">{item.label}</span>
            </div>
            <span className={`text-[10px] font-bold ${item.status.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
              {item.status.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
