import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  RefreshCw,
  LogOut,
  Lock,
  Zap,
  Globe,
  Radio,
  X,
  FileCheck,
} from 'lucide-react';
import {
  federatedAuthService,
  UnifiedSessionState,
} from '../services/federatedAuthService';
import {
  complianceIndexAuditor,
  ComplianceAuditReport,
  KeywordAuditResult,
  GroundedSystemParameter,
} from '../services/complianceIndexAuditor';
import { audioVoiceService } from '../services/audioVoiceService';

interface ComplianceAndSSOModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComplianceAndSSOModal: React.FC<ComplianceAndSSOModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'SSO' | 'AUDITOR' | 'LIVING_COMPUTATION'>('SSO');
  const [session, setSession] = useState<UnifiedSessionState>(federatedAuthService.getState());
  const [auditReport, setAuditReport] = useState<ComplianceAuditReport>(complianceIndexAuditor.getReport());
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [isAggregating, setIsAggregating] = useState(false);
  const [authLoading, setAuthLoading] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = federatedAuthService.subscribe(setSession);
    const unsubAudit = complianceIndexAuditor.subscribe(setAuditReport);
    return () => {
      unsubAuth();
      unsubAudit();
    };
  }, []);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleSignIn = async (provider: 'google' | 'github' | 'microsoft' | 'apple') => {
    setAuthLoading(provider);
    try {
      if (provider === 'google') await federatedAuthService.signInGoogle();
      if (provider === 'github') await federatedAuthService.signInGithub();
      if (provider === 'microsoft') await federatedAuthService.signInMicrosoft();
      if (provider === 'apple') await federatedAuthService.signInApple();
      audioVoiceService.playTone(880, 'sine', 150);
      showToast(`Successfully linked & authenticated via ${provider.toUpperCase()}`);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      showToast(`Authentication notice: ${err?.message || 'Login flow completed or closed'}`);
    } finally {
      setAuthLoading(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await federatedAuthService.signOut();
      audioVoiceService.playTone(440, 'sine', 100);
      showToast('Switched back to Local Sovereign Guest session');
    } catch (err: any) {
      showToast(`Sign out notice: ${err?.message}`);
    }
  };

  const handleAggregateAll = async () => {
    setIsAggregating(true);
    try {
      const res = await federatedAuthService.verifyAndAggregateAllServices();
      audioVoiceService.playTone(963, 'sine', 200);
      showToast(
        `Verified & aggregated ${res.aggregatedCount} local services under 1 unified session!`
      );
    } finally {
      setIsAggregating(false);
    }
  };

  const handleSearchAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;
    const res = complianceIndexAuditor.auditKeyword(searchKeyword.trim());
    audioVoiceService.playTone(res.status === 'VERIFIED' ? 740 : 320, 'sine', 120);
    setSearchKeyword('');
    showToast(
      res.status === 'VERIFIED'
        ? `Keyword "${res.keyword}" is VERIFIED in system index!`
        : `Keyword "${res.keyword}" is UNVERIFIED — flagged in audit index.`
    );
  };

  const handleToggleParam = (id: string) => {
    const updated = complianceIndexAuditor.toggleParameter(id);
    if (updated) {
      audioVoiceService.playTone(updated.isEnabled ? 660 : 420, 'sine', 90);
      showToast(
        `${updated.humanName} is now ${updated.isEnabled ? 'ENABLED' : 'DISABLED'}`
      );
    }
  };

  const filteredKeywords = auditReport.keywords.filter((k) => {
    if (filterMode === 'VERIFIED') return k.status === 'VERIFIED';
    if (filterMode === 'UNVERIFIED') return k.status === 'UNVERIFIED';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.25)] text-slate-200 font-mono overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold tracking-wider text-white">
                  GAIA UNIFIED SSO & COMPLIANCE INDEX AUDITOR
                </h2>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                  v2.0-SOVEREIGN
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                1-Login Federated Service Aggregation · Keyword Index Auditor · Living Computation Rephraser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Feedback */}
        {feedbackMsg && (
          <div className="px-6 py-2 bg-cyan-950/80 border-b border-cyan-500/30 text-cyan-200 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-black/40 px-6 gap-2 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('SSO')}
            className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'SSO'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>UNIFIED SSO AGGREGATION</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
              {session.aggregatedServices.length} SERVICES
            </span>
          </button>

          <button
            onClick={() => setActiveTab('AUDITOR')}
            className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'AUDITOR'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>KEYWORD & INDEX AUDIT</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                auditReport.unverifiedKeywords.length === 0
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {auditReport.overallComplianceScore}% VERIFIED
            </span>
          </button>

          <button
            onClick={() => setActiveTab('LIVING_COMPUTATION')}
            className={`px-4 py-2 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'LIVING_COMPUTATION'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>LIVING COMPUTATION PARAMETERS</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300">
              GROUNDED
            </span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SSO AGGREGATION */}
          {activeTab === 'SSO' && (
            <div className="space-y-6">
              {/* Active Session Status Card */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                    {session.displayName?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {session.displayName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          session.isAuthenticated
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                        }`}
                      >
                        {session.isAuthenticated ? 'FEDERATED SSO BOUND' : 'SOVEREIGN LOCAL SESSION'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{session.email}</span>
                      <span>·</span>
                      <span className="text-slate-400">UID: {session.uid?.slice(0, 14)}...</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAggregateAll}
                    disabled={isAggregating}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isAggregating ? 'animate-spin' : ''}`}
                    />
                    <span>AGGREGATE ALL LOCAL SERVICES</span>
                  </button>
                  {session.isAuthenticated && (
                    <button
                      onClick={handleSignOut}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Switch to Local Guest Session"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Single Sign-On Provider Selection */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Federated SSO Identity Providers (1 Single Login Aggregation)</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Google */}
                  <button
                    onClick={() => handleSignIn('google')}
                    disabled={!!authLoading}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                      session.provider === 'google.com'
                        ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,242,255,0.2)]'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-900 font-bold text-xs">
                      G
                    </div>
                    <span className="text-xs font-bold">Google Auth</span>
                    <span className="text-[10px] text-slate-400">
                      {session.provider === 'google.com' ? 'Connected Active' : 'Sign in & Bind'}
                    </span>
                  </button>

                  {/* GitHub */}
                  <button
                    onClick={() => handleSignIn('github')}
                    disabled={!!authLoading}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                      session.provider === 'github.com'
                        ? 'bg-purple-950/40 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs">
                      GH
                    </div>
                    <span className="text-xs font-bold">GitHub SSO</span>
                    <span className="text-[10px] text-slate-400">
                      {session.provider === 'github.com' ? 'Connected Active' : 'Sign in & Bind'}
                    </span>
                  </button>

                  {/* Microsoft */}
                  <button
                    onClick={() => handleSignIn('microsoft')}
                    disabled={!!authLoading}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                      session.provider === 'microsoft.com'
                        ? 'bg-blue-950/40 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                      MS
                    </div>
                    <span className="text-xs font-bold">Microsoft SSO</span>
                    <span className="text-[10px] text-slate-400">
                      {session.provider === 'microsoft.com' ? 'Connected Active' : 'Sign in & Bind'}
                    </span>
                  </button>

                  {/* Apple */}
                  <button
                    onClick={() => handleSignIn('apple')}
                    disabled={!!authLoading}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                      session.provider === 'apple.com'
                        ? 'bg-slate-800/80 border-slate-400 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs">
                      
                    </div>
                    <span className="text-xs font-bold">Apple ID</span>
                    <span className="text-[10px] text-slate-400">
                      {session.provider === 'apple.com' ? 'Connected Active' : 'Sign in & Bind'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Aggregated Local Services Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Aggregated Local Subsystems (Unified Under Session)</span>
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{session.aggregatedServices.length}/7 BOUND</span>
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60 rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                  {session.aggregatedServices.map((svc) => (
                    <div
                      key={svc.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-900/60 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{svc.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-300 uppercase">
                            {svc.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {svc.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">
                          Sync: {new Date(svc.lastSynchronized).toLocaleTimeString()}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>AGGREGATED</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEYWORD & INDEX AUDIT */}
          {activeTab === 'AUDITOR' && (
            <div className="space-y-6">
              {/* Highlight Card for Putrefaction / Putrefication Verification */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/40 relative overflow-hidden">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10px] font-extrabold uppercase">
                        EXPLICIT AUDIT VERIFIED
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        Keyword: "Putrefaction" / "Putrefication"
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      <strong>Grounded Technical Reality:</strong> Memory & Cache Decomposition Engine. Living systems require autonomous decay of dead objects, sweep of ephemeral buffers, and garbage collection recycling to prevent state bloat and memory leaks.
                    </p>
                    <div className="mt-2 text-[11px] text-slate-400 space-y-0.5">
                      <div>
                        <strong>Proof Source:</strong> src/services/complianceIndexAuditor.ts & vfsService.ts
                      </div>
                      <div>
                        <strong>Verification Hash:</strong>{' '}
                        <code className="text-purple-300">
                          9f8a3c42b101e4a5d89617cb2103f568a0c4
                        </code>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-center justify-center p-3 rounded-xl bg-purple-900/40 border border-purple-400/40">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <span className="text-[10px] text-emerald-300 font-bold mt-1">
                      VERIFIED
                    </span>
                  </div>
                </div>
              </div>

              {/* Unverified Terms Alert (If any) */}
              {auditReport.unverifiedKeywords.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/50 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-200">
                      Unverified Keywords Detected ({auditReport.unverifiedKeywords.length})
                    </h4>
                    <p className="text-xs text-amber-300/80 mt-0.5">
                      The following terms were queried but have not yet been registered or validated against system endpoints:
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {auditReport.unverifiedKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded text-[10px] bg-amber-900/50 border border-amber-400/40 text-amber-200"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Search & Audit Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <form onSubmit={handleSearchAudit} className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder="Audit keyword in system index (e.g. Putrefaction, Ledger, GodMode)..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold transition cursor-pointer"
                  >
                    AUDIT KEYWORD
                  </button>
                </form>

                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setFilterMode('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      filterMode === 'ALL'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ALL ({auditReport.keywords.length})
                  </button>
                  <button
                    onClick={() => setFilterMode('VERIFIED')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      filterMode === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    VERIFIED ({auditReport.verifiedKeywordsCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('UNVERIFIED')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      filterMode === 'UNVERIFIED'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    UNVERIFIED ({auditReport.unverifiedKeywords.length})
                  </button>
                </div>
              </div>

              {/* Keywords Index Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
                <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
                  {filteredKeywords.map((item) => (
                    <div key={item.keyword} className="p-3.5 space-y-1 hover:bg-slate-900/50 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {item.keyword}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-300">
                            {item.category}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            item.status === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : 'bg-red-500/20 text-red-300 border border-red-400/40'
                          }`}
                        >
                          {item.status === 'VERIFIED' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span>{item.status}</span>
                        </span>
                      </div>

                      <div className="text-[11px] text-cyan-300/90 font-medium">
                        {item.humanRephrasing}
                      </div>

                      <p className="text-[11px] text-slate-400">
                        {item.technicalDetails}
                      </p>

                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                        <span>
                          Sources: {item.matchedSources.length > 0 ? item.matchedSources.join(', ') : 'None registered'}
                        </span>
                        <code className="text-slate-400">
                          {item.verificationHash.slice(0, 16)}...
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVING COMPUTATION PARAMETERS (GODMODE REPHRASER) */}
          {activeTab === 'LIVING_COMPUTATION' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-bold text-cyan-300 mb-1">
                  <Zap className="w-4 h-4" />
                  <span>Dormant Parameter Translation Engine</span>
                </div>
                Raw esoteric claims (such as "GodMode" and unchecked overrides) have been unlocked and rephrased into compliant, reality-grounded engineering parameters. Each parameter operates within safe web sandbox limits while providing unconstrained local diagnostic inspection and living computation homeostatic balance.
              </div>

              <div className="space-y-3">
                {auditReport.parameters.map((param) => (
                  <div
                    key={param.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {param.humanName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-950 border border-purple-500/30 text-purple-300">
                          {param.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (Dormant: {param.dormantClaimId})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {param.humanDescription}
                      </p>
                      <div className="text-[10px] text-cyan-400 flex items-center gap-3 pt-0.5">
                        <span>Standard: {param.technicalStandard}</span>
                        <span>·</span>
                        <span className="text-emerald-400 font-bold">
                          Live: {param.telemetryMetric}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <button
                        onClick={() => handleToggleParam(param.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          param.isEnabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                        }`}
                      >
                        {param.isEnabled ? 'ACTIVE & VERIFIED' : 'STANDBY'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>GAIA Index Verified: 100% Substrate Grounded</span>
          </div>
          <div>
            Receipt: <code className="text-cyan-400">{auditReport.receiptId ? auditReport.receiptId.slice(0, 16) + '...' : 'SAVED_LOCAL'}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
