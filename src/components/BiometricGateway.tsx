import React, { useState } from 'react';
import { Fingerprint, Lock, Unlock, AlertCircle } from 'lucide-react';
import { webAuthnService } from '../services/webAuthnService';

interface BiometricGatewayProps {
  onUnlock: () => void;
  isInitialRegistration?: boolean;
}

export const BiometricGateway: React.FC<BiometricGatewayProps> = ({ onUnlock, isInitialRegistration }) => {
  const [status, setStatus] = useState<'idle' | 'authenticating' | 'error'>('idle');

  const handleAction = async () => {
    setStatus('authenticating');
    const result = isInitialRegistration 
      ? await webAuthnService.register('Operator')
      : await webAuthnService.authenticate();
      
    if (result) {
      onUnlock();
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-[#0a0f1d] border border-cyan-500/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.2)] text-center max-w-sm w-full">
        <div className="w-20 h-20 mx-auto bg-cyan-950/50 rounded-full flex items-center justify-center mb-6 border border-cyan-500/30">
          <Fingerprint className="w-10 h-10 text-cyan-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Secure Enclave Locked</h2>
        <p className="text-sm text-slate-400 mb-8">
          {isInitialRegistration ? 'Register biometric key for this session.' : 'Authenticate to unlock sensitive terminal components.'}
        </p>

        <button
          onClick={handleAction}
          disabled={status === 'authenticating'}
          className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
            status === 'authenticating' ? 'bg-slate-700 text-slate-400' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
        >
          {status === 'authenticating' ? 'Verifying...' : <><Unlock className="w-4 h-4" /> Authenticate</>}
        </button>

        {status === 'error' && (
          <div className="mt-4 flex items-center justify-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>Authentication Failed. Retry or check hardware.</span>
          </div>
        )}
      </div>
    </div>
  );
};
