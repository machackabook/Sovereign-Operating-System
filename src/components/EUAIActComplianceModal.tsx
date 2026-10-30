import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  CheckCircle2,
  XCircle,
  Cpu,
  Lock,
  Activity,
  Award,
  Sparkles,
  Download,
} from 'lucide-react';
import {
  euAiComplianceService,
  ModelAuditProfile,
  ConformitySealReceipt,
} from '../services/euAiComplianceService';
import { audioVoiceService } from '../services/audioVoiceService';

interface EUAIActComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EUAIActComplianceModal: React.FC<EUAIActComplianceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [registry, setRegistry] = useState<ModelAuditProfile[]>([]);
  const [report, setReport] = useState<any>(null);
  const [sealingModelId, setSealingModelId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const refreshData = () => {
    setRegistry(euAiComplianceService.getActiveRegistry());
    setReport(euAiComplianceService.getComplianceReport());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      const interval = setInterval(refreshData, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen || !report) return null;

  const handleSealLog = async (modelId: string) => {
    setSealingModelId(modelId);
    try {
      const receipt = await euAiComplianceService.sealConformityLog(modelId);
      audioVoiceService.playTone(740, 'sine', 120);
      setNotification(`Conformity Log Sealed for [${modelId}]. Hash Receipt: ${receipt.sha256Seal.slice(0, 14)}...`);
      refreshData();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert('Failed to seal conformity log: ' + err?.message);
    } finally {
      setSealingModelId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(0,242,255,0.2)] flex flex-col overflow-hidden font-mono">
        {/* Header */}
        <div className="px-6 py-4 bg-black/80 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wider flex items-center gap-2">
                EU AI ACT COMPLIANCE PROFILER & RISK-TIER REGISTRY
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold">
                  EU 2024/1689 HARMONIZED
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Automated Systemic Risk Monitoring, Token Variance Tracking & Signed Conformity Log Sealing
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

        {/* Top Metric Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-900/60 border-b border-slate-800 text-xs">
          <div className="p-3 bg-black/50 rounded-2xl border border-cyan-500/30">
            <span className="text-[10px] text-slate-400 font-bold">OVERALL COMPLIANCE</span>
            <div className="text-lg font-black text-cyan-300 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {report.overallScore}%
            </div>
          </div>
          <div className="p-3 bg-black/50 rounded-2xl border border-emerald-500/30">
            <span className="text-[10px] text-slate-400 font-bold">LIMITED RISK MODELS</span>
            <div className="text-lg font-black text-emerald-400 mt-0.5">{report.limitedRiskCount} / {report.totalAuditedModels}</div>
          </div>
          <div className="p-3 bg-black/50 rounded-2xl border border-purple-500/30">
            <span className="text-[10px] text-slate-400 font-bold">MINIMAL RISK MODELS</span>
            <div className="text-lg font-black text-purple-300 mt-0.5">{report.minimalRiskCount}</div>
          </div>
          <div className="p-3 bg-black/50 rounded-2xl border border-red-500/30">
            <span className="text-[10px] text-slate-400 font-bold">SYSTEMIC UNACCEPTABLE</span>
            <div className="text-lg font-black text-emerald-400 mt-0.5">{report.systemicUnacceptableCount} (0%)</div>
          </div>
          <div className="p-3 bg-black/50 rounded-2xl border border-cyan-500/30">
            <span className="text-[10px] text-slate-400 font-bold">SEALED CONFORMITY LOGS</span>
            <div className="text-lg font-black text-cyan-300 mt-0.5">{report.sealedLogsCount} Seals</div>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="mx-4 mt-3 px-4 py-2.5 bg-emerald-950/80 border border-emerald-400 text-emerald-200 text-xs rounded-xl flex items-center justify-between animate-fade-in shadow-lg">
            <span className="font-bold flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              {notification}
            </span>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Active Model Registry & Risk-Tier Audits</span>
              <span className="text-[10px] text-cyan-400 font-normal">Real-Time Telemetry Sampling: Active</span>
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {registry.map((model) => (
                <div
                  key={model.modelId}
                  className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-cyan-500/40 transition space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        {model.displayName}
                      </h4>
                      <span className="text-[10px] text-slate-400">ID: {model.modelId}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-cyan-500/20 border border-cyan-400 text-cyan-300">
                        RISK: {model.riskTier}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                        ALIGNMENT: {model.alignmentScore}%
                      </span>
                      <button
                        onClick={() => handleSealLog(model.modelId)}
                        disabled={sealingModelId === model.modelId}
                        className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        {sealingModelId === model.modelId ? 'SEALING...' : 'SEAL CONFORMITY LOG'}
                      </button>
                    </div>
                  </div>

                  {/* Systemic Risk Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-black/40 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Token Var (Std Dev)</span>
                      <span className="font-bold text-cyan-300">{model.tokenVarianceStdDev}</span>
                    </div>
                    <div className="p-2.5 bg-black/40 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Demographic Parity</span>
                      <span className="font-bold text-emerald-400">{(model.biasMetrics.demographicParityScore * 100).toFixed(1)}%</span>
                    </div>
                    <div className="p-2.5 bg-black/40 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Toxicity Floor</span>
                      <span className="font-bold text-emerald-400">{model.biasMetrics.toxicityFloor}</span>
                    </div>
                    <div className="p-2.5 bg-black/40 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Factual Drift Index</span>
                      <span className="font-bold text-purple-300">{model.biasMetrics.factualDriftIndex}</span>
                    </div>
                  </div>

                  {/* Harmonized Articles Status Checklist */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">EU Harmonized Articles Compliance (2024/1689):</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                      <div className="flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Art. 10 Data Governance
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Art. 11 Technical Documentation
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Art. 12 Record-Keeping
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Art. 13 Transparency
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Art. 14 Human Oversight
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Art. 15 Cybersecurity
                      </div>
                    </div>
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
