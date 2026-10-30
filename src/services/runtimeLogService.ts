export interface RuntimeLogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: string;
}

class RuntimeLogService {
  private logs: RuntimeLogEntry[] = [];
  private listeners: ((logs: RuntimeLogEntry[]) => void)[] = [];

  public log(level: 'info' | 'warn' | 'error', message: string, source: string) {
    const entry: RuntimeLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      level,
      message,
      source
    };
    this.logs = [entry, ...this.logs].slice(0, 100);
    this.listeners.forEach(l => l(this.logs));
  }

  public getLogs() {
    return this.logs;
  }

  public subscribe(listener: (logs: RuntimeLogEntry[]) => void) {
    this.listeners.push(listener);
    listener(this.logs);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const runtimeLogService = new RuntimeLogService();
