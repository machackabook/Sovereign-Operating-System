import asyncio
import json
import websockets
from rtlsdr import RtlSdr
import numpy as np

# RTL-SDR Configuration
CENTER_FREQ = 91.5e6  # FM Band
SAMPLE_RATE = 1.024e6 
AUDIO_RATE = 48000
DECIMATION = int(SAMPLE_RATE / AUDIO_RATE)

async def demodulate_fm(samples):
    # Basic FM demodulation: phase angle difference
    angles = np.angle(samples[1:] * np.conj(samples[:-1]))
    # Decimate
    return angles[::DECIMATION].astype(np.float32).tobytes()

async def sdr_handler(websocket, path):
    print("SDR Stream Client Connected")
    sdr = RtlSdr()
    sdr.sample_rate = SAMPLE_RATE
    sdr.center_freq = CENTER_FREQ
    sdr.gain = 'auto'

    try:
        while True:
            samples = sdr.read_samples(256 * 1024)
            audio_data = await demodulate_fm(samples)
            await websocket.send(audio_data)
    except Exception as e:
        print(f"Stream error: {e}")
    finally:
        sdr.close()

async def main():
    server = await websockets.serve(sdr_handler, "localhost", 8765)
    print("SDR Gateway running on ws://localhost:8765")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
