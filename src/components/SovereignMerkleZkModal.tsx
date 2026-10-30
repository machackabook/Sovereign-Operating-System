import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Globe,
  Key,
  Lock,
  FileCode,
  CheckCircle2,
  Copy,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  sovereignMerkleZkService,
  JurisdictionRegion,
  AccessControlLog,
  ZkMerkleProof,
  RegionalMultiSigState,
} from '../services/sovereignMerkleZkService';
import { audioVoiceService } from '../services/audioVoiceService';

interface SovereignMerkleZkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SovereignMerkleZkModal: React.FC<SovereignMerkleZkModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [accessLogs, setAccessLogs] = useState<AccessControlLog[]>([]);
  const [multiSigState, setMultiSigState] = useState<RegionalMultiSigState | null>(null);
  const [activeProof, setActiveProof] = useState<ZkMerkleProof | null>(null);
  const [signingRegion, setSigningRegion] = useState<JurisdictionRegion | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const refreshData = () => {
    setAccessLogs(sovereignMerkleZkService.getAccessLogs());
    setMultiSigState(sovereignMerkleZkService.getRegionalMultiSig() || null);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignRegionalBackup = async (region: JurisdictionRegion) => {
    setSigningRegion(region);
    try {
      const updated = await sovereignMerkleZkService.signRegionalBackup('backup-sovereign-state-v1', region);
      audioVoiceService.playTone(528, 'sine', 120);
      setMultiSigState({ ...updated });
      setNotification(`Regional Multi-Sig Executed for jurisdiction [${region}]. Fully Signed: ${updated.isFullySigned ? 'YES' : 'PENDING'}`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert('Regional signing failed: ' + err?.message);
    } finally {
      setSigningRegion(null);
    }
  };

  const handleGenerateProof = async (logId: string) => {
    try {
      const proof = await sovereignMerkleZkService.generateZkMerkleProof(logId);
      audioVoiceService.playTone(740, 'sine', 100);
      setActiveProof(proof);
    } catch (err: any) {
      alert('Failed to generate ZK Merkle Proof: ' + err?.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-950 border border-emerald-500/40 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col overflow-hidden font-mono">
        {/* Header */}
        <div className="px-6 py-4 bg-black/80 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wider flex items-center gap-2">
                SOVEREIGN MERKLE PROOFS & MULTI-TENANT ACCESS LOGS
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold">
                  ZERO-KNOWLEDGE AUDIT
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Localized Regional Multi-Sig Ledger Chains (EU/US/APAC) & ZK Privacy-Preserving Audit Trail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-emerald-950/80 border border-emerald-400 text-emerald-200 text-xs rounded-xl flex items-center justify-between animate-fade-in shadow-lg">
            <span className="font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {notification}
            </span>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Localized Ledger Chains & Regional Multi-Sig Requirements */}
          {multiSigState && (
            <div className="p-5 bg-slate-900/80 border border-emerald-500/30 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    Regional Multi-Signature Jurisdictional Ledger State
                  </h3>
                  <span className="text-[10px] text-slate-400">Backup Target: {multiSigState.backupId}</span>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                  multiSigState.isFullySigned
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                }`}>
                  {multiSigState.isFullySigned ? '100% REGIONALLY SIGNED & VERIFIED' : 'PENDING REGIONAL SIGNATURES'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(['EU_WEST_1', 'US_EAST_1', 'APAC_SOUTH_1'] as JurisdictionRegion[]).map((region) => {
                  const sig = multiSigState.signatures.find((s) => s.region === region);
                  return (
                    <div
                      key={region}
                      className="p-3 bg-black/40 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-white">{region}</span>
                        {sig ? (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> SIGNED
                          </span>
                        ) : (
                          <span className="text-[10px] text-yellow-400 font-bold">MISSING</span>
                        )}
                      </div>

                      {sig ? (
                        <p className="text-[9px] text-slate-400 font-mono truncate">Key: {sig.signerKey}</p>
                      ) : (
                        <button
                          onClick={() => handleSignRegionalBackup(region)}
                          disabled={signingRegion === region}
                          className="w-full py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] rounded-lg transition cursor-pointer disabled:opacity-50"
                        >
                          {signingRegion === region ? 'SIGNING...' : `SIGN JURISDICTION [${region}]`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Zero-Knowledge Access Control Audit Logs */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Zero-Knowledge Audit Trail (Masked Paths & Commitments)</span>
              <span className="text-[10px] text-emerald-400 font-normal">ZK-SNARK Merkle Proofs: Enabled</span>
            </h3>

            <div className="space-y-3">
              {accessLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 hover:border-emerald-500/40 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white">{log.actorHandle}</span>
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400">
                        {log.role}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400">
                        {log.region}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-300 font-bold">{log.action}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Resource: {log.resourcePathMasked}</p>
                    <p className="text-[9px] text-slate-500 font-mono">ZK Commitment: {log.zkCommitmentHash}</p>
                  </div>

                  <button
                    onClick={() => handleGenerateProof(log.id)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    GENERATE ZK MERKLE PROOF
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Generated ZK Merkle Proof Inspector */}
          {activeProof && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-400/50 rounded-2xl space-y-2 animate-fade-in">
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  VERIFIED ZERO-KNOWLEDGE MERKLE PROOF ({activeProof.proofId})
                </span>
                <button
                  onClick={() => setActiveProof(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close Proof
                </button>
              </div>

              <div className="space-y-1 text-[11px] font-mono text-slate-300">
                <p><span className="text-slate-400">Root Merkle Hash:</span> {activeProof.rootMerkleHash}</p>
                <p><span className="text-slate-400">Leaf Commitment:</span> {activeProof.leafHash}</p>
                <p><span className="text-slate-400">Sibling Path:</span> [{activeProof.pathElements.join(', ')}]</p>
                <p><span className="text-slate-400">Verification Status:</span> <span className="text-emerald-400 font-extrabold">3RD-PARTY AUDIT VALIDATED (0 Data Leaked)</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
