import React, { useState, useEffect } from 'react';
import { Mail, Send, RefreshCw, X, Inbox, CheckCircle2, AlertCircle, FileText, ArrowLeft } from 'lucide-react';
import { mailService, MailMessage, MailboxStatus } from '../services/mailService';

interface MailHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MailHubModal: React.FC<MailHubModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(null);
  const [status, setStatus] = useState<MailboxStatus | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [draft, setDraft] = useState({ to: 'machackabook@gmail.com', subject: '', body: '' });
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadMail = async () => {
    try {
      const s = await mailService.getStatus();
      setStatus(s);
      const list = await mailService.fetchMessages(undefined, searchQuery);
      setMessages(list);
    } catch (err) {
      console.warn('Mail loading error:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMail();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, searchQuery]);

  const handleSelectMessage = async (msg: MailMessage) => {
    setSelectedMessage(msg);
    await mailService.markAsRead(msg.id);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.to || !draft.subject) {
      setFeedback('Recipient email and subject are required');
      return;
    }
    setIsSending(true);
    setFeedback(null);
    try {
      const res = await mailService.sendEmail(draft);
      setFeedback(res.message);
      setDraft({ to: 'machackabook@gmail.com', subject: '', body: '' });
      setIsComposing(false);
      await loadMail();
    } catch (err: any) {
      setFeedback(`Error: ${err?.message || 'Transmission failed'}`);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[650px] bg-[#030914] border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden text-cyan-100 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/60 bg-[#061224]/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wide text-white">NEXUS GMAIL DISPATCH HUB</h2>
                <span className="px-2 py-0.5 text-xs rounded border border-emerald-500/40 bg-emerald-950/40 text-emerald-300">
                  {status?.provider || 'Gmail API'}
                </span>
              </div>
              <p className="text-xs text-cyan-400/80">Account: machackabook@gmail.com</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsComposing(!isComposing); setSelectedMessage(null); }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isComposing ? 'View Inbox' : 'Compose Dispatch'}
            </button>
            <button
              onClick={loadMail}
              title="Refresh Inbox"
              className="p-2 text-cyan-400 hover:text-white rounded-lg hover:bg-cyan-950 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-red-950/40 hover:text-red-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="px-6 py-2 bg-cyan-950/80 border-b border-cyan-700/40 text-xs flex items-center justify-between text-cyan-300">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-cyan-500 hover:text-white">✕</button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {isComposing ? (
            /* Composer View */
            <form onSubmit={handleSend} className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Dispatch New Secure Message
              </h3>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-cyan-300">Recipient (To):</label>
                <input
                  type="email"
                  value={draft.to}
                  onChange={e => setDraft({ ...draft, to: e.target.value })}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 text-sm bg-black/60 border border-cyan-800 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-cyan-300">Subject:</label>
                <input
                  type="text"
                  value={draft.subject}
                  onChange={e => setDraft({ ...draft, subject: e.target.value })}
                  placeholder="Subject line..."
                  className="w-full px-3 py-2 text-sm bg-black/60 border border-cyan-800 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs text-cyan-300">Message Body:</label>
                <textarea
                  value={draft.body}
                  onChange={e => setDraft({ ...draft, body: e.target.value })}
                  placeholder="Draft encrypted dispatch..."
                  rows={8}
                  className="w-full flex-1 px-3 py-2 text-sm bg-black/60 border border-cyan-800 rounded-lg text-white resize-none focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-cyan-900/60">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-4 py-2 text-xs rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSending ? 'Transmitting...' : 'Send Message'}
                </button>
              </div>
            </form>
          ) : selectedMessage ? (
            /* Message Detail View */
            <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-900/60">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-3 py-1 text-xs rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Inbox
                </button>
                <div className="flex items-center gap-2">
                  {selectedMessage.labels.map(l => (
                    <span key={l} className="px-2 py-0.5 text-[10px] rounded bg-cyan-900/50 border border-cyan-700/50 text-cyan-300">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{selectedMessage.subject}</h3>
                <div className="flex items-center justify-between text-xs text-cyan-400/80 mb-4 pb-3 border-b border-cyan-950">
                  <div>
                    <span className="text-zinc-400">From: </span>
                    <span className="text-cyan-200">{selectedMessage.from}</span>
                  </div>
                  <div>{new Date(selectedMessage.date).toLocaleString()}</div>
                </div>
                <div className="p-4 rounded-lg bg-black/40 border border-cyan-900/40 text-sm whitespace-pre-wrap text-cyan-100 leading-relaxed">
                  {selectedMessage.body}
                </div>
              </div>
            </div>
          ) : (
            /* Inbox List View */
            <div className="flex-1 flex flex-col">
              <div className="px-6 py-3 border-b border-cyan-900/60 flex items-center gap-4 bg-black/20">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search dispatches & messages..."
                  className="flex-1 px-3 py-1.5 text-xs bg-black/60 border border-cyan-900 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-xs text-cyan-400/80">
                  {messages.length} messages ({messages.filter(m => !m.isRead).length} unread)
                </span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-cyan-950/60">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-sm text-cyan-500/60 flex flex-col items-center gap-2">
                    <Inbox className="w-8 h-8 text-cyan-600" />
                    No messages in mailbox.
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      onClick={() => handleSelectMessage(msg)}
                      className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                        msg.isRead ? 'bg-transparent hover:bg-cyan-950/30' : 'bg-cyan-950/40 hover:bg-cyan-900/40 border-l-2 border-cyan-400'
                      }`}
                    >
                      <div className="flex-1 pr-4 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs ${msg.isRead ? 'text-zinc-400' : 'text-cyan-200 font-semibold'}`}>
                            {msg.from}
                          </span>
                          {!msg.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                          )}
                        </div>
                        <div className={`text-sm truncate ${msg.isRead ? 'text-zinc-300' : 'text-white font-medium'}`}>
                          {msg.subject}
                        </div>
                        <div className="text-xs text-zinc-500 truncate mt-0.5">{msg.snippet}</div>
                      </div>
                      <div className="text-[11px] text-zinc-500 whitespace-nowrap">
                        {new Date(msg.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cyan-900/60 bg-[#061224]/80 flex items-center justify-between text-xs text-cyan-400/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Recipient: machackabook@gmail.com</span>
          </div>
          <span>Cryptic News Nexus Mail v6.0.0</span>
        </div>
      </div>
    </div>
  );
};
