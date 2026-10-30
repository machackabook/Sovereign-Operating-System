import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Download,
  Trash2,
  Copy,
  Check,
  Search,
  Hash,
  Clock,
  Terminal,
  Database,
  Wrench,
  Bug,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  HashReceipt,
  getAllReceipts,
  createStateReceipt,
  simulateReceiptTamper,
  repairReceiptHash,
  deleteReceipt,
  clearAllReceipts,
  seedInitialReceiptsIfEmpty,
  verifyReceiptIntegrity,
} from '../services/cryptoStorageService';
import { EnvironmentState } from '../types';
import { audioVoiceService } from '../services/audioVoiceService';

interface IntegrityLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  envState: EnvironmentState;
}

interface VerifiedReceiptItem {
  receipt: HashReceipt;
  isValid: boolean;
  computedHash: string;
  isVerifying: boolean;
}

export const IntegrityLedgerModal: React.FC<IntegrityLedgerModalProps> = ({
  isOpen,
  onClose,
  envState,
}) => {
  const [items, setItems] = useState<VerifiedReceiptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'tampered' | 'verified' | 'snapshots'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [verificationDurationMs, setVerificationDurationMs] = useState<number>(0);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'warn' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'warn' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadAndVerifyAll = useCallback(async () => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gaia:ledger-scan-started'));
    }
    const t0 = performance.now();
    try {
      let rawReceipts = await getAllReceipts();
      if (rawReceipts.length === 0) {
        rawReceipts = await seedInitialReceiptsIfEmpty(envState);
      }

      // Verify each receipt using Web Crypto SHA-256
      const verifiedList: VerifiedReceiptItem[] = await Promise.all(
        rawReceipts.map(async (receipt) => {
          const res = await verifyReceiptIntegrity(receipt);
          return {
            receipt,
            isValid: res.isValid,
            computedHash: res.computedHash,
            isVerifying: false,
          };
        })
      );

      const elapsed = Math.round(performance.now() - t0);
      setVerificationDurationMs(elapsed);
      setItems(verifiedList);
    } catch (err: any) {
      console.error('Failed to load integrity ledger receipts:', err);
      showNotification('Failed to access IndexedDB integrity vault', 'error');
    } finally {
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gaia:ledger-scan-completed'));
      }
    }
  }, [envState]);

  useEffect(() => {
    if (isOpen) {
      loadAndVerifyAll();
    }
  }, [isOpen, loadAndVerifyAll]);

  // Handle single receipt tamper simulation
  const handleSimulateTamper = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const ok = await simulateReceiptTamper(id);
      if (ok) {
        audioVoiceService.playTone(220, 'sawtooth', 120);
        showNotification(`State tampering simulated for receipt: ${id.slice(0, 14)}...`, 'warn');
        await loadAndVerifyAll();
      }
    } catch {
      showNotification('Failed to tamper receipt', 'error');
    }
  };

  // Handle repairing / re-signing receipt hash
  const handleRepair = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const ok = await repairReceiptHash(id);
      if (ok) {
        audioVoiceService.playTone(880, 'sine', 80);
        showNotification(`Receipt re-signed with valid SHA-256 hash`, 'success');
        await loadAndVerifyAll();
      }
    } catch {
      showNotification('Failed to repair receipt', 'error');
    }
  };

  // Create live state snapshot receipt from current envState
  const handleCreateSnapshot = async () => {
    try {
      const label = `Live Environment Snapshot (${envState.topology.toUpperCase()})`;
      await createStateReceipt(envState, label, 'STATE_SNAPSHOT', 'machackabook@gmail.com');
      audioVoiceService.playTone(660, 'sine', 90);
      showNotification('Cryptographic state receipt stamped and committed to vault', 'success');
      await loadAndVerifyAll();
    } catch {
      showNotification('Failed to record state snapshot', 'error');
    }
  };

  // Delete a single receipt
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Remove this receipt from the integrity ledger?')) return;
    try {
      await deleteReceipt(id);
      showNotification('Receipt removed from vault', 'success');
      await loadAndVerifyAll();
    } catch {
      showNotification('Failed to delete receipt', 'error');
    }
  };

  // Purge all receipts and reseed
  const handlePurgeAll = async () => {
    if (!confirm('Purge all receipts in the local vault and regenerate clean genesis seals?')) return;
    try {
      await clearAllReceipts();
      await seedInitialReceiptsIfEmpty(envState);
      showNotification('Ledger purged and re-seeded with pristine genesis baseline', 'success');
      await loadAndVerifyAll();
    } catch {
      showNotification('Failed to purge ledger', 'error');
    }
  };

  // Export ledger report as JSON
  const handleExportLedger = () => {
    const exportPayload = {
      vaultVersion: 'SOS_INTEGRITY_LEDGER_V1',
      exportedAt: new Date().toISOString(),
      cryptoAlgorithm: 'SHA-256 (Web Crypto API)',
      totalReceipts: items.length,
      tamperedCount: items.filter((i) => !i.isValid).length,
      verifiedCount: items.filter((i) => i.isValid).length,
      records: items.map((i) => ({
        ...i.receipt,
        verifiedStatus: i.isValid ? 'INTACT' : 'TAMPERED_HASH_MISMATCH',
        recomputedHash: i.computedHash,
      })),
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integrity_ledger_proof_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Integrity ledger report exported', 'success');
  };

  const handleCopyHash = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filtered receipts
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.receipt.receiptId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.receipt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.receipt.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.receipt.storedHash.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filter === 'tampered') return !item.isValid;
      if (filter === 'verified') return item.isValid;
      if (filter === 'snapshots') return item.receipt.type === 'STATE_SNAPSHOT';
      return true;
    });
  }, [items, filter, searchQuery]);

  const totalCount = items.length;
  const tamperedCount = items.filter((i) => !i.isValid).length;
  const verifiedCount = items.filter((i) => i.isValid).length;
  const hasTampering = tamperedCount > 0;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ledger-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in font-mono select-none"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.15)] overflow-hidden text-xs text-slate-200">
        
        {/* Glow Header Accent Line */}
        <div className={`h-1 w-full ${hasTampering ? 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse' : 'bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500'}`} />

        {/* Modal Header Deck */}
        <header className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${hasTampering ? 'bg-red-950/50 border-red-500/60 text-red-400 animate-pulse' : 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.25)]'}`}>
              {hasTampering ? <ShieldAlert className="w-5 h-5 text-red-400" /> : <ShieldCheck className="w-5 h-5 text-cyan-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="ledger-title" className="text-sm sm:text-base font-extrabold tracking-wider text-white">
                  CRYPTOGRAPHIC INTEGRITY LEDGER
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400">
                  IndexedDB Vault
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time SHA-256 hash recalculation and anti-tamper state verification
              </p>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateSnapshot}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-[11px] font-semibold transition cursor-pointer shadow-[0_0_12px_rgba(0,242,255,0.15)]"
              title="Snapshot and seal current environment state into an immutable hash receipt"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-300" />
              <span>Snapshot State</span>
            </button>

            <button
              onClick={loadAndVerifyAll}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Re-run SHA-256 integrity verification across all records"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-300 transition cursor-pointer"
              title="Close Integrity Ledger"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Tamper Alert / All-Clear Status Banner */}
        <div className={`px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs transition-colors ${
          hasTampering
            ? 'bg-red-950/40 border-red-500/40 text-red-200'
            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2 font-bold tracking-wide">
            {hasTampering ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
                <span className="text-red-300 uppercase tracking-wider">
                  Critical Warning: State Tampering Detected ({tamperedCount} {tamperedCount === 1 ? 'Record' : 'Records'} Corrupted)
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 uppercase tracking-wider">
                  All Records Intact (0 Tampered) · Cryptographic Proof Validated
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>Verified in <strong className="text-cyan-300">{verificationDurationMs}ms</strong></span>
            <span>·</span>
            <span>Algorithm: <strong className="text-slate-300">SHA-256</strong></span>
          </div>
        </div>

        {/* Metrics Overview Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950 border-b border-slate-800/80 shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Stored Receipts</span>
            <span className="text-lg font-extrabold text-white mt-1">{totalCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between">
            <span className="text-[10px] text-emerald-400 uppercase font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Intact / Verified
            </span>
            <span className="text-lg font-extrabold text-emerald-300 mt-1">{verifiedCount}</span>
          </div>
          <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
            hasTampering ? 'bg-red-950/30 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <span className={`text-[10px] uppercase font-semibold flex items-center gap-1 ${hasTampering ? 'text-red-400' : 'text-slate-400'}`}>
              <AlertTriangle className={`w-3 h-3 ${hasTampering ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
              Tampered / Corrupt
            </span>
            <span className={`text-lg font-extrabold mt-1 ${hasTampering ? 'text-red-400' : 'text-slate-400'}`}>{tamperedCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col justify-between">
            <span className="text-[10px] text-cyan-400 uppercase font-semibold flex items-center gap-1">
              <Database className="w-3 h-3 text-cyan-400" /> Storage Engine
            </span>
            <span className="text-xs font-bold text-cyan-200 mt-2 truncate">IndexedDB: receipts</span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/60 border border-slate-800 text-[11px]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filter === 'all' ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilter('tampered')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                filter === 'tampered'
                  ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                  : hasTampering
                  ? 'text-red-400 hover:text-red-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {hasTampering && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />}
              Tampered ({tamperedCount})
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filter === 'verified' ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Verified ({verifiedCount})
            </button>
            <button
              onClick={() => setFilter('snapshots')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filter === 'snapshots' ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Snapshots
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search receipt ID, label, hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-black/60 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 text-[11px]"
            />
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`px-4 py-2 border-b text-xs flex items-center justify-between ${
            notification.type === 'error'
              ? 'bg-red-950/80 border-red-500/50 text-red-200'
              : notification.type === 'warn'
              ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
              : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
          }`}>
            <span className="font-semibold">{notification.text}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Receipts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {isLoading ? (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
              <span>Hashing state records with Web Crypto SHA-256...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Hash className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">No integrity receipts match current filter</p>
              <p className="text-[11px] text-slate-600 mt-1">Snapshot current environment state or reset filter</p>
            </div>
          ) : (
            filteredItems.map(({ receipt, isValid, computedHash }) => {
              const isExpanded = expandedId === receipt.id;
              const isMismatched = !isValid;

              return (
                <div
                  key={receipt.id}
                  onClick={() => setExpandedId(isExpanded ? null : receipt.id)}
                  className={`rounded-2xl border transition-all p-3.5 cursor-pointer ${
                    isMismatched
                      ? 'bg-red-950/20 hover:bg-red-950/30 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                      : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/90 hover:border-cyan-500/40'
                  }`}
                >
                  {/* Top Row: Status Badge & Label */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isMismatched ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950 border border-red-500 text-red-300 font-extrabold text-[10px] animate-pulse">
                          <XCircle className="w-3 h-3 text-red-400" />
                          TAMPERED // HASH MISMATCH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          INTACT // VERIFIED
                        </span>
                      )}

                      <span className="text-xs font-bold text-white truncate max-w-[240px] sm:max-w-md">
                        {receipt.label}
                      </span>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-black/60 border border-slate-800 text-cyan-300">
                        {receipt.type}
                      </span>
                      <span className="hidden sm:inline text-slate-500">
                        {new Date(receipt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* Receipt ID & Author */}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">ID:</span>
                      <code className="text-cyan-300 font-bold">{receipt.receiptId}</code>
                      <button
                        onClick={(e) => handleCopyHash(receipt.receiptId, receipt.receiptId, e)}
                        className="p-1 hover:text-white transition"
                        title="Copy Receipt ID"
                      >
                        {copiedId === receipt.receiptId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Author: <span className="text-slate-300">{receipt.author}</span>
                    </div>
                  </div>

                  {/* Hash Visual Comparison Deck */}
                  <div className="mt-3 p-2.5 rounded-xl bg-black/70 border border-slate-800/80 space-y-1.5 text-[10px] font-mono">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-slate-500 flex items-center gap-1 shrink-0">
                        <Hash className="w-3 h-3 text-slate-400" /> STORED RECEIPT HASH:
                      </span>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className={`truncate ${isMismatched ? 'text-amber-300 line-through' : 'text-emerald-300'}`}>
                          {receipt.storedHash}
                        </span>
                        <button
                          onClick={(e) => handleCopyHash(receipt.storedHash, `stored-${receipt.id}`, e)}
                          className="shrink-0 text-slate-500 hover:text-white"
                          title="Copy Stored Hash"
                        >
                          {copiedId === `stored-${receipt.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-slate-800/60">
                      <span className="text-slate-500 flex items-center gap-1 shrink-0">
                        <RefreshCw className="w-3 h-3 text-cyan-400" /> RECALCULATED CURRENT HASH:
                      </span>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className={`font-bold truncate ${isMismatched ? 'text-red-400 font-extrabold' : 'text-emerald-300'}`}>
                          {computedHash}
                        </span>
                        <button
                          onClick={(e) => handleCopyHash(computedHash, `computed-${receipt.id}`, e)}
                          className="shrink-0 text-slate-500 hover:text-white"
                          title="Copy Recalculated Hash"
                        >
                          {copiedId === `computed-${receipt.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {isMismatched && (
                      <div className="pt-1.5 text-red-400 font-bold flex items-center gap-1.5 text-[10px] border-t border-red-500/20">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>TAMPER WARNING: The underlying payload content has diverged from its original cryptographic seal.</span>
                      </div>
                    )}
                  </div>

                  {/* Expandable Payload Inspector */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                          RAW SEALED PAYLOAD INSPECTOR
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {receipt.payload.length} bytes · {receipt.algorithm}
                        </span>
                      </div>
                      <pre className="p-3 rounded-xl bg-black/90 border border-slate-800/80 text-[10px] text-cyan-200 overflow-x-auto max-h-48 custom-scrollbar">
                        {receipt.payload}
                      </pre>
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  <div className="mt-3 pt-2 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[10px] text-slate-500 font-mono">
                      {receipt.merkleDigest && (
                        <span>Digest: <code className="text-slate-400">{receipt.merkleDigest}</code></span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isMismatched ? (
                        <button
                          onClick={(e) => handleRepair(receipt.id, e)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                          title="Recompute and stamp valid hash for the current payload"
                        >
                          <Wrench className="w-3 h-3 text-emerald-400" />
                          <span>Re-Sign Hash</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleSimulateTamper(receipt.id, e)}
                          className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-950/80 border border-red-500/40 hover:border-red-400 text-red-300 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
                          title="Simulate unauthorized state modification to test tamper detection"
                        >
                          <Bug className="w-3 h-3 text-red-400" />
                          <span>Simulate Tamper</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDelete(receipt.id, e)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 transition cursor-pointer"
                        title="Delete receipt record"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Deck */}
        <footer className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLedger}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5"
              title="Download full tamper-evident ledger proof report"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Ledger Proof (JSON)</span>
            </button>

            <button
              onClick={handlePurgeAll}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-red-950/60 border border-slate-800 hover:border-red-500/40 text-slate-500 hover:text-red-300 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5"
              title="Reset ledger to genesis baseline"
            >
              <Trash2 className="w-3 h-3" />
              <span>Purge & Reseed</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-[11px] font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
