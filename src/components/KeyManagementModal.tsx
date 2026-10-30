import React, { useState, useEffect } from 'react';
import { X, Key, Shield, Clock, Lock, Unlock } from 'lucide-react';
import { getAllKeys, isVaultLocked } from '../services/cryptoStorageService';
import { generateKeyPair } from '../services/e2eeService';
import { saveKey } from '../services/cryptoStorageService';
import { autoLockService } from '../services/autoLockService';

interface KeyManagementModalProps {
  onClose: () => void;
}

export const KeyManagementModal: React.FC<KeyManagementModalProps> = ({ onClose }) => {
  const [keys, setKeys] = useState<any[]>([]);
  const [locked, setLocked] = useState<boolean>(isVaultLocked());

  const fetchKeys = async () => {
    try {
      if (isVaultLocked()) {
        setLocked(true);
        setKeys([]);
        return;
      }
      setLocked(false);
      const allKeys = await getAllKeys();
      setKeys(allKeys);
    } catch {
      setLocked(true);
      setKeys([]);
    }
  };

  useEffect(() => {
    fetchKeys();
    const unsub = autoLockService.subscribe((state) => {
      setLocked(state.isLocked);
      if (!state.isLocked) {
        fetchKeys();
      }
    });
    return unsub;
  }, []);

  const handleGenerateRSA = async () => {
    try {
      const keyPair = await generateKeyPair();
      const newKey = {
          id: `rsa-${Date.now()}`,
          label: 'RSA-4096-' + new Date().toISOString().slice(0, 10),
          type: 'RSA-4096',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 31536000000).toISOString(),
          publicKey: keyPair.publicKey,
      };
      await saveKey(newKey);
      await fetchKeys();
    } catch (err: any) {
      alert(err?.message || 'Failed to generate key');
    }
  };

  const handleQuickUnlock = () => {
    autoLockService.unlock();
    fetchKeys();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[600px] bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            SECURE KEY MANAGEMENT
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {locked ? (
          <div className="p-6 rounded-xl bg-amber-950/30 border border-amber-500/40 text-center space-y-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Cryptographic Vault is Locked
              </h3>
              <p className="text-xs text-amber-300/80 mt-1">
                Auto-lock engaged after 5 minutes of inactivity. Volatile memory cleared and IndexedDB key access locked.
              </p>
            </div>
            <button
              onClick={handleQuickUnlock}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 rounded-xl text-xs font-bold transition flex items-center gap-2 mx-auto cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.2)]"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Sovereign Vault</span>
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
              {keys.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No cryptographic keys generated yet. Click below to generate an RSA-4096 pair.
                </div>
              ) : (
                keys.map((key) => (
                  <div key={key.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{key.label}</div>
                      <div className="text-xs text-slate-400 font-mono">Type: {key.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires: {new Date(key.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={handleGenerateRSA}
              className="w-full py-2 bg-cyan-900/40 border border-cyan-500/50 text-cyan-200 rounded-xl hover:bg-cyan-900/60 transition cursor-pointer text-xs font-bold"
            >
              Generate New RSA-4096 Key
            </button>
          </>
        )}
      </div>
    </div>
  );
};
