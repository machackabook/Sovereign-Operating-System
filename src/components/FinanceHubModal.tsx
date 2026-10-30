import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, QrCode, CheckCircle2, ShieldCheck, ArrowRight, X, ExternalLink, Receipt, Sparkles } from 'lucide-react';
import { financeService, FINANCE_CATALOG, PaymentItem, TransactionReceipt } from '../services/financeService';

interface FinanceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FinanceHubModal: React.FC<FinanceHubModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'GPAY' | 'STRIPE' | 'CASHAPP' | 'RECEIPTS'>('GPAY');
  const [selectedPlan, setSelectedPlan] = useState<PaymentItem>(FINANCE_CATALOG[0]);
  const [receipts, setReceipts] = useState<TransactionReceipt[]>([]);
  const [processing, setProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<TransactionReceipt | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Stripe form fields
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('•••');

  useEffect(() => {
    if (isOpen) {
      setReceipts(financeService.getReceipts());
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleGooglePay = async () => {
    setProcessing(true);
    setFeedback(null);
    try {
      const receipt = await financeService.processGooglePayment(selectedPlan);
      setLastReceipt(receipt);
      setReceipts(financeService.getReceipts());
      setFeedback(`Google Pay approved! Receipt #${receipt.transactionId.slice(0, 12)}`);
      setActiveTab('RECEIPTS');
    } catch (err: any) {
      setFeedback(`Payment error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleStripePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setFeedback(null);
    try {
      const intent = await financeService.createStripePaymentIntent(selectedPlan);
      const receipt = await financeService.finalizeStripePayment(selectedPlan, intent.clientSecret);
      setLastReceipt(receipt);
      setReceipts(financeService.getReceipts());
      setFeedback(`Stripe charge confirmed! Intent #${intent.clientSecret.slice(0, 14)}`);
      setActiveTab('RECEIPTS');
    } catch (err: any) {
      setFeedback(`Stripe error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCashAppConfirm = async () => {
    setProcessing(true);
    try {
      const receipt = await financeService.recordCashAppPayment(selectedPlan, 'Manual Cashtag Settlement');
      setLastReceipt(receipt);
      setReceipts(financeService.getReceipts());
      setFeedback(`Cash App payment confirmed for ${financeService.cashAppTag}!`);
      setActiveTab('RECEIPTS');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  const cashAppDetails = financeService.getCashAppPaymentDetails(selectedPlan);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[700px] bg-[#050b14] border border-emerald-500/40 rounded-xl shadow-[0_0_60px_rgba(16,185,129,0.25)] flex flex-col overflow-hidden text-emerald-100 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-900/60 bg-[#081824]/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wide text-white">NEXUS MULTI-PAYMENT TERMINAL</h2>
                <span className="px-2 py-0.5 text-xs rounded border border-cyan-500/40 bg-cyan-950/40 text-cyan-300">
                  TDOC-12000 FINANCE
                </span>
              </div>
              <p className="text-xs text-emerald-400/80">Recipient: machackabook@gmail.com • Cashtag: $MachackaBook</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-red-950/40 hover:text-red-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-emerald-900/50 bg-black/40 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('GPAY')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'GPAY'
                ? 'bg-emerald-950/80 text-emerald-300 border-t border-l border-r border-emerald-500/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Google Pay
          </button>
          <button
            onClick={() => setActiveTab('STRIPE')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'STRIPE'
                ? 'bg-emerald-950/80 text-emerald-300 border-t border-l border-r border-emerald-500/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
            Stripe Elements
          </button>
          <button
            onClick={() => setActiveTab('CASHAPP')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'CASHAPP'
                ? 'bg-emerald-950/80 text-emerald-300 border-t border-l border-r border-emerald-500/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            Cash App Pay ($MachackaBook)
          </button>
          <button
            onClick={() => setActiveTab('RECEIPTS')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'RECEIPTS'
                ? 'bg-emerald-950/80 text-emerald-300 border-t border-l border-r border-emerald-500/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            Receipts Ledger ({receipts.length})
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-700/40 text-xs flex items-center justify-between text-emerald-300">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {feedback}
            </span>
            <button onClick={() => setFeedback(null)} className="text-emerald-500 hover:text-white">✕</button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab !== 'RECEIPTS' && (
            <div className="mb-6">
              <div className="text-xs uppercase tracking-wider text-emerald-400/80 font-bold mb-3">
                Select Package / Contribution Tier:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {FINANCE_CATALOG.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      selectedPlan.id === plan.id
                        ? 'border-emerald-400 bg-emerald-950/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'border-emerald-900/40 bg-black/40 hover:border-emerald-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                      <span className="text-sm font-bold text-emerald-400">
                        ${(plan.amount / 100).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">{plan.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 1: GOOGLE PAY */}
          {activeTab === 'GPAY' && (
            <div className="flex flex-col items-center justify-center p-8 bg-black/40 border border-emerald-900/40 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 border border-white/20">
                <span className="text-2xl font-bold tracking-tight text-white">G<span className="text-cyan-400">Pay</span></span>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Instant Google Pay Authorization</h3>
              <p className="text-xs text-zinc-400 max-w-md text-center mb-6">
                Direct integration with Google Pay API v2 tokenized via Stripe Gateway.
                Funds route directly to merchant operative account: <span className="text-emerald-300">machackabook@gmail.com</span>.
              </p>

              <div className="w-full max-w-sm p-4 rounded-lg bg-black/60 border border-emerald-800/50 mb-6 text-xs flex justify-between items-center">
                <span className="text-zinc-400">Total Settlement:</span>
                <span className="text-base font-bold text-white">${(selectedPlan.amount / 100).toFixed(2)} USD</span>
              </div>

              <button
                onClick={handleGooglePay}
                disabled={processing}
                className="w-full max-w-sm py-3.5 rounded-xl bg-black hover:bg-zinc-900 border-2 border-white/80 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all disabled:opacity-50"
              >
                <span className="text-sm font-bold">Buy with</span>
                <span className="text-lg font-black text-cyan-400 tracking-tight">GPay</span>
              </button>
            </div>
          )}

          {/* TAB 2: STRIPE */}
          {activeTab === 'STRIPE' && (
            <div className="p-6 bg-black/40 border border-emerald-900/40 rounded-xl max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-emerald-900/60">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Stripe Custom Card Element</h3>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">pk_live_...Key001</span>
              </div>

              <form onSubmit={handleStripePay} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-400">Card Number:</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    className="px-3 py-2 text-sm bg-black/80 border border-emerald-900 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-400">Expires:</label>
                    <input
                      type="text"
                      value={cardExp}
                      onChange={e => setCardExp(e.target.value)}
                      className="px-3 py-2 text-sm bg-black/80 border border-emerald-900 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-400">CVC:</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value)}
                      className="px-3 py-2 text-sm bg-black/80 border border-emerald-900 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs flex justify-between items-center mt-2">
                  <span className="text-zinc-400">Recipient Account:</span>
                  <span className="text-emerald-300 font-semibold">machackabook@gmail.com</span>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="mt-2 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {processing ? 'Confirming with Stripe...' : `Pay $${(selectedPlan.amount / 100).toFixed(2)} USD via Stripe`}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: CASH APP */}
          {activeTab === 'CASHAPP' && (
            <div className="p-6 bg-black/40 border border-emerald-900/40 rounded-xl max-w-lg mx-auto flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-black font-black text-2xl mb-3 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                $
              </div>
              <h3 className="text-base font-bold text-white mb-0.5">Cash App Pay Integration</h3>
              <div className="text-sm font-bold text-emerald-400 mb-4">{cashAppDetails.cashtag}</div>

              {/* QR Code Simulation Canvas */}
              <div className="p-4 bg-white rounded-xl shadow-lg mb-4 flex flex-col items-center">
                <div className="w-44 h-44 border-4 border-black p-2 flex flex-col justify-between items-center bg-white">
                  <div className="w-full flex justify-between">
                    <div className="w-10 h-10 bg-black flex items-center justify-center"><div className="w-4 h-4 bg-white" /></div>
                    <div className="w-10 h-10 bg-black flex items-center justify-center"><div className="w-4 h-4 bg-white" /></div>
                  </div>
                  <div className="text-black font-black text-xs text-center">
                    CASH APP<br />$MachackaBook<br />${cashAppDetails.amount}
                  </div>
                  <div className="w-full flex justify-between">
                    <div className="w-10 h-10 bg-black flex items-center justify-center"><div className="w-4 h-4 bg-white" /></div>
                    <div className="w-4 h-4 bg-emerald-500" />
                  </div>
                </div>
                <div className="text-[10px] text-zinc-600 font-mono mt-2">Scan with camera or Cash App</div>
              </div>

              <div className="flex gap-3 w-full mb-3">
                <a
                  href={cashAppDetails.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Cash App Web
                </a>
                <button
                  onClick={handleCashAppConfirm}
                  disabled={processing}
                  className="flex-1 py-2.5 rounded-lg border border-emerald-500/50 hover:bg-emerald-950 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Log Cash App Settlement
                </button>
              </div>

              <div className="text-[11px] text-zinc-400 text-center">
                Recipient email: <span className="text-white">machackabook@gmail.com</span>
              </div>
            </div>
          )}

          {/* TAB 4: RECEIPTS LEDGER */}
          {activeTab === 'RECEIPTS' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
                <h3 className="text-xs uppercase font-bold text-emerald-400">Cryptographically Signed Receipts</h3>
                <span className="text-xs text-zinc-400">{receipts.length} total settled transactions</span>
              </div>
              <div className="divide-y divide-emerald-950/60">
                {receipts.map(r => (
                  <div key={r.transactionId} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{r.referenceNote}</span>
                        <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-950 border border-emerald-600/40 text-emerald-300 font-semibold">
                          {r.paymentMethod}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        ID: {r.transactionId} • Recipient: {r.recipient}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Sig: {r.receiptSignature}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-emerald-400">
                        +${r.amount.toFixed(2)} {r.currency}
                      </div>
                      <div className="text-[11px] text-zinc-500">{new Date(r.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-emerald-900/60 bg-[#081824]/90 flex items-center justify-between text-xs text-emerald-400/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Settlement Gateway: ONLINE</span>
          </div>
          <span>Google Pay • Stripe • Cash App ($MachackaBook)</span>
        </div>
      </div>
    </div>
  );
};
