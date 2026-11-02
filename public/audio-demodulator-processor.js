/**
 * AudioDemodulatorProcessor - Web Audio Worklet
 *
 * Ingests raw byte streams (Float32Array, Int16Array, Uint8Array, or ArrayBuffers)
 * from the SDR demodulator bridge, buffers them in a low-latency circular ring buffer,
 * applies DC blocking and anti-pop smoothing, and outputs pristine audible PCM frames
 * to the AudioContext destination for real-time radio playback within the browser.
 */

class AudioDemodulatorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // 16,384 sample ring buffer (~340ms at 48kHz for jitter/burst protection)
    this.bufferSize = 16384;
    this.buffer = new Float32Array(this.bufferSize);
    this.writePtr = 0;
    this.readPtr = 0;
    this.gain = 1.0;
    this.isMuted = false;

    // DC Blocking Filter state (eliminates RF offset drift)
    this.dcPrevIn = 0;
    this.dcPrevOut = 0;
    this.dcAlpha = 0.995;

    // Anti-pop / underrun smoothing state
    this.lastSample = 0;

    // Handle messages sent from SdrDemodulatorBridge or audio worker nodes
    this.port.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;

      if (msg.command === 'reset' || msg === 'clear') {
        this.resetBuffer();
        return;
      }

      if (msg.command === 'gain' && typeof msg.value === 'number') {
        this.gain = Math.max(0, Math.min(2.0, msg.value));
        return;
      }

      if (msg.command === 'mute') {
        this.isMuted = Boolean(msg.value);
        return;
      }

      // Convert raw incoming byte or typed array stream into normalized float PCM samples (-1.0 to +1.0)
      let pcmData = null;

      if (msg instanceof Float32Array) {
        pcmData = msg;
      } else if (msg instanceof Int16Array) {
        // Convert 16-bit signed PCM raw bytes to float
        pcmData = new Float32Array(msg.length);
        for (let i = 0; i < msg.length; i++) {
          pcmData[i] = msg[i] / 32768.0;
        }
      } else if (msg instanceof Uint8Array) {
        // Convert 8-bit unsigned PCM or demodulated byte stream to float
        pcmData = new Float32Array(msg.length);
        for (let i = 0; i < msg.length; i++) {
          pcmData[i] = (msg[i] - 128) / 128.0;
        }
      } else if (msg instanceof Int8Array) {
        // Convert 8-bit signed PCM
        pcmData = new Float32Array(msg.length);
        for (let i = 0; i < msg.length; i++) {
          pcmData[i] = msg[i] / 128.0;
        }
      } else if (msg instanceof ArrayBuffer) {
        // Default ArrayBuffer as Float32Array
        pcmData = new Float32Array(msg);
      } else if (msg.data && (msg.data instanceof Float32Array || msg.data instanceof Uint8Array || msg.data instanceof Int16Array)) {
        // Object format { data: TypedArray }
        return this.port.onmessage({ data: msg.data });
      }

      if (pcmData && pcmData.length > 0) {
        this.writePcmStream(pcmData);
      }
    };
  }

  resetBuffer() {
    this.buffer.fill(0);
    this.writePtr = 0;
    this.readPtr = 0;
    this.dcPrevIn = 0;
    this.dcPrevOut = 0;
    this.lastSample = 0;
  }

  writePcmStream(pcmData) {
    for (let i = 0; i < pcmData.length; i++) {
      let rawSample = pcmData[i];

      // DC Removal Filter (High Pass at ~5Hz): y[n] = x[n] - x[n-1] + R * y[n-1]
      const dcFiltered = rawSample - this.dcPrevIn + this.dcAlpha * this.dcPrevOut;
      this.dcPrevIn = rawSample;
      this.dcPrevOut = dcFiltered;

      // Apply current gain & soft clamp limiter
      const clamped = Math.max(-1.0, Math.min(1.0, dcFiltered * this.gain));

      this.buffer[this.writePtr] = clamped;
      this.writePtr = (this.writePtr + 1) % this.bufferSize;

      // Handle buffer overflow (advance read pointer if caught up)
      if (this.writePtr === this.readPtr) {
        this.readPtr = (this.readPtr + 1) % this.bufferSize;
      }
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    const numChannels = output.length;
    const numSamples = output[0].length;

    if (this.isMuted) {
      for (let c = 0; c < numChannels; c++) {
        output[c].fill(0);
      }
      return true;
    }

    for (let i = 0; i < numSamples; i++) {
      let sample = 0;

      if (this.readPtr !== this.writePtr) {
        sample = this.buffer[this.readPtr];
        this.readPtr = (this.readPtr + 1) % this.bufferSize;
        this.lastSample = sample;
      } else {
        // Buffer underrun: smooth fade to zero using exponential decay to prevent clicks/pops
        this.lastSample *= 0.85;
        sample = this.lastSample;
      }

      // Copy sample across all available output channels (Mono -> Stereo/Multi-channel)
      for (let c = 0; c < numChannels; c++) {
        output[c][i] = sample;
      }
    }

    return true;
  }
}

registerProcessor('audio-demodulator-processor', AudioDemodulatorProcessor);
