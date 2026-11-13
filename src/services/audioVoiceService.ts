/**
 * AudioVoiceService - Device-native speech synthesis and recognition, microphone
 * input, accessible earcons, and optional ambient audio. TTS audio is never
 * duplicated by a synthetic carrier oscillator.
 */

export interface MicrophoneAudioData {
  volume: number;
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  isSpeaking: boolean;
}

export interface VoiceAudioData {
  volume: number;
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  isSpeaking: boolean;
  activeText: string;
  activeWord: string;
  wordIndex: number;
  totalWords: number;
  profile: string;
  carrierFreq: number;
  sentiment?: string;
  tone?: string;
}

export type DialogueTurnState =
  | 'idle'
  | 'user_speaking'
  | 'ai_thinking'
  | 'ai_speaking'
  | 'listening_for_user';

export interface VoiceProfileConfig {
  id: string;
  name: string;
  role?: string;
  pitch: number;
  rate: number;
  carrierFreq: number;
  description: string;
  conversationalStyle?: string;
  preferredVoiceKeywords?: string[];
  samplePhrase?: string;
  style: string;
  oscillatorType?: OscillatorType;
}

export type VoiceProfile = VoiceProfileConfig;

export type WakeWordState = 'passive' | 'active';

export interface WakeWordParseResult {
  hasWakeWord: boolean;
  wakeWord?: string;
  remainder: string;
  isStandaloneWake: boolean;
}

/**
 * Lightweight Wake-Word Parser:
 * Detects wake words ('gemini', 'terminal', 'nexus', 'computer', 'nova')
 * and extracts the downstream command or directive.
 */
export function parseWakeWord(text: string): WakeWordParseResult {
  const clean = text.trim();
  if (!clean) {
    return { hasWakeWord: false, remainder: '', isStandaloneWake: false };
  }

  // Regex matching wake words at start or embedded
  // Supports: "Gemini", "Hey Gemini", "Terminal", "Hey Terminal", "Nexus", "Computer", "Nova"
  const regex = /^(?:.*?\b)?(?:hey\s+)?(gemini|terminal|nexus|computer|nova)\b[\s,:;—\-]*(.*)$/i;
  const match = clean.match(regex);

  if (match) {
    const matchedWord = match[1].toLowerCase();
    const rest = (match[2] || '').trim().replace(/^[,:;—\-]+/, '').trim();
    return {
      hasWakeWord: true,
      wakeWord: matchedWord,
      remainder: rest,
      isStandaloneWake: rest.length === 0,
    };
  }

  return {
    hasWakeWord: false,
    remainder: clean,
    isStandaloneWake: false,
  };
}


export class AudioVoiceService {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private solfeggioOsc: OscillatorNode | null = null;
  private solfeggioGain: GainNode | null = null;
  private frequencyData: Uint8Array | null = null;
  private is963Active = false;
  private isVoiceEnabled = true;
  private pitch = 1.0;
  private rate = 1.0;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private speechListeners: ((speaking: boolean, text: string) => void)[] = [];
  private speechLogListeners: ((text: string) => void)[] = [];

  // Dedicated AI Voice Output Web Audio Stream & Analyser
  private voiceAnalyser: AnalyserNode | null = null;
  private voiceFrequencyData: Uint8Array | null = null;
  private voiceWaveformData: Uint8Array | null = null;
  private isVoiceSpeaking = false;
  private currentSpokenText = '';
  private currentActiveWord = '';
  private currentWordIndex = 0;
  private currentTotalWords = 0;
  private currentTone = 'Neutral';
  private currentSentiment = 'analytical';
  private wordListeners: ((word: string, index: number, total: number) => void)[] = [];
  private voiceCarrierOsc: OscillatorNode | null = null;
  private voiceFormantFilter: BiquadFilterNode | null = null;
  private voiceCarrierGain: GainNode | null = null;
  private voiceAnimTimer: any = null;
  private wordPacerTimer: any = null;
  private voiceSynthTime = 0;
  private combinedFrequencyBuffer: Uint8Array | null = null;

  // Microphone state & audio nodes
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private isMicActive = false;
  private micFrequencyData: Uint8Array | null = null;
  private micWaveformData: Uint8Array | null = null;
  private micListeners: ((active: boolean, level: number) => void)[] = [];
  private recognition: any = null;
  private isRecognizing = false;
  private isSpeechOutputActive = false;
  private recognitionRestartTimer: ReturnType<typeof setTimeout> | null = null;
  private transcriptListeners: ((transcript: string, isFinal: boolean) => void)[] = [];

  private static readonly PROFILE_STORAGE_KEY = 'gaia_voice_profile_v1';
  private static readonly VOICE_STORAGE_KEY = 'gaia_system_voice_uri_v1';
  private static readonly TUNING_STORAGE_KEY = 'gaia_voice_tuning_v1';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', () => this.loadVoice());
      try {
        const savedProfile = window.localStorage.getItem(AudioVoiceService.PROFILE_STORAGE_KEY);
        const profile = savedProfile ? AudioVoiceService.PROFILES[savedProfile] : null;
        if (profile) {
          this.currentProfileId = profile.id;
          this.pitch = profile.pitch;
          this.rate = profile.rate;
        }
        const tuning = window.localStorage.getItem(AudioVoiceService.TUNING_STORAGE_KEY);
        if (tuning) {
          const parsed = JSON.parse(tuning);
          if (Number.isFinite(parsed.pitch)) this.pitch = Math.max(0.5, Math.min(2, parsed.pitch));
          if (Number.isFinite(parsed.rate)) this.rate = Math.max(0.5, Math.min(2, parsed.rate));
        }
      } catch {
        // Preferences are device-local and optional; defaults remain usable.
      }
      this.loadVoice();
    }
  }

  private loadVoice(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    let savedVoiceURI = '';
    try { savedVoiceURI = window.localStorage.getItem(AudioVoiceService.VOICE_STORAGE_KEY) || ''; } catch {}
    const saved = savedVoiceURI ? voices.find(v => v.voiceURI === savedVoiceURI) : undefined;
    const locale = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : '';
    const localeVoice = voices.find(v => v.lang.toLowerCase() === locale);
    const languageVoice = voices.find(v => locale && v.lang.toLowerCase().startsWith(locale.split('-')[0]));
    this.selectedVoice = saved || localeVoice || languageVoice || voices.find(v => v.default) || voices[0];
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  }

  public getSelectedVoiceURI(): string {
    return this.selectedVoice?.voiceURI || '';
  }

  public setSystemVoice(voiceURI: string): boolean {
    const voice = this.getAvailableVoices().find(v => v.voiceURI === voiceURI);
    if (!voice) return false;
    this.selectedVoice = voice;
    try { window.localStorage.setItem(AudioVoiceService.VOICE_STORAGE_KEY, voice.voiceURI); } catch {}
    return true;
  }

  public initContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.85;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public toggle963(forceState?: boolean): boolean {
    const ctx = this.initContext();
    const target = forceState !== undefined ? forceState : !this.is963Active;

    if (target) {
      if (this.solfeggioOsc) {
        this.solfeggioOsc.stop();
        this.solfeggioOsc.disconnect();
      }
      this.solfeggioOsc = ctx.createOscillator();
      this.solfeggioGain = ctx.createGain();

      this.solfeggioOsc.type = 'sine';
      this.solfeggioOsc.frequency.setValueAtTime(963, ctx.currentTime);

      // Soft harmonic envelope
      this.solfeggioGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.solfeggioGain.gain.exponentialRampToValueAtTime(0.028, ctx.currentTime + 1.2);

      this.solfeggioOsc.connect(this.solfeggioGain);
      if (this.analyser) {
        this.solfeggioGain.connect(this.analyser);
      }
      this.solfeggioGain.connect(ctx.destination);

      this.solfeggioOsc.start();
      this.is963Active = true;
    } else {
      if (this.solfeggioGain && this.audioCtx) {
        this.solfeggioGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.4);
        setTimeout(() => {
          if (this.solfeggioOsc) {
            this.solfeggioOsc.stop();
            this.solfeggioOsc.disconnect();
            this.solfeggioOsc = null;
          }
        }, 450);
      }
      this.is963Active = false;
    }
    return this.is963Active;
  }

  public getAudioFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.frequencyData) return null;
    (this.analyser as any).getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  // =========================================================================
  // AI VOICE RESPONSE OUTPUT WEB AUDIO STREAM & REAL-TIME ANALYSER
  // =========================================================================

  private initVoiceAnalyser(): AnalyserNode {
    const ctx = this.initContext();
    if (!this.voiceAnalyser) {
      this.voiceAnalyser = ctx.createAnalyser();
      this.voiceAnalyser.fftSize = 256;
      this.voiceAnalyser.smoothingTimeConstant = 0.75;
      this.voiceFrequencyData = new Uint8Array(this.voiceAnalyser.frequencyBinCount);
      this.voiceWaveformData = new Uint8Array(this.voiceAnalyser.fftSize);
    }
    return this.voiceAnalyser;
  }

  /**
   * Track the browser's real SpeechSynthesis events for captions and word focus.
   * SpeechSynthesis output cannot be routed back into Web Audio on all browsers,
   * so this method deliberately does not synthesize a second audible oscillator.
   */
  public startVoiceAudioStream(text: string, tone = 'Neutral', sentiment = 'analytical'): void {
    this.stopVoiceAudioStream();
    this.isVoiceSpeaking = true;
    this.currentSpokenText = text;
    this.currentTone = tone;
    this.currentSentiment = sentiment;
    this.voiceSynthTime = 0;
    const words = text.split(/\s+/).filter(Boolean);
    this.currentTotalWords = words.length;
    this.currentWordIndex = 0;
    this.currentActiveWord = words[0] || '';
  }

  public stopVoiceAudioStream(): void {
    if (this.voiceAnimTimer) {
      clearInterval(this.voiceAnimTimer);
      this.voiceAnimTimer = null;
    }
    if (this.wordPacerTimer) {
      clearInterval(this.wordPacerTimer);
      this.wordPacerTimer = null;
    }
    this.isVoiceSpeaking = false;
    this.currentSpokenText = '';
    this.currentActiveWord = '';
    this.currentWordIndex = 0;
    this.currentTotalWords = 0;
  }

  public getVoiceAudioData(): VoiceAudioData | null {
    if (!this.isVoiceSpeaking && !this.isMicActive) return null;
    // Browser TTS owns the actual output. Expose real speech/word state without
    // inventing a second oscillator waveform that does not match the spoken audio.
    if (!this.voiceFrequencyData) this.voiceFrequencyData = new Uint8Array(128);
    if (!this.voiceWaveformData) this.voiceWaveformData = new Uint8Array(256);
    this.voiceFrequencyData.fill(0);
    this.voiceWaveformData.fill(128);
    const profile = this.getCurrentProfile();
    return {
      volume: 0,
      frequencyData: this.voiceFrequencyData,
      waveformData: this.voiceWaveformData,
      isSpeaking: this.isVoiceSpeaking,
      activeText: this.currentSpokenText,
      activeWord: this.currentActiveWord,
      wordIndex: this.currentWordIndex,
      totalWords: this.currentTotalWords,
      profile: profile.name,
      carrierFreq: profile.carrierFreq,
      sentiment: this.currentSentiment,
      tone: this.currentTone,
    };
  }

  public isAiSpeaking(): boolean {
    return this.isVoiceSpeaking;
  }

  public getActiveSpeechText(): string {
    return this.currentSpokenText;
  }

  public getCombinedAudioFrequencyData(): Uint8Array | null {
    if (!this.combinedFrequencyBuffer) {
      this.combinedFrequencyBuffer = new Uint8Array(128);
    }

    const voiceData = this.getVoiceAudioData();
    const micData = this.isMicActive ? this.getMicrophoneAudioData() : null;
    const baseAudio = this.getAudioFrequencyData();

    // Fast blend into combinedFrequencyBuffer
    for (let i = 0; i < 128; i++) {
      let maxVal = 0;
      if (voiceData && voiceData.isSpeaking && voiceData.frequencyData) {
        maxVal = Math.max(maxVal, voiceData.frequencyData[i] || 0);
      }
      if (micData && micData.isSpeaking && micData.frequencyData) {
        maxVal = Math.max(maxVal, micData.frequencyData[i] || 0);
      }
      if (baseAudio) {
        maxVal = Math.max(maxVal, baseAudio[i] || 0);
      }
      this.combinedFrequencyBuffer[i] = maxVal;
    }

    return this.combinedFrequencyBuffer;
  }

  // =========================================================================
  // MICROPHONE INPUT & REAL-TIME AUDIO WAVEFORM ANALYSIS
  // =========================================================================


  public isMicrophoneActive(): boolean {
    return this.isMicActive;
  }

  public async startMicrophone(): Promise<boolean> {
    const ctx = this.initContext();

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        this.micStream = stream;
        this.micSourceNode = ctx.createMediaStreamSource(stream);

        // Dedicated Analyser for microphone with 256 bins for smooth perimeter waveforms
        this.micAnalyser = ctx.createAnalyser();
        this.micAnalyser.fftSize = 256;
        this.micAnalyser.smoothingTimeConstant = 0.8;

        this.micFrequencyData = new Uint8Array(this.micAnalyser.frequencyBinCount);
        this.micWaveformData = new Uint8Array(this.micAnalyser.fftSize);

        this.micSourceNode.connect(this.micAnalyser);

        this.isMicActive = true;
        this.notifyMicChange(true, 0);

        this.initSpeechRecognition();
        return true;
      }
    } catch (err) {
      console.warn('Microphone access failed; input remains disabled:', err);
    }
    this.stopMicrophone();
    return false;
  }

  public stopMicrophone(): void {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micSourceNode) {
      this.micSourceNode.disconnect();
      this.micSourceNode = null;
    }
    if (this.recognition) {
      try { this.recognition.abort(); } catch {}
      this.isRecognizing = false;
      this.recognition = null;
    }
    if (this.recognitionRestartTimer) {
      clearTimeout(this.recognitionRestartTimer);
      this.recognitionRestartTimer = null;
    }
    this.isMicActive = false;
    this.notifyMicChange(false, 0);
  }

  public toggleMicrophone(): Promise<boolean> {
    if (this.isMicActive) {
      this.stopMicrophone();
      return Promise.resolve(false);
    } else {
      return this.startMicrophone();
    }
  }

  public isMicrophoneActive(): boolean {
    return this.isMicActive;
  }

  /**
   * Retrieves real-time microphone waveform and frequency data,
   * calculating speech intensity level (0.0 to 1.0)
   */
  public getMicrophoneAudioData(): MicrophoneAudioData | null {
    if (!this.isMicActive || !this.micFrequencyData || !this.micWaveformData) {
      return null;
    }

    if (this.micAnalyser) {
      (this.micAnalyser as any).getByteFrequencyData(this.micFrequencyData);
      (this.micAnalyser as any).getByteTimeDomainData(this.micWaveformData);

      // Calculate RMS volume level
      let sum = 0;
      for (let i = 0; i < this.micWaveformData.length; i++) {
        const normalized = (this.micWaveformData[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / this.micWaveformData.length);
      const volume = Math.min(1.0, rms * 4.5);
      const isSpeaking = volume > 0.08;

      return {
        volume,
        frequencyData: this.micFrequencyData,
        waveformData: this.micWaveformData,
        isSpeaking,
      };
    }
    return null;
  }

  // =========================================================================
  // SPEECH RECOGNITION (VOICE-TO-COMMAND INTERFACE)
  // =========================================================================

  private initSpeechRecognition(): void {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          // Command dispatch is centralized in HyperTerminal after wake-word and policy checks.
          this.notifyTranscript(final.trim(), true);
        } else if (interim) {
          this.notifyTranscript(interim.trim(), false);
        }
      };

      this.recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('Speech recognition error:', e.error);
        }
      };

      this.recognition.onend = () => {
        this.isRecognizing = false;
        // Half-duplex by design: do not let TTS feed back into its own recognizer.
        if (this.isMicActive && this.recognition && !this.isSpeechOutputActive) {
          this.scheduleRecognitionRestart();
        }
      };

      this.recognition.start();
      this.isRecognizing = true;
    } catch (e) {
      console.warn('Failed to start SpeechRecognition:', e);
    }
  }

  private scheduleRecognitionRestart(): void {
    if (this.recognitionRestartTimer) clearTimeout(this.recognitionRestartTimer);
    this.recognitionRestartTimer = setTimeout(() => {
      this.recognitionRestartTimer = null;
      if (!this.isMicActive || this.isSpeechOutputActive || !this.recognition || this.isRecognizing) return;
      try {
        this.recognition.start();
        this.isRecognizing = true;
      } catch {
        // The browser may still be completing the previous recognition session.
      }
    }, 180);
  }

  public onTranscript(cb: (transcript: string, isFinal: boolean) => void): () => void {
    this.transcriptListeners.push(cb);
    return () => {
      this.transcriptListeners = this.transcriptListeners.filter((l) => l !== cb);
    };
  }

  private notifyTranscript(transcript: string, isFinal: boolean): void {
    // Suppress AI hearing its own synthesized voice to prevent acoustic feedback loop
    if (this.isVoiceSpeaking) {
      return;
    }
    this.transcriptListeners.forEach((cb) => cb(transcript, isFinal));
  }

  public onMicChange(cb: (active: boolean, level: number) => void): () => void {
    this.micListeners.push(cb);
    return () => {
      this.micListeners = this.micListeners.filter((l) => l !== cb);
    };
  }

  private notifyMicChange(active: boolean, level: number): void {
    this.micListeners.forEach((cb) => cb(active, level));
  }

  // =========================================================================
  // LIGHTWEIGHT WAKE-WORD LISTENER (PASSIVE UNTIL ADDRESSED)
  // =========================================================================

  private isWakeWordGated = true; // remains passively listening until addressed
  private wakeWordState: WakeWordState = 'passive';
  private wakeWordTimeoutMs = 12000; // 12 seconds active speech dwell time
  private wakeTimer: any = null;
  private wakeListeners: ((state: WakeWordState, wakeWord?: string) => void)[] = [];

  public isWakeWordEnabled(): boolean {
    return this.isWakeWordGated;
  }

  public setWakeWordEnabled(enabled: boolean): void {
    this.isWakeWordGated = enabled;
    if (!enabled) {
      this.activateWakeState('open_mic');
    } else {
      this.deactivateWakeState();
    }
  }

  public getWakeWordState(): WakeWordState {
    return this.wakeWordState;
  }

  public getWakeWordTimeout(): number {
    return Math.round(this.wakeWordTimeoutMs / 1000);
  }

  public setWakeWordTimeout(sec: number): void {
    this.wakeWordTimeoutMs = Math.max(3, Math.min(120, sec)) * 1000;
  }

  public activateWakeState(wakeWord = 'gemini'): void {
    this.wakeWordState = 'active';
    if (this.wakeTimer) {
      clearTimeout(this.wakeTimer);
    }
    this.wakeTimer = setTimeout(() => {
      this.deactivateWakeState();
    }, this.wakeWordTimeoutMs);

    this.notifyWakeWordChange('active', wakeWord);
  }

  public touchWakeActivity(): void {
    if (this.wakeWordState === 'active') {
      if (this.wakeTimer) {
        clearTimeout(this.wakeTimer);
      }
      this.wakeTimer = setTimeout(() => {
        this.deactivateWakeState();
      }, this.wakeWordTimeoutMs);
    }
  }

  public deactivateWakeState(): void {
    this.wakeWordState = 'passive';
    if (this.wakeTimer) {
      clearTimeout(this.wakeTimer);
      this.wakeTimer = null;
    }
    this.notifyWakeWordChange('passive');
  }

  public onWakeWordChange(cb: (state: WakeWordState, wakeWord?: string) => void): () => void {
    this.wakeListeners.push(cb);
    return () => {
      this.wakeListeners = this.wakeListeners.filter((l) => l !== cb);
    };
  }

  private notifyWakeWordChange(state: WakeWordState, wakeWord?: string): void {
    this.wakeListeners.forEach((cb) => cb(state, wakeWord));
  }

  // =========================================================================
  // VOICE PROFILES & ACCESSIBILITY SUBSYSTEM
  // =========================================================================

  private currentProfileId = 'natch';
  private announcerListeners: ((message: string, assertive: boolean) => void)[] = [];

  public static readonly PROFILES: Record<string, VoiceProfile> = {
    natch: {
      id: 'natch',
      name: 'Natch Natural',
      pitch: 1.0,
      rate: 1.0,
      carrierFreq: 432,
      description: 'Natural conversational cadence with balanced pitch and rate for system inspection',
      style: 'from-amber-400 to-emerald-400',
      oscillatorType: 'sine',
    },
    gemini_female: {
      id: 'gemini_female',
      name: 'Gemini Neural',
      pitch: 1.15,
      rate: 1.02,
      carrierFreq: 528,
      description: 'Default conversational pitch and rate preset; the selected device voice provides the actual sound',
      style: 'from-fuchsia-400 to-cyan-400',
      oscillatorType: 'sine',
    },
    nature_gaia: {
      id: 'nature_gaia',
      name: 'Gaia Biophilic (Nature)',
      pitch: 1.02,
      rate: 0.92,
      carrierFreq: 432,
      description: 'Slower, measured cadence preset for calm explanations',
      style: 'from-emerald-400 to-amber-300',
      oscillatorType: 'sine',
    },
    cyber_synth: {
      id: 'cyber_synth',
      name: 'Cyberpunk Synthesizer',
      pitch: 0.82,
      rate: 1.25,
      carrierFreq: 963,
      description: 'Faster cadence preset for concise technical status and diagnostics',
      style: 'from-cyan-400 to-fuchsia-500',
      oscillatorType: 'sawtooth',
    },
    sovereign: {
      id: 'sovereign',
      name: 'Sovereign Core',
      pitch: 0.95,
      rate: 1.05,
      carrierFreq: 432,
      description: 'Balanced pitch and cadence preset for general terminal responses',
      style: 'from-cyan-400 to-blue-500',
      oscillatorType: 'triangle',
    },
    quantum: {
      id: 'quantum',
      name: 'Quantum Echo',
      pitch: 1.3,
      rate: 0.95,
      carrierFreq: 528,
      description: 'Slightly higher-pitch preset with measured pacing for exploratory explanations',
      style: 'from-purple-400 to-pink-500',
      oscillatorType: 'sine',
    },
    cyber: {
      id: 'cyber',
      name: 'Cyber Pulse',
      pitch: 0.75,
      rate: 1.25,
      carrierFreq: 963,
      description: 'Lower-pitch, faster cadence preset for dense technical output',
      style: 'from-emerald-400 to-cyan-400',
      oscillatorType: 'sawtooth',
    },
    tranquil: {
      id: 'tranquil',
      name: 'Tranquil Aura',
      pitch: 1.0,
      rate: 0.82,
      carrierFreq: 639,
      description: 'Warm, slower cadence preset for longer explanations',
      style: 'from-amber-400 to-rose-400',
      oscillatorType: 'sine',
    },
    alarm_urgent: {
      id: 'alarm_urgent',
      name: 'Hazard Vector',
      pitch: 1.45,
      rate: 1.3,
      carrierFreq: 852,
      description: 'Short, clear alert cadence preset for important status messages',
      style: 'from-red-500 to-amber-500',
      oscillatorType: 'square',
    },
  };

  public getVoiceProfiles() {
    return Object.values(AudioVoiceService.PROFILES);
  }

  public getCurrentProfile() {
    return AudioVoiceService.PROFILES[this.currentProfileId] || AudioVoiceService.PROFILES.sovereign;
  }

  public setVoiceProfile(profileId: string) {
    const key = profileId.toLowerCase();
    // Support aliases
    const targetKey =
      key === 'nature' ? 'nature_gaia' :
      key === 'cybercity' || key === 'tech' || key === 'technology' ? 'cyber_synth' :
      key === 'alarm' || key === 'hazard' ? 'alarm_urgent' :
      key;

    const profile = AudioVoiceService.PROFILES[targetKey] || AudioVoiceService.PROFILES[key];
    if (profile) {
      this.currentProfileId = profile.id;
      this.pitch = profile.pitch;
      this.rate = profile.rate;
      try { window.localStorage.setItem(AudioVoiceService.PROFILE_STORAGE_KEY, profile.id); } catch {}
      try { window.localStorage.setItem(AudioVoiceService.TUNING_STORAGE_KEY, JSON.stringify({ pitch: this.pitch, rate: this.rate })); } catch {}
      return profile;
    }
    return null;
  }

  public onWordSpoken(cb: (word: string, index: number, total: number) => void): () => void {
    this.wordListeners.push(cb);
    return () => {
      this.wordListeners = this.wordListeners.filter((l) => l !== cb);
    };
  }

  public notifyWord(word: string, index: number, total: number): void {
    this.wordListeners.forEach((cb) => cb(word, index, total));
  }

  public playEarcon(type: 'command' | 'success' | 'error' | 'stream' | 'switch' | 'ping'): void {
    switch (type) {
      case 'command':
        this.playTone(880, 'sine', 45, 0.02);
        break;
      case 'success':
        this.playTone(660, 'sine', 50, 0.02);
        setTimeout(() => this.playTone(1320, 'sine', 80, 0.025), 45);
        break;
      case 'error':
        this.playTone(220, 'sawtooth', 120, 0.035);
        break;
      case 'stream':
        this.playTone(528, 'sine', 40, 0.015);
        setTimeout(() => this.playTone(792, 'triangle', 60, 0.02), 35);
        setTimeout(() => this.playTone(1056, 'sine', 90, 0.025), 75);
        break;
      case 'switch':
        this.playTone(440, 'triangle', 40, 0.02);
        setTimeout(() => this.playTone(660, 'sine', 50, 0.02), 30);
        break;
      case 'ping':
        this.playTone(1760, 'sine', 30, 0.03);
        break;
    }
  }

  public onAnnounce(cb: (message: string, assertive: boolean) => void): () => void {
    this.announcerListeners.push(cb);
    return () => {
      this.announcerListeners = this.announcerListeners.filter((l) => l !== cb);
    };
  }

  public announce(message: string, assertive = false): void {
    this.announcerListeners.forEach((cb) => cb(message, assertive));
  }

  // =========================================================================
  // AUDIO SYNTHESIZER FEEDBACK TONES & TTS
  // =========================================================================

  public playTone(freq = 880, type: OscillatorType = 'sine', durationMs = 80, gainVal = 0.03): void {
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      if (this.analyser) gain.connect(this.analyser);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Ignored if user hasn't interacted with audio yet
    }
  }

  public playTypingChirp(): void {
    this.playTone(1800 + Math.random() * 400, 'triangle', 25, 0.008);
  }

  public playEnterChirp(): void {
    this.playTone(660, 'sine', 60, 0.02);
    setTimeout(() => this.playTone(990, 'sine', 80, 0.025), 40);
  }

  public playErrorChirp(): void {
    this.playTone(220, 'sawtooth', 120, 0.03);
  }

  public speak(
    text: string,
    options?: {
      profile?: string;
      pitch?: number;
      rate?: number;
      tone?: string;
      sentiment?: string;
      onWord?: (word: string, index: number, total: number) => void;
      onEnd?: () => void;
    }
  ): Promise<void> {
    return new Promise((resolve) => {
      // If profile is passed, set it
      if (options?.profile) {
        this.setVoiceProfile(options.profile);
      }

      const activePitch = options?.pitch ?? this.pitch;
      const activeRate = options?.rate ?? this.rate;
      const activeTone = options?.tone || this.currentTone || 'Neutral';
      const activeSentiment = options?.sentiment || this.currentSentiment || 'analytical';

      if (!this.isVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        // Never report a synthetic oscillator/timer as spoken language.
        this.notifySpeech(false, '');
        options?.onEnd?.();
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      // Clean markdown tags or code blocks for speech
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Code block omitted.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*_#~]/g, '')
        .trim();

      if (!cleanText) {
        this.notifySpeech(false, '');
        options?.onEnd?.();
        return resolve();
      }

      const words = cleanText.split(/\s+/).filter(Boolean);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
        utterance.lang = this.selectedVoice.lang;
      }
      utterance.pitch = activePitch;
      utterance.rate = activeRate;
      utterance.volume = 1;

      let boundaryFired = false;
      utterance.onboundary = (e: any) => {
        if (e.name === 'word') {
          boundaryFired = true;
          if (this.wordPacerTimer) {
            clearInterval(this.wordPacerTimer);
            this.wordPacerTimer = null;
          }
          const charIndex = e.charIndex;
          const remaining = cleanText.substring(charIndex);
          const match = remaining.match(/^(\S+)/);
          const currentWord = match ? match[1].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') : '';
          const wordsBefore = cleanText.substring(0, charIndex).trim().split(/\s+/).filter(Boolean);
          const wordIdx = wordsBefore.length;
          this.currentActiveWord = currentWord;
          this.currentWordIndex = wordIdx;
          this.notifyWord(currentWord, wordIdx, words.length);
          if (options?.onWord) {
            options.onWord(currentWord, wordIdx, words.length);
          }
        }
      };

      utterance.onstart = () => {
        this.isSpeechOutputActive = true;
        if (this.recognition && this.isRecognizing) {
          try { this.recognition.stop(); } catch {}
        }
        this.startVoiceAudioStream(cleanText, activeTone, activeSentiment);
        this.notifySpeech(true, cleanText);
        this.notifySpeechLog(cleanText);

        // Fallback word pacer timer if onboundary is not supported by the synthesis engine
        let stepIdx = 0;
        const intervalMs = Math.max(120, Math.floor(360 / (activeRate || 1.0)));
        this.wordPacerTimer = setInterval(() => {
          if (!boundaryFired && this.isVoiceSpeaking && stepIdx < words.length) {
            this.currentActiveWord = words[stepIdx] || '';
            this.currentWordIndex = stepIdx;
            this.notifyWord(this.currentActiveWord, stepIdx, words.length);
            if (options?.onWord) {
              options.onWord(this.currentActiveWord, stepIdx, words.length);
            }
            stepIdx++;
          }
        }, intervalMs);
      };

      const finishSpeech = () => {
        this.isSpeechOutputActive = false;
        this.stopVoiceAudioStream();
        this.notifySpeech(false, '');
        this.touchWakeActivity();
        if (this.isMicActive && this.recognition) this.scheduleRecognitionRestart();
        options?.onEnd?.();
        resolve();
      };
      utterance.onend = finishSpeech;
      utterance.onerror = finishSpeech;

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        this.stopVoiceAudioStream();
        this.notifySpeech(false, '');
        options?.onEnd?.();
        resolve();
      }
    });
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeechOutputActive = false;
    this.stopVoiceAudioStream();
    this.notifySpeech(false, '');
    if (this.isMicActive && this.recognition) this.scheduleRecognitionRestart();
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.isVoiceEnabled = enabled;
    if (!enabled) this.stopSpeaking();
  }

  public setVoiceParams(pitch: number, rate: number, voiceName?: string): void {
    this.pitch = Math.max(0.5, Math.min(2.0, pitch));
    this.rate = Math.max(0.5, Math.min(2.0, rate));
    if (voiceName && typeof window !== 'undefined') {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.name === voiceName || v.voiceURI === voiceName);
      if (match) this.setSystemVoice(match.voiceURI);
    }
    try {
      window.localStorage.setItem(AudioVoiceService.TUNING_STORAGE_KEY, JSON.stringify({ pitch: this.pitch, rate: this.rate }));
    } catch {}
  }

  public onSpeechChange(cb: (speaking: boolean, text: string) => void): () => void {
    this.speechListeners.push(cb);
    return () => {
      this.speechListeners = this.speechListeners.filter((l) => l !== cb);
    };
  }

  public onSpeechLog(cb: (text: string) => void): () => void {
    this.speechLogListeners.push(cb);
    return () => {
      this.speechLogListeners = this.speechLogListeners.filter((l) => l !== cb);
    };
  }

  private notifySpeechLog(text: string): void {
    this.speechLogListeners.forEach((cb) => cb(text));
  }

  private notifySpeech(speaking: boolean, text: string): void {
    this.speechListeners.forEach((cb) => cb(speaking, text));
  }
}

export const audioVoiceService = new AudioVoiceService();
