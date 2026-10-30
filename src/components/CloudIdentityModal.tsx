import React, { useState, useEffect } from 'react';
import { Shield, Key, Cloud, CheckCircle2, RefreshCw, X, UserCheck, Terminal, ExternalLink } from 'lucide-react';
import { cloudIdentityService, FederatedIdentityReport, AwsIdentitySession, MicrosoftGraphProfile } from '../services/cloudIdentityService';

interface CloudIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudIdentityModal: React.FC<CloudIdentityModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<FederatedIdentityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadIdentityReport = async () => {
    setLoading(true);
    try {
      const data = await cloudIdentityService.getFederatedReport();
      setReport(data);
    } catch (err: any) {
      setNotice(`Report error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadIdentityReport();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleUnmaskAnonymous = async () => {
    setLoading(true);
    try {
      const unmasked = await cloudIdentityService.unmaskAnonymousUser();
      setNotice(`Identity unmasked! Assigned operative ID: ${unmasked.uid}`);
      await loadIdentityReport();
    } catch (err: any) {
      setNotice(`Unmask notice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssumeAwsRole = async () => {
    setLoading(true);
    try {
      const session = await cloudIdentityService.assumeAwsRole();
      setNotice(`AWS STS Role Assumed: ${session.role} [${session.region}]`);
      await loadIdentityReport();
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftAuth = async () => {
    setLoading(true);
    try {
      const profile = await cloudIdentityService.signInWithMicrosoft();
      setNotice(`Microsoft Entra ID token renewed for: ${profile.mail}`);
      await loadIdentityReport();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[680px] bg-[#030914] border border-amber-500/40 rounded-xl shadow-[0_0_60px_rgba(245,158,11,0.2)] flex flex-col overflow-hidden text-amber-100 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/60 bg-[#140f04]/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wide text-white">FEDERATED CLOUD IDENTITY & SSO</h2>
                <span className="px-2 py-0.5 text-xs rounded border border-emerald-500/40 bg-emerald-950/40 text-emerald-300">
                  AWS • MICROSOFT • FIREBASE
                </span>
              </div>
              <p className="text-xs text-amber-400/80">Account: machackabook@gmail.com</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadIdentityReport}
              title="Refresh Identity State"
              className="p-2 text-amber-400 hover:text-white rounded-lg hover:bg-amber-950 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-red-950/40 hover:text-red-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice alert */}
        {notice && (
          <div className="px-6 py-2 bg-amber-950/80 border-b border-amber-700/40 text-xs flex items-center justify-between text-amber-300">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} className="text-amber-500 hover:text-white">✕</button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Card 1: Anonymous & Firebase Identity Unmasking */}
          <div className="p-5 rounded-xl bg-black/50 border border-amber-900/50">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-950">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Identity Unmasking & Local Session
                </h3>
              </div>
              <button
                onClick={handleUnmaskAnonymous}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 transition-colors flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                Unmask Anonymous Identity
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-black/60 border border-zinc-800">
                <div className="text-zinc-400 mb-1">Session UID:</div>
                <div className="font-mono text-cyan-300 break-all">
                  {report?.firebaseAuth?.uid || 'INITIALIZING...'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-black/60 border border-zinc-800">
                <div className="text-zinc-400 mb-1">Operative Handle:</div>
                <div className="text-white font-semibold">
                  {report?.firebaseAuth?.displayName || 'Unmasked Operative'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 2: AWS STS / IAM Identity */}
            <div className="p-5 rounded-xl bg-black/50 border border-amber-900/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-950">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-white">AWS STS Identity</h3>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] rounded bg-amber-950 border border-amber-500/40 text-amber-300">
                    us-east-1
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-400">Account ID: </span>
                    <span className="text-white font-mono">{report?.awsSession?.accountId}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Assumed Role: </span>
                    <span className="text-amber-300 font-semibold">{report?.awsSession?.role}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Session ARN: </span>
                    <div className="p-2 rounded bg-black/60 border border-zinc-800 font-mono text-[11px] text-zinc-300 break-all mt-1">
                      {report?.awsSession?.arn}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAssumeAwsRole}
                disabled={loading}
                className="mt-4 w-full py-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
                Assume Sovereign AWS Role
              </button>
            </div>

            {/* Card 3: Microsoft Entra ID / Graph API */}
            <div className="p-5 rounded-xl bg-black/50 border border-amber-900/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-950">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">Microsoft Entra ID</h3>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] rounded bg-blue-950 border border-blue-500/40 text-blue-300">
                    MS Graph API
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-400">User Principal: </span>
                    <span className="text-blue-300 font-semibold">{report?.microsoftProfile?.userPrincipalName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Mail: </span>
                    <span className="text-white">{report?.microsoftProfile?.mail}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Granted Scopes: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {report?.microsoftProfile?.scopes?.map(s => (
                        <span key={s} className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleMicrosoftAuth}
                disabled={loading}
                className="mt-4 w-full py-2.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                Re-Authenticate Microsoft Entra ID
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-amber-900/60 bg-[#140f04]/90 flex items-center justify-between text-xs text-amber-400/80">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Multi-Tenant Federation: ACTIVE</span>
          </div>
          <span>Cryptic News Cloud SSO Matrix</span>
        </div>
      </div>
    </div>
  );
};
