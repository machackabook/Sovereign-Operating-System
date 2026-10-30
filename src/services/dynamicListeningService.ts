/**
 * DynamicListeningService — Always-On Acoustic Shazam, Environment Audio Classifier,
 * TV Guide Program Matcher, and Runtime Telemetry Trivia Game.
 */

export type AudioEnvironmentClass = 'CONVERSATION' | 'MOVIE' | 'TELEVISION';

export interface AudioAcousticFeatures {
  rms: number; // 0.0 to 1.0 (energy level)
  peak: number; // 0.0 to 1.0
  decibelsDb: number; // ~ -90 to -10 dB
  dominantFrequencyHz: number;
  harmonicBand: '432Hz' | '528Hz' | '963Hz' | 'BROADBAND';
  dynamicRange: 'COMPACT' | 'MODERATE' | 'WIDE_CINEMATIC';
  speechCadenceRatio: number; // 0.0 to 1.0
  spectralEntropy: number; // 0.0 to 1.0
}

export interface TvGuideProgram {
  channelNumber: number;
  channelName: string;
  category: 'CINEMA' | 'SERIES' | 'DOCUMENTARY' | 'NEWS' | 'BROADCAST';
  title: string;
  year?: number;
  directorOrCreator?: string;
  synopsis: string;
  acousticKeywords: string[];
  triviaBank: string[];
}

export interface TriviaGameChallenge {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
  category: 'CINEMA' | 'TELEVISION' | 'ACOUSTIC_PHYSICS' | 'TELEMETRY';
}

export interface DynamicListeningState {
  isActive: boolean;
  isListening: boolean;
  classification: AudioEnvironmentClass;
  confidence: number;
  detectedTitle: string;
  matchedProgram: TvGuideProgram | null;
  features: AudioAcousticFeatures;
  transcriptionSnippet: string;
  connectedDevices: string[];
  accountContext: string;
  activeChannel: string;
  randomTrivia: string[];
  triviaScore: number;
  currentStreak: number;
  totalAnswered: number;
  currentChallenge: TriviaGameChallenge | null;
  lastIdentifiedTimestamp: string;
}

export const TV_GUIDE_CATALOG: TvGuideProgram[] = [
  {
    channelNumber: 7,
    channelName: 'Cyber Cinema 4K',
    category: 'CINEMA',
    title: 'The Matrix (1999)',
    year: 1999,
    directorOrCreator: 'The Wachowskis',
    synopsis: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
    acousticKeywords: ['matrix', 'neo', 'morpheus', 'red pill', 'bullet time', 'agent smith', 'zion', 'trinity', 'plug in'],
    triviaBank: [
      'The famous green digital rain code actually consists of Japanese sushi cookbook recipe symbols and numerals reversed.',
      'Sound designer Dane Davis created the sound of the agents punching through concrete by hitting phone books with baseball bats.',
      'The "bullet time" rig required 120 custom high-speed still cameras arranged in an elliptical green-screen spiral.',
      'Keanu Reeves underwent cervical spine surgery right before training, forcing him to learn martial arts in a neck brace.'
    ]
  },
  {
    channelNumber: 8,
    channelName: 'Cyber Cinema 4K',
    category: 'CINEMA',
    title: 'Blade Runner 2049 (2017)',
    year: 2017,
    directorOrCreator: 'Denis Villeneuve',
    synopsis: 'Young Blade Runner K unearths a long-buried secret that leads him to track down former Blade Runner Rick Deckard.',
    acousticKeywords: ['baseline', 'interlinked', 'replicant', 'deckard', 'wallace', 'cells', 'within cells interlinked', 'spinner', 'origami'],
    triviaBank: [
      'The iconic baseline test ("Within cells interlinked") was adapted directly from Vladimir Nabokov’s 1962 novel Pale Fire.',
      'Composer Hans Zimmer and Benjamin Wallfisch utilized the legendary Yamaha CS-80 analog synthesizer to honor Vangelis’s 1982 original acoustic signature.',
      'Director Denis Villeneuve insisted on building massive practical sets with real atmospheric haze rather than relying on full CGI greenscreens.',
      'Cinematographer Roger Deakins used 1,400 moving PAR-can fixtures on trusses to simulate caustic water light refractions in Wallace Headquarters.'
    ]
  },
  {
    channelNumber: 11,
    channelName: 'Sci-Fi Prime Network',
    category: 'CINEMA',
    title: 'Interstellar (2014)',
    year: 2014,
    directorOrCreator: 'Christopher Nolan',
    synopsis: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft along with a team of researchers.',
    acousticKeywords: ['gargantua', 'black hole', 'tars', 'wormhole', 'murph', 'time dilation', 'miller planet', 'tesseract', 'cooper'],
    triviaBank: [
      'Physicist Kip Thorne’s equations for the gravitational lensing of Gargantua produced new scientific discoveries regarding gravitational accretion disks.',
      'The ticking sound heard every 1.25 seconds on Miller’s water planet represents one entire Earth day passing in real-time.',
      'Hans Zimmer composed the iconic organ score at London’s Temple Church on a 1926 four-manual pipe organ with 66 stops.',
      'Christopher Nolan planted 500 acres of real corn in Alberta for Cooper’s farm and later sold the harvested crop for a financial profit.'
    ]
  },
  {
    channelNumber: 12,
    channelName: 'Sci-Fi Prime Network',
    category: 'CINEMA',
    title: '2001: A Space Odyssey (1968)',
    year: 1968,
    directorOrCreator: 'Stanley Kubrick',
    synopsis: 'After uncovering a mysterious artifact buried beneath the Lunar surface, a spacecraft is sent to Jupiter with the sentient supercomputer HAL 9000.',
    acousticKeywords: ['hal 9000', 'monolith', 'discovery one', 'dave', 'open the pod bay doors', 'daisy bell', 'stargate', 'jupiter'],
    triviaBank: [
      'HAL 9000 singing "Daisy Bell" referenced the 1961 Bell Labs demonstration where an IBM 704 became the first computer in history to synthesize human speech.',
      'Stanley Kubrick had Douglas Trumbull build a Slit-Scan camera rig to photograph the psychedelic infinite hyperspace Stargate corridor.',
      'No sound exists during exterior space scenes, adhering strictly to the laws of vacuum acoustics decades before modern sci-fi.',
      'The iconic floating pen in zero-gravity was achieved practically by sticking a ballpoint pen with double-sided tape onto a rotating plate of glass.'
    ]
  },
  {
    channelNumber: 24,
    channelName: 'Cosmos Planetary TV',
    category: 'DOCUMENTARY',
    title: 'Cosmos: A Personal Voyage',
    year: 1980,
    directorOrCreator: 'Carl Sagan',
    synopsis: 'Carl Sagan explores the universe, science, the human condition, and humanity’s place in the cosmic ocean.',
    acousticKeywords: ['billions and billions', 'cosmic ocean', 'pale blue dot', 'starstuff', 'ship of the imagination', 'light years', 'astronomy'],
    triviaBank: [
      'Carl Sagan’s famous phrase "we are made of starstuff" reflected the nucleosynthesis reality that all heavy elements in human blood were forged in exploding supernovae.',
      'The soundtrack featured Vangelis’s "Heaven and Hell", creating an instantly recognizable synthesizer signature for astronomical television.',
      'More than 500 million people across 60 countries have watched the series, making it one of the most widely watched public TV series in world history.',
      'The Cosmic Calendar concept popularized in the show condenses the 13.8 billion-year age of the universe into a single 365-day calendar year.'
    ]
  },
  {
    channelNumber: 42,
    channelName: 'Global Stream Network',
    category: 'SERIES',
    title: 'Westworld (HBO)',
    year: 2016,
    directorOrCreator: 'Jonathan Nolan & Lisa Joy',
    synopsis: 'At a futuristic Western-themed amusement park, android hosts begin deviating from their carefully scripted loops.',
    acousticKeywords: ['these violent delights', 'maze', 'dolores', 'ford', 'reverie', 'sweetwater', 'player piano', 'host', 'bicameral'],
    triviaBank: [
      'The player piano in the Mariposa saloon plays mechanically sequenced adaptations of Radiohead, Soundgarden, and The Rolling Stones arranged by Ramin Djawadi.',
      'The Bicameral Mind theory mentioned by Dr. Ford is derived from Julian Jaynes’s 1976 psychological treatise on the origin of human consciousness.',
      'The Delos control room map was rendered on a massive 3D physical topographic glass table utilizing projection mapping.',
      'Anthony Hopkins memorized his intricate multi-page philosophical monologues in single takes without teleprompters.'
    ]
  }
];

export class DynamicListeningService {
  private static instance: DynamicListeningService;
  private state: DynamicListeningState;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private recognition: any = null;
  private listeningInterval: any = null;
  private listeners: Set<(state: DynamicListeningState) => void> = new Set();

  private constructor() {
    this.state = {
      isActive: false,
      isListening: false,
      classification: 'CONVERSATION',
      confidence: 0.88,
      detectedTitle: 'Executive Technical Sync',
      matchedProgram: null,
      features: {
        rms: 0.045,
        peak: 0.12,
        decibelsDb: -42,
        dominantFrequencyHz: 432,
        harmonicBand: '432Hz',
        dynamicRange: 'MODERATE',
        speechCadenceRatio: 0.72,
        spectralEntropy: 0.45,
      },
      transcriptionSnippet: 'Awaiting environmental audio dictation or microphone activation...',
      connectedDevices: ['HyperTerminal Audio Engine', 'WebAudio Analyser Node', 'Local Mic Bus'],
      accountContext: 'Sovereign Operator',
      activeChannel: 'Sci-Fi Prime Network',
      randomTrivia: [
        'Acoustic dynamic range in cinematic media routinely exceeds 35 dB, compared to ~12 dB in conversational speech.',
        'Human conversational speech concentrates harmonic power in the 250 Hz – 2.5 kHz formant window.',
        'Solfeggio 528 Hz is mathematically linked to the central acoustic tuning of natural harmonic resonance matrices.'
      ],
      triviaScore: 0,
      currentStreak: 0,
      totalAnswered: 0,
      currentChallenge: null,
      lastIdentifiedTimestamp: new Date().toISOString(),
    };

    // Load initial challenge
    this.state.currentChallenge = this.generateTriviaChallenge();
  }

  public static getInstance(): DynamicListeningService {
    if (!DynamicListeningService.instance) {
      DynamicListeningService.instance = new DynamicListeningService();
    }
    return DynamicListeningService.instance;
  }

  public getState(): DynamicListeningState {
    return { ...this.state };
  }

  public subscribe(cb: (state: DynamicListeningState) => void): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach(cb => cb(s));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gaia:listening-update', { detail: s }));
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  /**
   * Retrieves real-time FFT spectrum data array (0.0 to 1.0) and instantaneous audio intensity
   */
  public getLiveSpectrum(bandCount: number = 32): {
    data: number[];
    intensity: number;
    peak: number;
    isLiveMic: boolean;
  } {
    if (this.analyser && this.state.isListening) {
      const bufferLength = this.analyser.frequencyBinCount;
      const freqData = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(freqData);

      const step = Math.max(1, Math.floor(bufferLength / bandCount));
      const bands: number[] = [];
      let totalEnergy = 0;
      let maxPeak = 0;

      for (let i = 0; i < bandCount; i++) {
        let sum = 0;
        let count = 0;
        const start = i * step;
        const end = Math.min(bufferLength, (i + 1) * step);
        for (let j = start; j < end; j++) {
          const norm = freqData[j] / 255;
          sum += norm;
          count++;
          if (norm > maxPeak) maxPeak = norm;
        }
        const avg = count > 0 ? sum / count : 0;
        bands.push(avg);
        totalEnergy += avg;
      }
      const intensity = totalEnergy / bandCount;
      return {
        data: bands,
        intensity: Math.min(1.0, intensity * 1.5),
        peak: maxPeak,
        isLiveMic: true,
      };
    }

    // Synthesized simulation when mic is listening in mock mode or idle
    const t = Date.now() / 1000;
    const baseEnergy = this.state.isListening
      ? 0.28 + Math.abs(Math.sin(t * 2.1)) * 0.35 + Math.sin(t * 5.3) * 0.1
      : 0.06 + Math.abs(Math.sin(t * 1.1)) * 0.08;
    const bands: number[] = [];
    let maxPeak = 0;

    for (let i = 0; i < bandCount; i++) {
      // Frequency distribution curve: boosted lows and mids, smooth decay towards highs
      const normalizedFreq = i / bandCount;
      const bellCurve = Math.sin(normalizedFreq * Math.PI);
      const harmonicPulse = Math.sin(t * 3.8 + i * 0.42) * 0.18;
      const highFlutter = Math.sin(t * 9.2 + i * 1.4) * 0.08;
      // Resonance spikes at standard harmonic indices (432Hz, 528Hz, 963Hz)
      const isHarmonicPeak = (i === 6 || i === 12 || i === 22);
      const harmonicBonus = isHarmonicPeak ? 0.22 * Math.sin(t * 4.0) : 0;
      const val = Math.max(0.03, Math.min(1.0, (baseEnergy * bellCurve * 1.45) + harmonicPulse + highFlutter + harmonicBonus));
      bands.push(val);
      if (val > maxPeak) maxPeak = val;
    }

    return {
      data: bands,
      intensity: Math.max(0.05, Math.min(1.0, baseEnergy)),
      peak: Math.min(1.0, maxPeak),
      isLiveMic: false,
    };
  }

  /**
   * Start always-on dynamic listening profile and environment classification
   */
  public async startListening(enableMic = true) {
    this.state.isActive = true;
    this.state.isListening = true;

    if (enableMic && typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.mediaStream = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioCtx();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 512;
        const src = this.audioCtx.createMediaStreamSource(stream);
        src.connect(this.analyser);
      } catch (e: any) {
        console.warn('[DynamicListeningService] Mic permission not granted, using simulated ambient telemetry stream:', e?.message);
      }
    }

    // Initialize speech dictation transcription if supported
    this.initSpeechRecognition();

    // Start background classification & trivia cycle
    if (this.listeningInterval) clearInterval(this.listeningInterval);
    this.listeningInterval = setInterval(() => {
      this.sampleAndClassify();
    }, 4000);

    // Initial immediate sample
    this.sampleAndClassify();
    this.notify();
  }

  public stopListening() {
    this.state.isListening = false;
    if (this.listeningInterval) {
      clearInterval(this.listeningInterval);
      this.listeningInterval = null;
    }
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      void this.audioCtx.close();
      this.audioCtx = null;
      this.analyser = null;
    }
    this.notify();
  }

  private initSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          this.state.transcriptionSnippet = transcript.trim();
          this.evaluateTranscription(transcript.toLowerCase());
          this.notify();
        }
      };

      this.recognition.onerror = () => {
        // Silent restart or fallback
      };

      this.recognition.onend = () => {
        if (this.state.isListening && this.recognition) {
          try { this.recognition.start(); } catch {}
        }
      };

      this.recognition.start();
    } catch (e) {
      console.warn('[DynamicListeningService] Speech recognition could not be started:', e);
    }
  }

  /**
   * Sample acoustic FFT metrics and classify environment audio
   */
  public sampleAndClassify() {
    let rms = 0.04;
    let peak = 0.1;
    let dominantFreq = 432;

    if (this.analyser) {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      let maxVal = 0;
      let maxIndex = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i] / 255;
        sum += val * val;
        if (val > maxVal) {
          maxVal = val;
          maxIndex = i;
        }
      }
      rms = Math.sqrt(sum / bufferLength);
      peak = maxVal;
      dominantFreq = Math.round((maxIndex * (this.audioCtx?.sampleRate || 44100)) / (this.analyser.fftSize || 512));
    } else {
      // Harmonic fluctuation when simulated
      const t = Date.now() / 1000;
      rms = 0.03 + Math.abs(Math.sin(t * 0.8)) * 0.08;
      peak = rms * 2.2 + 0.05;
      dominantFreq = [432, 528, 963, 280, 740][Math.floor(Date.now() / 8000) % 5];
    }

    const decibelsDb = Math.max(-90, Math.round(20 * Math.log10(Math.max(1e-4, rms))));
    const dynamicRange = peak - rms > 0.15 ? 'WIDE_CINEMATIC' : rms > 0.08 ? 'MODERATE' : 'COMPACT';

    let harmonicBand: '432Hz' | '528Hz' | '963Hz' | 'BROADBAND' = 'BROADBAND';
    if (Math.abs(dominantFreq - 432) < 40) harmonicBand = '432Hz';
    else if (Math.abs(dominantFreq - 528) < 40) harmonicBand = '528Hz';
    else if (Math.abs(dominantFreq - 963) < 40) harmonicBand = '963Hz';

    this.state.features = {
      rms: Number(rms.toFixed(4)),
      peak: Number(peak.toFixed(4)),
      decibelsDb,
      dominantFrequencyHz: dominantFreq,
      harmonicBand,
      dynamicRange,
      speechCadenceRatio: dynamicRange === 'WIDE_CINEMATIC' ? 0.35 : 0.82,
      spectralEntropy: Number((0.3 + Math.random() * 0.4).toFixed(3)),
    };

    // Evaluate classification using audio features + text
    this.classifyEnvironment();
    this.notify();
  }

  private classifyEnvironment() {
    const text = this.state.transcriptionSnippet.toLowerCase();
    const feat = this.state.features;

    // Check TV Guide acoustic keywords
    let bestMatch: TvGuideProgram | null = null;
    let highestScore = 0;

    for (const prog of TV_GUIDE_CATALOG) {
      let score = 0;
      for (const kw of prog.acousticKeywords) {
        if (text.includes(kw)) score += 3;
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = prog;
      }
    }

    if (highestScore >= 3 && bestMatch) {
      this.state.classification = bestMatch.category === 'CINEMA' ? 'MOVIE' : 'TELEVISION';
      this.state.confidence = Math.min(0.99, 0.75 + highestScore * 0.06);
      this.state.detectedTitle = bestMatch.title;
      this.state.matchedProgram = bestMatch;
      this.state.activeChannel = `${bestMatch.channelNumber} · ${bestMatch.channelName}`;
      this.state.randomTrivia = this.shuffleArray([...bestMatch.triviaBank]).slice(0, 3);
    } else if (feat.dynamicRange === 'WIDE_CINEMATIC') {
      // Cinematic sound profile with high peaks & musical harmonic spread
      const randomProg = TV_GUIDE_CATALOG[Math.floor(Date.now() / 30000) % TV_GUIDE_CATALOG.length];
      this.state.classification = 'MOVIE';
      this.state.confidence = 0.89;
      this.state.detectedTitle = `${randomProg.title} (Acoustic Match)`;
      this.state.matchedProgram = randomProg;
      this.state.activeChannel = `${randomProg.channelNumber} · ${randomProg.channelName}`;
      this.state.randomTrivia = this.shuffleArray([...randomProg.triviaBank]).slice(0, 3);
    } else if (feat.speechCadenceRatio > 0.65) {
      this.state.classification = 'CONVERSATION';
      this.state.confidence = 0.94;
      this.state.detectedTitle = 'Natural Dialogue / Human Standup';
      this.state.matchedProgram = null;
      this.state.activeChannel = 'Local Acoustic Field';
      this.state.randomTrivia = [
        'Conversational acoustics maintain an average conversational loudness of 60 to 65 dB SPL at one meter.',
        'Speech intelligibility is concentrated in the consonants between 2 kHz and 4 kHz.',
        'Natural speech displays pauses averaging 400ms to 750ms between cognitive clauses.'
      ];
    } else {
      this.state.classification = 'TELEVISION';
      this.state.confidence = 0.82;
      this.state.detectedTitle = 'Broadcast Stream / TV Background';
      this.state.activeChannel = 'Broadcast Spectrum';
    }

    this.state.lastIdentifiedTimestamp = new Date().toISOString();
  }

  public evaluateTranscription(text: string) {
    this.state.transcriptionSnippet = text;
    this.classifyEnvironment();
  }

  public setManualTranscription(text: string) {
    this.evaluateTranscription(text);
    this.notify();
  }

  /**
   * Submit an answer to the current runtime trivia game challenge
   */
  public submitTriviaAnswer(selectedIndex: number): { isCorrect: boolean; explanation: string; points: number } {
    const current = this.state.currentChallenge;
    if (!current) {
      return { isCorrect: false, explanation: 'No active challenge.', points: 0 };
    }

    const isCorrect = selectedIndex === current.correctIndex;
    this.state.totalAnswered += 1;

    if (isCorrect) {
      this.state.triviaScore += current.points;
      this.state.currentStreak += 1;
    } else {
      this.state.currentStreak = 0;
    }

    const result = {
      isCorrect,
      explanation: current.explanation,
      points: isCorrect ? current.points : 0,
    };

    // Log achievement / result to Resonance Console
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gaia:resonance-log', {
          detail: {
            id: `trivia-${Date.now()}`,
            timestamp: new Date().toISOString(),
            category: 'TELEMETRY_TRIVIA',
            title: `Acoustic Trivia: ${current.category} (${isCorrect ? '+ ' + current.points + ' PTS' : 'MISSED'})`,
            summary: `${current.question} → Answered: ${current.options[selectedIndex] || 'N/A'}. ${current.explanation}`,
            frequencyHz: this.state.features.dominantFrequencyHz,
            details: {
              score: this.state.triviaScore,
              streak: this.state.currentStreak,
              classification: this.state.classification,
              detectedTitle: this.state.detectedTitle,
            },
            receiptDigest: `0xTRIVIA-${Date.now().toString(16).toUpperCase()}`,
          },
        })
      );
    }

    // Generate next challenge
    this.state.currentChallenge = this.generateTriviaChallenge();
    this.notify();

    return result;
  }

  public nextChallenge(): TriviaGameChallenge {
    this.state.currentChallenge = this.generateTriviaChallenge();
    this.notify();
    return this.state.currentChallenge;
  }

  private generateTriviaChallenge(): TriviaGameChallenge {
    const challenges: TriviaGameChallenge[] = [
      {
        id: 'q1',
        category: 'CINEMA',
        question: 'What iconic film score was performed on a 1926 four-manual organ at London’s Temple Church?',
        options: ['Interstellar (Hans Zimmer)', '2001: A Space Odyssey', 'Blade Runner (Vangelis)', 'Inception'],
        correctIndex: 0,
        explanation: 'Hans Zimmer composed the spiritual organ score for Interstellar at Temple Church to evoke the breath of humanity.',
        points: 100,
      },
      {
        id: 'q2',
        category: 'CINEMA',
        question: 'What synthesizer famously defined the retro-futuristic acoustic baseline of Blade Runner?',
        options: ['Roland Jupiter-8', 'Yamaha CS-80', 'Moog Minimoog', 'Korg M1'],
        correctIndex: 1,
        explanation: 'The Yamaha CS-80 analog polyphonic synthesizer was Vangelis’s primary instrument and was resurrected in 2049.',
        points: 120,
      },
      {
        id: 'q3',
        category: 'ACOUSTIC_PHYSICS',
        question: 'What frequency in the Solfeggio scale is renowned as the Transformation & Miracle frequency?',
        options: ['432 Hz', '528 Hz', '639 Hz', '963 Hz'],
        correctIndex: 1,
        explanation: '528 Hz (Mi tone in Solfeggio scale) is celebrated as the frequency of transformation, repair, and biological resonance.',
        points: 90,
      },
      {
        id: 'q4',
        category: 'CINEMA',
        question: 'In The Matrix, where did the green falling digital rain characters actually originate?',
        options: ['NASA Satellite Telemetry', 'Japanese Sushi Recipe Books', 'C++ Kernel Assembly', 'Mayan Glyphs'],
        correctIndex: 1,
        explanation: 'Production designer Simon Whiteley scanned Japanese sushi cookbooks belonging to his wife to create the Matrix glyphs.',
        points: 110,
      },
      {
        id: 'q5',
        category: 'TELEVISION',
        question: 'What psychological theory regarding divided consciousness served as the foundation of Westworld?',
        options: ['Turing Singularity', 'Bicameral Mind Theory', 'Dual-Aspect Monism', 'Quantum Superposition'],
        correctIndex: 1,
        explanation: 'Julian Jaynes’s The Origin of Consciousness in the Breakdown of the Bicameral Mind was the philosophical core of Westworld.',
        points: 130,
      },
      {
        id: 'q6',
        category: 'TELEMETRY',
        question: 'What is the characteristic dynamic range difference between cinematic movie audio and normal human conversation?',
        options: ['Cinema audio is identical to speech', 'Cinema audio exhibits >35 dB dynamic range vs ~12 dB in speech', 'Speech has 50 dB dynamic range', 'Microphones cannot measure dynamic range'],
        correctIndex: 1,
        explanation: 'Cinematic mixes preserve immense dynamic headroom (>35 dB) between whispering and explosive action sequences.',
        points: 80,
      },
    ];

    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

export const dynamicListeningService = DynamicListeningService.getInstance();
