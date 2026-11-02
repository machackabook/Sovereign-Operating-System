/**
 * Gemini Live Service - Handles real-time voice conversations via WebSocket bridge
 */

export interface LiveMessage {
  audio?: string;
  interrupted?: boolean;
}

export class GeminiLiveService {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private nextStartTime: number = 0;
  private isConnected: boolean = false;

  private onMessageCallback: ((msg: LiveMessage) => void) | null = null;

  constructor(onMessage: (msg: LiveMessage) => void) {
    this.onMessageCallback = onMessage;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${protocol}//${window.location.host}/live`);

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.audio) {
        this.playAudioChunk(msg.audio);
      }
      if (this.onMessageCallback) {
        this.onMessageCallback(msg);
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.cleanup();
    };

    return new Promise((resolve, reject) => {
      if (!this.ws) return reject(new Error('WebSocket failed to initialize'));
      this.ws.onopen = () => {
        this.isConnected = true;
        resolve();
      };
      this.ws.onerror = (err) => reject(err);
    });
  }

  public async startMic(): Promise<void> {
    if (!this.isConnected) await this.connect();

    this.inputAudioCtx = new AudioContext({ sampleRate: 16000 });
    this.outputAudioCtx = new AudioContext({ sampleRate: 24000 });
    this.nextStartTime = this.outputAudioCtx.currentTime;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.source = this.inputAudioCtx.createMediaStreamSource(stream);
    
    // ScriptProcessor is used as per skill instructions for 16kHz capture
    this.processor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);
    
    this.source.connect(this.processor);
    this.processor.connect(this.inputAudioCtx.destination);

    this.processor.onaudioprocess = (e) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const inputData = e.inputBuffer.getChannelData(0);
        const base64 = this.pcmToBase64(inputData);
        this.ws.send(JSON.stringify({ audio: base64 }));
      }
    };
  }

  public stop(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  private cleanup(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.inputAudioCtx) {
      this.inputAudioCtx.close();
      this.inputAudioCtx = null;
    }
    if (this.outputAudioCtx) {
      this.outputAudioCtx.close();
      this.outputAudioCtx = null;
    }
  }

  private pcmToBase64(float32Array: Float32Array): string {
    const buffer = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      buffer[i] = Math.max(-1, Math.min(1, float32Array[i])) * 0x7fff;
    }
    const bytes = new Uint8Array(buffer.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private playAudioChunk(base64: string): void {
    if (!this.outputAudioCtx) return;

    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const audioBuffer = this.outputAudioCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.outputAudioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioCtx.destination);

    const startTime = Math.max(this.nextStartTime, this.outputAudioCtx.currentTime);
    source.start(startTime);
    this.nextStartTime = startTime + audioBuffer.duration;
  }
}
