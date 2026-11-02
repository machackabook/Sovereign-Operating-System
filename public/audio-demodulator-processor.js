class AudioDemodulatorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Circular buffer for low-latency audio ingestion
    this.buffer = new Float32Array(4096);
    this.writePtr = 0;
    this.readPtr = 0;
    this.bufferSize = 4096;

    this.port.onmessage = (e) => {
      // Received raw PCM float32 samples from Bridge
      const samples = e.data;
      for (let i = 0; i < samples.length; i++) {
        this.buffer[this.writePtr] = samples[i];
        this.writePtr = (this.writePtr + 1) % this.bufferSize;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channel = output[0]; // Assuming mono output

    for (let i = 0; i < channel.length; i++) {
      if (this.readPtr !== this.writePtr) {
        channel[i] = this.buffer[this.readPtr];
        this.readPtr = (this.readPtr + 1) % this.bufferSize;
      } else {
        channel[i] = 0; // Buffer underrun protection
      }
    }
    return true;
  }
}

registerProcessor('audio-demodulator-processor', AudioDemodulatorProcessor);
