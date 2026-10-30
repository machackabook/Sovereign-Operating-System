import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const ConnectorSettingsModule = () => {
  const [vaultEnabled, setVaultEnabled] = useState(false);
  const [waybackEnabled, setWaybackEnabled] = useState(false);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (userId) {
      // Load configurations from Firestore
      // ... (simplified for this turn)
    }
  }, [userId]);

  const toggleVault = async () => {
    const newState = !vaultEnabled;
    setVaultEnabled(newState);
    if (userId) {
      await setDoc(doc(db, `userStates/${userId}/vaultConfigs/default`), { userId, enabled: newState, updatedAt: new Date().toISOString() });
    }
  };

  const toggleWayback = async () => {
    const newState = !waybackEnabled;
    setWaybackEnabled(newState);
    if (userId) {
      await setDoc(doc(db, `userStates/${userId}/waybackConfigs/default`), { userId, enabled: newState, updatedAt: new Date().toISOString() });
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded shadow-md">
      <h2 className="text-xl mb-4 font-bold">Connector Settings</h2>
      <div className="flex justify-between items-center mb-2">
        <span>Google Vault</span>
        <button onClick={toggleVault} className={`px-4 py-2 rounded ${vaultEnabled ? 'bg-green-600' : 'bg-red-600'}`}>
          {vaultEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>
      <div className="flex justify-between items-center">
        <span>Wayback Machine</span>
        <button onClick={toggleWayback} className={`px-4 py-2 rounded ${waybackEnabled ? 'bg-green-600' : 'bg-red-600'}`}>
          {waybackEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>
    </div>
  );
};
