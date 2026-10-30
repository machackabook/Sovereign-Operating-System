import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  ShieldCheck,
  Zap,
  Activity,
  Server,
  Lock,
  RefreshCw,
  HardDrive,
  Layers,
  Terminal,
} from 'lucide-react';
import {
  confidentialComputeSlurmService,
  SlurmPartition,
  HardwareAttestationRing,
} from '../services/confidentialComputeSlurmService';
import { audioVoiceService } from '../services/audioVoiceService';

interface ConfidentialComputeSlurmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfidentialComputeSlurmModal: React.FC<ConfidentialComputeSlurmModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [partitions, setPartitions] = useState<SlurmPartition[]>([]);
  const [rings, setRings] = useState<HardwareAttestationRing[]>([]);
  const [isResealing, setIsResealing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const refreshData = () => {
    setPartitions(confidentialComputeSlurmService.getSlurmPartitions());
    setRings(confidentialComputeSlurmService.getAttestationRings());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      const interval = setInterval(refreshData, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReSealEnclaves = async () => {
    setIsResealing(true);
    try {
      const res = await confidentialComputeSlurmService.executeHardwareAttestationReSeal();
      audioVoiceService.playTone(963, 'sine', 150);
      setNotification(`Hardware Enclaves Re-Sealed! ${res.ringsVerified} Rings Attested. Hash: ${res.attestationHashes[0].slice(0, 14)}...`);
      refreshData();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert('Enclave attestation failed: ' + err?.message);
    } finally {
      setIsResealing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-950 border border-purple-500/40 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col overflow-hidden font-mono">
        {/* Header */}
        <div className="px-6 py-4 bg-black/80 border-b border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-purple-500/20 border border-purple-400 text-purple-300">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wider flex items-center gap-2">
                CONFIDENTIAL COMPUTE ENCLAVE & SLURM TELEMETRY
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 border border-purple-400 text-purple-300 font-bold">
                  HPC MESH V4
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                High-Performance Computing Slurm Partitions & Cryptographic Hardware Attestation Rings
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

        {/* Top Control Notification Bar */}
        {notification && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-purple-950/80 border border-purple-400 text-purple-200 text-xs rounded-xl flex items-center justify-between animate-fade-in shadow-lg">
            <span className="font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              {notification}
            </span>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Slurm Partition Allocation Matrix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                Slurm HPC Partition Mapping
              </h3>
              <span className="text-[10px] text-slate-400">Mesh v4 Telemetry: Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {partitions.map((p) => (
                <div
                  key={p.partitionName}
                  className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 hover:border-purple-500/40 transition"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-sm font-extrabold text-white">{p.partitionName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold">
                      {p.availableNodes} / {p.nodeCount} NODES READY
                    </span>
                  </div>

                  <p className="text-[11px] text-purple-300 font-bold">{p.gpuArchitecture}</p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Tensor Core Load</span>
                        <span className="text-cyan-300 font-bold">{p.tensorCoreUtilization}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                          style={{ width: `${p.tensorCoreUtilization}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div className="p-2 bg-black/40 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block">Active Jobs</span>
                        <span className="text-white font-bold">{p.activeJobs} ({p.pendingArrayJobs} pending)</span>
                      </div>
                      <div className="p-2 bg-black/40 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block">Power Draw</span>
                        <span className="text-purple-300 font-bold">{(p.powerDrawWatts / 1000).toFixed(1)} kW</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hardware Attestation Rings */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" />
                Confidential Compute Hardware Attestation Rings
              </h3>

              <button
                onClick={handleReSealEnclaves}
                disabled={isResealing}
                className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-black font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResealing ? 'animate-spin' : ''}`} />
                {isResealing ? 'ATTESTING...' : 'RE-SEAL ENCLAVE RINGS'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {rings.map((ring) => (
                <div
                  key={ring.ringId}
                  className="p-4 bg-slate-900/80 border border-purple-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white">{ring.ringId}</span>
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-400">
                        {ring.enclaveType}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">Range: {ring.volatileMemoryAddressRange}</p>
                    <p className="text-[10px] text-cyan-300 font-mono">Attestation Hash: {ring.attestationMeasurementHash}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-extrabold text-xs rounded-xl flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {ring.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
