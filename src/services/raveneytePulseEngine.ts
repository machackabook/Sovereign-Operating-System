/**
 * RavenEyeTE Telemetry Core & NextBenchUp Pulse Engine
 * Integrates high-precision pulse timing, OpenWrt gateway telemetry,
 * Planetarium Pluto Return orbit calculations, and Agent Auto-Enhancement.
 */

import { vfs } from './vfsService';

export interface PulsePayload {
  tick: number;
  cycle: number;
  phase: number;
  timestamp: number;
  gateway_data?: string;
  pluto_orbit_phase?: number;
  agent_status?: string;
}

export class RavenEyeTE {
  private stream: PulsePayload[] = [];
  private maxLen = 4096;

  public ingest(data: PulsePayload) {
    const entry = { ...data, timestamp: data.timestamp || Date.now() / 1000 };
    this.stream.push(entry);
    if (this.stream.length > this.maxLen) {
      this.stream.shift();
    }
  }

  public snapshot(): PulsePayload[] {
    return [...this.stream];
  }

  public getLatest(): PulsePayload | null {
    return this.stream.length > 0 ? this.stream[this.stream.length - 1] : null;
  }
}

export const RAVENEYTE = new RavenEyeTE();

export type PulseHook = (pulse: PulsePayload) => void;

export class NextBenchUpPulse {
  public bpm: number;
  public subdivision: number;
  private intervalMs: number;
  private running: boolean = false;
  private tick: number = 0;
  private startTime: number = 0;
  private hooks: PulseHook[] = [];
  private timerId: any = null;

  constructor(bpm = 96, subdivision = 4) {
    this.bpm = bpm;
    this.subdivision = subdivision;
    this.intervalMs = (60.0 / (bpm * subdivision)) * 1000;
  }

  public addHook(fn: PulseHook) {
    this.hooks.push(fn);
  }

  public start() {
    if (this.running) return;
    this.running = true;
    this.startTime = performance.now();
    this.tick = 0;
    this._run();
  }

  public stop() {
    this.running = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public isRunning(): boolean {
    return this.running;
  }

  private _emit(now: number) {
    const pulse: PulsePayload = {
      tick: this.tick,
      cycle: Math.floor(this.tick / this.subdivision),
      phase: (this.tick % this.subdivision) / this.subdivision,
      timestamp: now / 1000,
    };

    for (const hook of this.hooks) {
      try {
        hook(pulse);
      } catch (err) {
        console.error('[NextBenchUpPulse hook-error]', err);
      }
    }

    this.tick++;
  }

  private _run() {
    if (!this.running) return;
    const now = performance.now();
    this._emit(now);

    const nextTick = this.startTime + this.tick * this.intervalMs;
    const delay = Math.max(1, nextTick - performance.now());
    this.timerId = setTimeout(() => this._run(), delay);
  }
}

export async function fetchGatewayTelemetry(): Promise<{ gateway_data: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);
    const res = await fetch('http://192.168.1.1/cgi-bin/luci/status', {
      signal: controller.signal,
      mode: 'cors',
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (res && res.ok) {
      const text = await res.text();
      return { gateway_data: text.slice(0, 256) };
    }
    return { gateway_data: 'offline' };
  } catch {
    return { gateway_data: 'offline' };
  }
}

export function planetariumRender(pulse: PulsePayload): { pluto_orbit_phase: number; symbol: string } {
  const orbit_phase = (pulse.cycle % 248) / 248;
  const symbol = pulse.phase < 0.5 ? '●' : '○';
  return { pluto_orbit_phase: orbit_phase, symbol };
}

export function agentAutoEnhance(pulse: PulsePayload): string {
  if (pulse.phase === 0) {
    return '[AGENT] recalibrating systems';
  } else if (pulse.phase > 0.75) {
    return '[AGENT] predictive expansion';
  }
  return '[AGENT] steady state';
}

export function pushToUrl(endpoint: string, payload: any) {
  try {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    // Silently continue
  }
}

// Synaptic Master Hook
export function raveneyteHook(pulse: PulsePayload) {
  RAVENEYTE.ingest(pulse);

  const pluto = planetariumRender(pulse);
  const agentStatus = agentAutoEnhance(pulse);

  const combined: PulsePayload = {
    ...pulse,
    gateway_data: 'online (synaptic-bridge)',
    pluto_orbit_phase: pluto.pluto_orbit_phase,
    agent_status: agentStatus,
  };

  RAVENEYTE.ingest(combined);
  pushToUrl('http://127.0.0.1:8080/pulse', combined);
}

class RavenEyeEngineService {
  private pulseEngine: NextBenchUpPulse = new NextBenchUpPulse(96, 4);
  private initialized = false;

  constructor() {
    this.writePythonScriptToVfs();
    this.pulseEngine.addHook(raveneyteHook);
    this.pulseEngine.start();
  }

  public writePythonScriptToVfs() {
    const code = `#!/usr/bin/env python3
import time
import threading
import json
import socket
import urllib.request
from collections import deque

class RavenEyeTE:
    def __init__(self):
        self.stream = deque(maxlen=4096)

    def ingest(self, data):
        data["raveneyte_ts"] = time.time()
        self.stream.append(data)

    def snapshot(self):
        return list(self.stream)

RAVENEYTE = RavenEyeTE()

class NextBenchUpPulse:
    def __init__(self, bpm=120, subdivision=4):
        self.bpm = bpm
        self.subdivision = subdivision
        self.interval = 60.0 / (bpm * subdivision)
        self.running = False
        self.tick = 0
        self.start_time = None
        self.hooks = []

    def add_hook(self, fn):
        self.hooks.append(fn)

    def start(self):
        self.running = True
        self.start_time = time.perf_counter()
        threading.Thread(target=self._run, daemon=True).start()

    def stop(self):
        self.running = False

    def _emit(self, now):
        pulse = {
            "tick": self.tick,
            "cycle": self.tick // self.subdivision,
            "phase": (self.tick % self.subdivision) / self.subdivision,
            "timestamp": now
        }
        for hook in self.hooks:
            try:
                hook(pulse)
            except Exception as e:
                print(f"[hook-error] {e}")
        self.tick += 1

    def _run(self):
        next_tick = self.start_time
        while self.running:
            now = time.perf_counter()
            if now >= next_tick:
                self._emit(now)
                next_tick = self.start_time + self.tick * self.interval
            time.sleep(0.0005)

def fetch_gateway_telemetry():
    try:
        url = "http://192.168.1.1/cgi-bin/luci/status"
        with urllib.request.urlopen(url, timeout=1) as res:
            return {"gateway_data": res.read(256).decode(errors="ignore")}
    except:
        return {"gateway_data": "offline"}

def push_to_url(endpoint, payload):
    try:
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req, timeout=1)
    except:
        pass

def planetarium_render(pulse):
    orbit_phase = (pulse["cycle"] % 248) / 248
    symbol = "●" if pulse["phase"] < 0.5 else "○"
    print(f"[PLUTO] {symbol} orbit_phase={orbit_phase:.3f} tick={pulse['tick']}")

def agent_auto_enhance(pulse):
    if pulse["phase"] == 0:
        print("[AGENT] recalibrating systems")
    elif pulse["phase"] > 0.75:
        print("[AGENT] predictive expansion")

function raveneyte_hook(pulse):
    RAVENEYTE.ingest(pulse)
    gateway = fetch_gateway_telemetry()
    combined = {**pulse, **gateway}
    RAVENEYTE.ingest(combined)
    planetarium_render(combined)
    agent_auto_enhance(combined)
    push_to_url("http://127.0.0.1:8080/pulse", combined)

if __name__ == "__main__":
    pulse = NextBenchUpPulse(bpm=96, subdivision=4)
    pulse.add_hook(raveneyte_hook)
    pulse.start()
    print("[RavenEyeTE / NextBenchUpPulse Engine Booted OK]")
`;
    try {
      vfs.mkdir('/root', 'scripts');
      vfs.writeFile('/root', 'scripts/raveneyte_pulse_engine.py', code);
    } catch {
      // VFS directory handle
    }
  }

  public getPulseEngine(): NextBenchUpPulse {
    return this.pulseEngine;
  }

  public getTelemetry(): RavenEyeTE {
    return RAVENEYTE;
  }
}

export const ravenEyeEngineService = new RavenEyeEngineService();
