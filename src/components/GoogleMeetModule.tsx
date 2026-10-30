import React, { useState, useEffect, useRef } from 'react';
import { EnvironmentState } from '../types';
import { meetingSummaryService, MeetingExecutiveSummary } from '../services/meetingSummaryService';
import {
  Video,
  X,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle,
  FileText,
  Activity,
  Send,
  ExternalLink,
  Users,
  Compass,
} from 'lucide-react';

export interface GoogleMeetModuleProps {
  onClose: () => void;
  envState: EnvironmentState;
  setEnvState: React.Dispatch<React.SetStateAction<EnvironmentState>>;
}

export const GoogleMeetModule: React.FC<GoogleMeetModuleProps> = ({
  onClose,
  envState,
  setEnvState,
}) => {
  const [meetingLink, setMeetingLink] = useState('');
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('Executive Architecture & Polyglot Sync');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<MeetingExecutiveSummary | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isMeetingActive) {
      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMeetingActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const createMeeting = async () => {
    const newLink = 'https://meet.google.com/new';
    setMeetingLink(newLink);
    setIsMeetingActive(true);
    setDurationSeconds(0);
    setSummary(null);
    setStatusMessage('Session online. Ambient presence modulated to "in-session".');

    // Capture geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setEnvState((prev) => ({
            ...prev,
            sentiment: 'in-session',
            geolocation: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            },
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          setEnvState((prev) => ({ ...prev, sentiment: 'in-session' }));
        }
      );
    } else {
      setEnvState((prev) => ({ ...prev, sentiment: 'in-session' }));
    }
  };

  const concludeMeetingAndSummarize = async () => {
    setIsMeetingActive(false);
    setIsSummarizing(true);
    setStatusMessage('Generating Gemini executive summary & syncing to Resonance Console...');

    try {
      const result = await meetingSummaryService.generateSummary({
        meetingId: `meet-${Date.now().toString(36)}`,
        title: meetingTitle,
        durationSeconds: Math.max(5, durationSeconds),
        notes: meetingNotes,
        participants: ['Operator (You)', 'Executive AI Mesh'],
        geolocation: envState.geolocation || null,
        environmentSnapshot: {
          sentiment: envState.sentiment,
          topology: envState.topology,
          harmonicResonance: envState.harmonicResonance,
        },
      });

      setSummary(result);
      setStatusMessage(`Executive summary compiled (${result.source}) and logged to Resonance Console.`);
    } catch (err: any) {
      console.error('Failed to conclude and summarize meeting:', err);
      setStatusMessage('Summary generation fallback complete.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleOpenResonanceConsole = () => {
    window.dispatchEvent(new CustomEvent('gaia:open-resonance'));
  };

  return (
    <div className="fixed top-14 right-4 z-[110] w-[420px] max-w-[95vw] bg-slate-950/95 border border-cyan-500/50 rounded-2xl shadow-[0_20px_60px_rgba(0,242,255,0.25)] text-slate-200 font-mono text-xs overflow-hidden backdrop-blur-xl animate-in fade-in duration-200 flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-black/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white tracking-wide flex items-center gap-2">
              GOOGLE MEET
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-normal border border-blue-400/30">
                OAUTH READY
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">Executive Presence & Gemini Synthesis</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close Google Meet panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3.5 overflow-y-auto scrollbar-thin">
        {/* Presence Status Banner */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isMeetingActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            <span className="font-semibold text-slate-300">
              PRESENCE:{' '}
              <span className={isMeetingActive ? 'text-emerald-400' : 'text-slate-400'}>
                {isMeetingActive ? 'IN-SESSION (ACTIVE)' : 'STANDBY'}
              </span>
            </span>
          </div>

          {isMeetingActive && (
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDuration(durationSeconds)}</span>
            </div>
          )}
        </div>

        {/* Telemetry & Geolocation Pill */}
        {envState.geolocation && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-950/30 border border-blue-500/20 text-[10px] text-blue-300">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">
              Geo: {envState.geolocation.latitude.toFixed(4)}°, {envState.geolocation.longitude.toFixed(4)}° (±{envState.geolocation.accuracy}m)
            </span>
          </div>
        )}

        {/* Meeting Controls */}
        {!isMeetingActive ? (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Meeting Title
              </label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                placeholder="Enter session objective..."
              />
            </div>

            <button
              onClick={createMeeting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,149,255,0.3)] transition"
            >
              <Video className="w-4 h-4" />
              <span>Host New Google Meet Session</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white truncate">{meetingTitle}</span>
                <a
                  href={meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 text-[11px] transition shrink-0"
                >
                  <span>Join Room</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[10px] text-slate-400 break-all">{meetingLink}</p>
            </div>

            {/* In-Session Notes / Live Dictation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                  <FileText className="w-3 h-3 text-cyan-400" />
                  <span>Session Notes & Transcript Excerpts</span>
                </label>
                <span className="text-[9px] text-slate-500">Gemini analyzes this text</span>
              </div>
              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Type decisions, discussion points, or paste transcript excerpts to summarize..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs resize-none"
              />
            </div>

            {/* Conclude & Generate Gemini Summary Button */}
            <button
              onClick={concludeMeetingAndSummarize}
              disabled={isSummarizing}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Conclude Meeting & Generate Gemini Summary</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {isSummarizing && (
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center gap-3 animate-pulse">
            <Sparkles className="w-5 h-5 text-cyan-300 animate-spin" />
            <div>
              <p className="font-semibold text-cyan-200">Gemini 3.8 Flash Synthesizing Summary...</p>
              <p className="text-[10px] text-cyan-400">Extracting decisions, deliverables, and resonance harmonic.</p>
            </div>
          </div>
        )}

        {/* Executive Summary Card */}
        {summary && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2.5 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">EXECUTIVE SUMMARY</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {summary.resonanceFrequencyHz} Hz HARMONIC
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed text-[11px]">{summary.executiveSummary}</p>

            {/* Decisions */}
            {summary.keyDecisions && summary.keyDecisions.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  Key Decisions:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[10px]">
                  {summary.keyDecisions.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {summary.actionItems && summary.actionItems.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Action Items:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[10px]">
                  {summary.actionItems.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Receipt & Resonance Link */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
              <span className="text-slate-500 truncate max-w-[190px]">
                Digest: {summary.receiptDigest}
              </span>
              <button
                onClick={handleOpenResonanceConsole}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1"
              >
                <span>View in Resonance Lab</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Live Status Message */}
        {statusMessage && (
          <p className="text-[10px] text-slate-400 text-center italic">{statusMessage}</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-black/60 flex items-center justify-between text-[10px] text-slate-400">
        <span className="text-cyan-400 font-bold">SOVEREIGN WORKSPACE TELEMETRY</span>
        <button
          onClick={handleOpenResonanceConsole}
          className="text-slate-400 hover:text-white transition flex items-center gap-1"
        >
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>Resonance Console</span>
        </button>
      </div>
    </div>
  );
};
