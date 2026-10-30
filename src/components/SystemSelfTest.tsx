import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { gaiaConnectionVerifier } from '../services/gaiaConnectionVerifier.mjs';

export interface HealthState {
  status: 'running' | 'passed' | 'failed';
  error: string | null;
  subsystems: Record<string, string>;
}

export const SystemSelfTest: React.FC<{children: (health: HealthState) => React.ReactNode}> = ({ children }) => {
  const [health, setHealth] = useState<HealthState>({ status: 'running', error: null, subsystems: {} });

  useEffect(() => {
    const runTest = async () => {
      try {
        // API Key Check
        if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
          throw new Error('VITE_GOOGLE_MAPS_API_KEY missing');
        }
        // Firestore Check
        await getDoc(doc(db, 'test', 'connection'));
        
        // Subsystem Check
        const status = await gaiaConnectionVerifier.refresh();
        const subsystems: Record<string, string> = {};
        status.services.forEach((s: any) => subsystems[s.id] = s.state);
        
        setHealth({ status: 'passed', error: null, subsystems });
      } catch (e: any) {
        setHealth({ status: 'failed', error: e.message, subsystems: {} });
      }
    };
    runTest();
  }, []);

  return <>{children(health)}</>;
};
