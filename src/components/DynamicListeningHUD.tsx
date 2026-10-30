import React, { useState, useEffect } from 'react';
import {
  dynamicListeningService,
  DynamicListeningState,
  TV_GUIDE_CATALOG,
} from '../services/dynamicListeningService';
import { tvGuideService, TvGuideShowMetadata } from '../services/tvGuideService';
import {
  Radio,
  Tv,
  Film,
  Users,
  Award,
  Zap,
  Volume2,
  RefreshCw,
  X,
  Activity,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  ChevronRight,
  Maximize2,
  Search,
  Star,
  Calendar,
  Info,
  Loader2,
  Sliders,
  AudioWaveform,
} from 'lucide-react';
import { EnvironmentState } from '../types';
import { VisualSpectrumAnalyzer } from './VisualSpectrumAnalyzer';

export interface DynamicListeningHUDProps {
  isOpen: boolean;
  onClose: () => void;
  envState?: EnvironmentState;
  setEnvState?: React.Dispatch<React.SetStateAction<EnvironmentState>>;
}

export const DynamicListeningHUD: React.FC<DynamicListeningHUDProps> = ({
  isOpen,
  onClose,
  envState,
  setEnvState,
}) => {
  const [state, setState] = useState<DynamicListeningState>(dynamicListeningService.getState());
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);
  const [customPhrase, setCustomPhrase] = useState('');
  const [activeTab, setActiveTab] = useState<'SHAZAM_GAME' | 'TV_GUIDE' | 'ACOUSTIC_TELEMETRY'>('SHAZAM_GAME');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showMetadata, setShowMetadata] = useState<TvGuideShowMetadata | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const bloomIntensity = envState?.bloomIntensity ?? 1.2;
  const audioReactiveLevel = envState?.audioReactiveLevel ?? 1.0;

  const handleUpdateBloom = (newBloom: number) => {
    if (setEnvState) {
      setEnvState((prev) => ({ ...prev, bloomIntensity: newBloom }));
    }
  };

  const handleUpdateAudioReactive = (newLevel: number) => {
    if (setEnvState) {
      setEnvState((prev) => ({ ...prev, audioReactiveLevel: newLevel }));
    }
  };

  useEffect(() => {
    if (state.detectedTitle && state.detectedTitle !== 'Ambient Environment') {
      setSearchQuery(state.detectedTitle);
    }
  }, [state.detectedTitle]);

  const handleSearchShow = async (overrideQuery?: string) => {
    const rawTarget = overrideQuery !== undefined ? overrideQuery : searchQuery;
    const cleanTarget = (rawTarget || '').trim() || (state.detectedTitle !== 'Ambient Environment' ? state.detectedTitle : '');
    if (!cleanTarget) {
      setSearchError('Please provide a show or movie title to query the TV Guide API.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const data = await tvGuideService.searchShow(cleanTarget);
      setShowMetadata(data);
    } catch (err: any) {
      setSearchError(err?.message || 'Failed to retrieve TV Guide metadata');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchIdentifiedShow = () => {
    const target = state.detectedTitle && state.detectedTitle !== 'Ambient Environment'
      ? state.detectedTitle
      : (state.matchedProgram?.title || 'The Matrix');
    setSearchQuery(target);
    setActiveTab('TV_GUIDE');
    handleSearchShow(target);
  };

  useEffect(() => {
    const unsub = dynamicListeningService.subscribe((s) => {
      setState(s);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleToggleListening = () => {
    if (state.isListening) {
      dynamicListeningService.stopListening();
    } else {
      dynamicListeningService.startListening(true);
    }
  };

  const handleOptionSelect = (idx: number) => {
    setSelectedOption(idx);
    const res = dynamicListeningService.submitTriviaAnswer(idx);
    setFeedback(res);
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setFeedback(null);
    dynamicListeningService.nextChallenge();
  };

  const handleInjectPhrase = (phrase: string) => {
    dynamicListeningService.setManualTranscription(phrase);
  };

  const getClassificationIcon = () => {
    switch (state.classification) {
      case 'MOVIE':
        return <Film className="w-4 h-4 text-purple-400" />;
      case 'TELEVISION':
        return <Tv className="w-4 h-4 text-cyan-400" />;
      case 'CONVERSATION':
      default:
        return <Users className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getClassificationBadgeClass = () => {
    switch (state.classification) {
      case 'MOVIE':
        return 'bg-purple-950/70 border-purple-500/50 text-purple-300';
      case 'TELEVISION':
        return 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300';
      case 'CONVERSATION':
      default:
        return 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300';
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Dynamic Listening System Profile & Acoustic Shazam Trivia Game"
      aria-modal="true"
      className="fixed inset-0 z-[125] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 font-mono text-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_25px_80px_rgba(0,242,255,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Deck */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/30 bg-black/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Radio className={`w-5 h-5 ${state.isListening ? 'animate-pulse text-cyan-300' : 'text-slate-500'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white tracking-wide">
                  DYNAMIC ACOUSTIC LISTENER
                </h2>
                <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                  SHAZAM RUNTIME GAME
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Environment Dictation · TV Guide Sync · Acoustic Fingerprinting · Telemetry Trivia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleListening}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px] ${
                state.isListening
                  ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/40'
                  : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  state.isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                }`}
              />
              <span>{state.isListening ? 'LISTENING (LIVE)' : 'START LISTENING'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Nav Tabs */}
        <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-800/80 bg-slate-900/40 text-[11px]">
          <button
            onClick={() => setActiveTab('SHAZAM_GAME')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'SHAZAM_GAME'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Shazam Trivia Game</span>
          </button>
          <button
            onClick={() => setActiveTab('TV_GUIDE')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'TV_GUIDE'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TV Guide & Media Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab('ACOUSTIC_TELEMETRY')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'ACOUSTIC_TELEMETRY'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Acoustic FFT Telemetry</span>
          </button>

          <div className="ml-auto flex items-center gap-2 text-[10px] text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>SCORE: {state.triviaScore}</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400">STREAK: {state.currentStreak} 🔥</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 scrollbar-thin">
          {/* Main Classification & Detection Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 text-xs ${getClassificationBadgeClass()}`}>
                  {getClassificationIcon()}
                  <span>{state.classification} DETECTED</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded bg-black/40 border border-slate-800">
                  {Math.round(state.confidence * 100)}% CONFIDENCE
                </span>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <span>CHANNEL / SOURCE:</span>
                <span className="font-bold text-cyan-300">{state.activeChannel}</span>
              </div>
            </div>

            {/* Identified Media Title & Quick TV Guide Lookup */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Identified Media / Stream:</p>
                <h3 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                  <span>{state.detectedTitle}</span>
                  {state.matchedProgram && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-normal border border-purple-500/30">
                      {state.matchedProgram.category}
                    </span>
                  )}
                </h3>
              </div>

              <button
                onClick={handleSearchIdentifiedShow}
                disabled={isSearching}
                className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-200 font-bold flex items-center gap-1.5 text-xs transition shadow-sm"
                title="Search TV Guide API for metadata, cast, episode title, and summary"
              >
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-cyan-300" />
                )}
                <span>Lookup TV Guide Metadata</span>
              </button>
            </div>

            {/* Acoustic Dynamics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[10px]">
              <div className="p-2 rounded-lg bg-black/40 border border-slate-800">
                <span className="text-slate-500 block">LOUDNESS (RMS)</span>
                <span className="font-bold text-cyan-300 text-xs">{state.features.decibelsDb} dB</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-slate-800">
                <span className="text-slate-500 block">HARMONIC BAND</span>
                <span className="font-bold text-emerald-400 text-xs">{state.features.harmonicBand}</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-slate-800">
                <span className="text-slate-500 block">DYNAMIC RANGE</span>
                <span className="font-bold text-amber-300 text-xs">{state.features.dynamicRange}</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-slate-800">
                <span className="text-slate-500 block">DOMINANT FREQ</span>
                <span className="font-bold text-purple-300 text-xs">{state.features.dominantFrequencyHz} Hz</span>
              </div>
            </div>

            {/* Visual Spectrum Analyzer (Pulses with audio intensity, synced with global bloom & audio-reactive level) */}
            <div className="pt-2">
              <VisualSpectrumAnalyzer
                bloomIntensity={bloomIntensity}
                audioReactiveLevel={audioReactiveLevel}
                isListening={state.isListening}
                onUpdateBloom={handleUpdateBloom}
                onUpdateAudioReactive={handleUpdateAudioReactive}
              />
            </div>

            {/* Transcription Snippet */}
            <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800/80 text-[11px]">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                Acoustic Dictation & Transcription Buffer:
              </span>
              <p className="text-slate-300 italic">{state.transcriptionSnippet}</p>
            </div>
          </div>

          {/* TAB 1: SHAZAM TRIVIA GAME */}
          {activeTab === 'SHAZAM_GAME' && (
            <div className="space-y-4">
              {/* Interactive Trivia Challenge */}
              {state.currentChallenge && (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-white uppercase tracking-wider">
                        Acoustic Trivia Challenge ({state.currentChallenge.category})
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      +{state.currentChallenge.points} POINTS
                    </span>
                  </div>

                  <p className="font-bold text-white text-sm leading-snug">
                    {state.currentChallenge.question}
                  </p>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {state.currentChallenge.options.map((opt, idx) => {
                      let btnStyle = 'bg-slate-950 border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:bg-slate-900';
                      if (selectedOption !== null) {
                        if (idx === state.currentChallenge?.correctIndex) {
                          btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                        } else if (idx === selectedOption) {
                          btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold';
                        } else {
                          btnStyle = 'bg-slate-950/50 border-slate-900 text-slate-600';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => selectedOption === null && handleOptionSelect(idx)}
                          disabled={selectedOption !== null}
                          className={`p-3 rounded-xl border text-left transition flex items-center justify-between text-xs ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {selectedOption !== null && idx === state.currentChallenge?.correctIndex && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback on Answer */}
                  {feedback && (
                    <div
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 animate-in fade-in duration-200 ${
                        feedback.isCorrect
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                          : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {feedback.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold text-xs">
                            {feedback.isCorrect ? 'Correct Answer!' : 'Incorrect.'}
                          </p>
                          <p className="text-[11px] text-slate-300 mt-0.5">{feedback.explanation}</p>
                        </div>
                      </div>

                      <button
                        onClick={handleNextQuestion}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1 shrink-0 text-[11px] transition"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Verified Trivia Feed for Active Stream */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white uppercase tracking-wider">
                      Verified Media & Telemetry Trivia
                    </span>
                  </div>
                  <button
                    onClick={() => dynamicListeningService.sampleAndClassify()}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Re-Sample</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {state.randomTrivia.map((trivia, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-black/40 border border-slate-800/60 flex items-start gap-2.5"
                    >
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{trivia}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dictation Simulation / Test Buttons */}
              <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Quick Acoustic Dictation Triggers (Simulate Environment Audio):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleInjectPhrase('What is the Matrix? Take the red pill or blue pill.')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
                  >
                    🎬 "What is the Matrix?"
                  </button>
                  <button
                    onClick={() => handleInjectPhrase('Cells. Within cells interlinked. What is your baseline?')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
                  >
                    🎬 "Within cells interlinked"
                  </button>
                  <button
                    onClick={() => handleInjectPhrase('Open the pod bay doors, HAL. I am afraid I cannot do that, Dave.')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
                  >
                    🎬 "Open pod bay doors, HAL"
                  </button>
                  <button
                    onClick={() => handleInjectPhrase('We are made of starstuff. Billions and billions of stars in the cosmic ocean.')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
                  >
                    📺 "Cosmos / Starstuff"
                  </button>
                  <button
                    onClick={() => handleInjectPhrase('Good morning team, let us review the sprint tickets and architecture decisions.')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
                  >
                    🗣️ "Sprint Architecture Review"
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TV GUIDE & MEDIA CATALOG */}
          {activeTab === 'TV_GUIDE' && (
            <div className="space-y-4">
              {/* TV Guide Search Engine Box */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white uppercase tracking-wider text-xs">
                      TV Guide API Search Engine
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>Target:</span>
                    <span className="font-bold text-cyan-300">TVMaze API & Acoustic Metadata</span>
                  </div>
                </div>

                {/* Search Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchShow();
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search show (e.g. Westworld, The Matrix, Blade Runner 2049, Interstellar)..."
                      className="w-full bg-black/60 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0"
                    >
                      {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>{isSearching ? 'Searching...' : 'Search'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSearchIdentifiedShow}
                      disabled={isSearching}
                      className="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0"
                      title="Fetch TV Guide metadata for the currently identified acoustic show"
                    >
                      <span>Query Identified Show</span>
                    </button>
                  </div>
                </form>

                {searchError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{searchError}</span>
                  </div>
                )}
              </div>

              {/* Show Metadata Dossier (Cast, Episode Title, Summary) */}
              {showMetadata && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-950 to-purple-950/30 border border-cyan-500/40 space-y-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in fade-in duration-300">
                  {/* Show Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-white tracking-wide">
                          {showMetadata.title}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                          {showMetadata.network}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                          {showMetadata.status}
                        </span>
                        {showMetadata.rating && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{showMetadata.rating}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {showMetadata.genres.map((g, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
                            {g}
                          </span>
                        ))}
                        {showMetadata.premiered && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>Premiered: {showMetadata.premiered}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] px-2.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-500/40 uppercase tracking-wider block">
                        Source: {showMetadata.source}
                      </span>
                    </div>
                  </div>

                  {/* Show Summary */}
                  <div className="p-3 rounded-xl bg-black/50 border border-slate-800 space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      <span>Show Summary & Overview</span>
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {showMetadata.summary}
                    </p>
                  </div>

                  {/* Episode Title & Synopsis */}
                  {showMetadata.currentEpisode && (
                    <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-1.5">
                        <span className="text-[10px] uppercase font-bold text-purple-300 flex items-center gap-1.5">
                          <Tv className="w-3.5 h-3.5 text-purple-400" />
                          <span>Featured / Airing Episode Details</span>
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-purple-300 font-semibold">
                          {showMetadata.currentEpisode.season && (
                            <span className="px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/30">
                              Season {showMetadata.currentEpisode.season} · Episode {showMetadata.currentEpisode.episode || 1}
                            </span>
                          )}
                          {showMetadata.currentEpisode.airdate && (
                            <span className="text-slate-400">
                              Airdate: {showMetadata.currentEpisode.airdate}
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white tracking-wide">
                        {showMetadata.currentEpisode.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {showMetadata.currentEpisode.summary}
                      </p>
                    </div>
                  )}

                  {/* Cast & Characters */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>Starring Cast & Characters ({showMetadata.cast.length})</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {showMetadata.cast.map((member, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 flex items-center gap-2.5 transition"
                        >
                          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-300 text-xs shrink-0">
                            {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate" title={member.name}>
                              {member.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate" title={member.character}>
                              as {member.character}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Broadcast Schedule & Media Catalog */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">
                    Active TV Guide schedule used for dynamic acoustic pattern matching:
                  </p>
                  <span className="text-[10px] text-cyan-400 font-semibold">
                    {TV_GUIDE_CATALOG.length} Programs Monitored
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TV_GUIDE_CATALOG.map((prog, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition ${
                        state.matchedProgram?.title === prog.title
                          ? 'bg-purple-950/30 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-cyan-400">
                          CH {prog.channelNumber} · {prog.channelName}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                          {prog.category}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-sm">{prog.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Dir: {prog.directorOrCreator} ({prog.year})</p>
                      <p className="text-[11px] text-slate-300 mt-2 line-clamp-2">{prog.synopsis}</p>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <button
                          onClick={() => handleInjectPhrase(prog.acousticKeywords.slice(0, 3).join(' '))}
                          className="text-[10px] text-cyan-400 hover:underline font-bold"
                        >
                          Simulate Match →
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSearchQuery(prog.title);
                              handleSearchShow(prog.title);
                            }}
                            className="text-[10px] text-purple-400 hover:underline font-bold"
                          >
                            Lookup Metadata →
                          </button>
                          <span className="text-[9px] text-slate-500">
                            {prog.triviaBank.length} Facts
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACOUSTIC TELEMETRY */}
          {activeTab === 'ACOUSTIC_TELEMETRY' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-sm">ENVIRONMENTAL SENSOR & DEVICE CUES</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-black/40 border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Connected Telemetry Devices</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                      {state.connectedDevices.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Account Persona & Auth Profile</span>
                    <p className="text-slate-300 font-bold">{state.accountContext}</p>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block mt-2">Active TV Guide Stream</span>
                    <p className="text-cyan-300">{state.activeChannel}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-sm">ACOUSTIC SPECTRAL PROFILES</h4>
                <div className="space-y-2 text-[11px] text-slate-300">
                  <p>
                    • <strong className="text-purple-300">Cinema / Movie Profile:</strong> Dynamic range exceeding 35 dB, multi-octave orchestral scoring, high crest factor, low dialogue pause density.
                  </p>
                  <p>
                    • <strong className="text-cyan-300">Television Profile:</strong> Normalized -24 LKFS broadcast bed, characteristic background laugh tracks or news jingles, high compression.
                  </p>
                  <p>
                    • <strong className="text-emerald-300">Human Conversation:</strong> Formants F1 (500Hz) & F2 (1500Hz), regular pause intervals (400–750ms), conversational volume ~60 dB SPL.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-black/60 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>REAL-TIME ACOUSTIC OSMOSIS ENGINE</span>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('gaia:open-resonance'))}
            className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1"
          >
            <span>Open Resonance Console</span>
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
