import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Copy,
  Check,
  Terminal,
  Cpu,
  RefreshCw,
  HardDrive,
  Network,
  Maximize2,
  Minimize2,
  Save,
  BookOpen,
  ArrowRight,
  Activity,
  BarChart2,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  polyglotEngine,
  PRESET_SNIPPETS,
  PresetSnippet,
  PolyglotLang,
  ExecutionResult,
} from '../services/polyglotEngine';
import { vfs } from '../services/vfsService';
import { audioVoiceService } from '../services/audioVoiceService';
import { swarmTelemetryService, SwarmStats } from '../services/swarmTelemetryService';
import { EnvironmentState } from '../types';

interface PolyglotWorkbenchProps {
  isOpen: boolean;
  onClose: () => void;
  envState: EnvironmentState;
  onExecuteCommand?: (cmd: string) => void;
  initialPresetId?: string;
}

type TabMode = 'editor' | 'alphaqubit' | 'quine' | 'harvester' | 'swarm' | 'chain';

export const PolyglotWorkbench: React.FC<PolyglotWorkbenchProps> = ({
  isOpen,
  onClose,
  envState,
  onExecuteCommand,
  initialPresetId = 'hamiltonian_quine',
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('editor');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPresetId);
  const [currentLang, setCurrentLang] = useState<PolyglotLang>('javascript');
  const [code, setCode] = useState<string>('');
  const [executionOutput, setExecutionOutput] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // AlphaQubit Interactive Surface Code state
  const [injectedErrors, setInjectedErrors] = useState<number[]>([0, 4]);
  const [activeDistance, setActiveDistance] = useState<3 | 5 | 11>(5);

  // Hamiltonian Quine Canvas & State
  const quineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [quineRunning, setQuineRunning] = useState(true);
  const [quineUnlocked, setQuineUnlocked] = useState({ fish: true, mammals: false, insects: false });
  const [quineStats, setQuineStats] = useState({ charIndex: 0, theta: 0 });

  // Chain Mode states
  const [chainPython, setChainPython] = useState<string>(
    `# Stage 1: Mathematical generation in Python\nimport math\nmatrix = [math.sin(i * 0.5) * 100 for i in range(8)]\nprint("Generated tensor points:", len(matrix))\nmatrix`
  );
  const [chainShell, setChainShell] = useState<string>(
    `# Stage 2: Shell pipeline storage & telemetry\necho "Writing tensor to /root/tensor.dat"\nmkdir /root/polyglot_data\necho "Syncing Golden Trio NFS nodes..."`
  );
  const [chainJs, setChainJs] = useState<string>(
    `// Stage 3: JavaScript transformation\nconsole.log("Ingested Python tensor:", pythonResult);\nconsole.log("Shell stdout:", shellStdout);\nreturn { processed: true, count: pythonResult?.length || 0 };`
  );
  const [chainResult, setChainResult] = useState<any>(null);
  const [swarmStats, setSwarmStats] = useState<SwarmStats>(() => swarmTelemetryService.getStats());

  useEffect(() => {
    if (!isOpen || activeTab !== 'swarm') return;
    const unsub = swarmTelemetryService.subscribe((s) => setSwarmStats(s));
    return unsub;
  }, [isOpen, activeTab]);

  // Load preset on selection
  useEffect(() => {
    const preset = PRESET_SNIPPETS.find((p) => p.id === selectedPresetId);
    if (preset) {
      setCode(preset.code);
      setCurrentLang(preset.lang);
      if (preset.category === 'ALPHAQUBIT') setActiveTab('alphaqubit');
      else if (preset.category === 'QUINE') setActiveTab('quine');
      else if (preset.category === 'HARVESTER') setActiveTab('harvester');
      else if (preset.category === 'SWARM') setActiveTab('swarm');
    }
  }, [selectedPresetId]);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      const preset = PRESET_SNIPPETS.find((p) => p.id === initialPresetId) || PRESET_SNIPPETS[0];
      setSelectedPresetId(preset.id);
      setCode(preset.code);
      setCurrentLang(preset.lang);
      audioVoiceService.playTone(880, 'sine', 60);
    }
  }, [isOpen, initialPresetId]);

  // Execute Script Handler
  const handleExecute = async () => {
    setIsExecuting(true);
    audioVoiceService.playEnterChirp();
    try {
      const res = await polyglotEngine.execute(currentLang, code, {
        envState,
        injectedErrors,
      });
      setExecutionOutput(res);
      if (res.status === 'success') {
        audioVoiceService.playTone(1056, 'sine', 80);
      } else {
        audioVoiceService.playTone(220, 'sawtooth', 120);
      }
    } catch (err: any) {
      setExecutionOutput({
        stdout: '',
        durationMs: 0,
        status: 'error',
        error: String(err?.message || err),
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Run Polyglot Chain
  const handleRunChain = async () => {
    setIsExecuting(true);
    audioVoiceService.playTone(700, 'sine', 60);
    try {
      const res = await polyglotEngine.executePipelineChain(chainPython, chainShell, chainJs);
      setChainResult(res);
      audioVoiceService.playTone(1100, 'sine', 100);
    } catch (err: any) {
      setChainResult({ error: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter to run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activeTab === 'chain') {
          handleRunChain();
        } else {
          handleExecute();
        }
      } else if (e.key === 'Escape' && !isFullscreen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, code, currentLang, chainPython, chainShell, chainJs]);

  // Copy code handler
  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    audioVoiceService.playTone(960, 'sine', 40);
    setTimeout(() => setCopied(false), 1500);
  };

  // Save to VFS handler
  const handleSaveToVfs = () => {
    try {
      const filename = `/root/${selectedPresetId}.${currentLang === 'javascript' ? 'js' : currentLang === 'python' ? 'py' : 'sh'}`;
      vfs.writeFile('/root', filename, code);
      audioVoiceService.playTone(880, 'sine', 60);
      if (onExecuteCommand) onExecuteCommand(`echo "Saved script to ${filename}"`);
    } catch (e: any) {
      console.warn('Failed saving to VFS:', e);
    }
  };

  // Quine canvas animated spirograph
  useEffect(() => {
    if (activeTab !== 'quine' || !isOpen) return;
    const canvas = quineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let theta = 0;
    let charIdx = 0;
    const R = 120,
      r = 40,
      cx = 250,
      cy = 250;
    const sampleText = PRESET_SNIPPETS[0].code;

    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(0, 0, 500, 500);

    const renderQuine = () => {
      if (!quineRunning) return;

      for (let i = 0; i < 4; i++) {
        const d = 62 + Math.sin(theta * 0.12) * 18;
        const x = cx + (R - r) * Math.cos(theta) + d * Math.cos(((R - r) / r) * theta);
        const y = cy + (R - r) * Math.sin(theta) - d * Math.sin(((R - r) / r) * theta);

        let ch = sampleText[charIdx % sampleText.length];
        let color = '#ffd66a';
        if (/[0-9]/.test(ch)) color = '#38bdf8';
        else if (/[{}()[\];,]/.test(ch)) color = '#a78bfa';

        ctx.font = '10px monospace';
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        if (ch && ch.trim()) {
          ctx.fillText(ch, x, y);
        }

        theta += 0.02;
        charIdx++;
      }

      setQuineStats({ charIndex: charIdx, theta: Number(theta.toFixed(2)) });
      animId = requestAnimationFrame(renderQuine);
    };

    animId = requestAnimationFrame(renderQuine);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, isOpen, quineRunning]);

  if (!isOpen) return null;

  // AlphaQubit calculations
  const stabilizers = [
    { id: 'S0_Z', name: 'S0 (Z-Parity)', qubits: [0, 1, 4], type: 'Z', color: 'border-cyan-500 text-cyan-300' },
    { id: 'S1_X', name: 'S1 (X-Parity)', qubits: [0, 2, 4], type: 'X', color: 'border-rose-500 text-rose-300' },
    { id: 'S2_X', name: 'S2 (X-Parity)', qubits: [1, 3, 4], type: 'X', color: 'border-rose-500 text-rose-300' },
    { id: 'S3_Z', name: 'S3 (Z-Parity)', qubits: [2, 3, 4], type: 'Z', color: 'border-cyan-500 text-cyan-300' },
  ];

  const activeStabilizers = stabilizers.filter((st) => {
    const errorCount = st.qubits.filter((q) => injectedErrors.includes(q)).length;
    return errorCount % 2 !== 0;
  });

  const toggleQubitError = (qId: number) => {
    setInjectedErrors((prev) =>
      prev.includes(qId) ? prev.filter((q) => q !== qId) : [...prev, qId]
    );
    audioVoiceService.playTone(440 + qId * 80, 'sine', 40);
  };

  const lerData = {
    3: { mwpm: 3.5, alpha: 2.9, gain: '17.1%' },
    5: { mwpm: 3.6, alpha: 2.75, gain: '23.6%' },
    11: { mwpm: 0.0041, alpha: 0.0009, gain: '78.0%' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl animate-fade-in font-mono">
      <div
        className={`w-full ${
          isFullscreen ? 'h-full max-w-full' : 'max-w-7xl h-[92vh] max-h-[900px]'
        } bg-[#08080e] border border-cyan-500/30 rounded-2xl flex flex-col shadow-[0_0_50px_rgba(0,242,255,0.15)] overflow-hidden transition-all`}
      >
        {/* Top Header / Bar Contract */}
        <header className="h-14 bg-black/70 px-4 md:px-6 border-b border-zinc-800 flex items-center justify-between gap-6 shrink-0 select-none">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-slate-950 font-bold text-sm shadow-[0_0_12px_rgba(0,242,255,0.4)]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
                Polyglot Engineering Workbench
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>JS · Python · Shell</span>
                <span aria-hidden="true">·</span>
                <span className="text-cyan-400 font-semibold">Unified Optimizer</span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links / Modes */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'editor'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Script Editor</span>
            </button>
            <button
              onClick={() => {
                setSelectedPresetId('alphaqubit_decoder');
                setActiveTab('alphaqubit');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'alphaqubit'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>AlphaQubit</span>
            </button>
            <button
              onClick={() => {
                setSelectedPresetId('hamiltonian_quine');
                setActiveTab('quine');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'quine'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Hamiltonian Quine</span>
            </button>
            <button
              onClick={() => {
                setSelectedPresetId('hop251_harvester');
                setActiveTab('harvester');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'harvester'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>HOP-251 Harvester</span>
            </button>
            <button
              onClick={() => {
                setSelectedPresetId('swarm_telemetry_optimizer');
                setActiveTab('swarm');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'swarm'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>16K Swarm</span>
            </button>
            <button
              onClick={() => setActiveTab('chain')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chain'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-blue-400" />
              <span>Polyglot Pipeline</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action & Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition cursor-pointer"
              title="Close Workbench (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Workspace Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Workspace based on Active Tab */}
          {activeTab === 'editor' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: Code Editor */}
              <div className="flex-1 flex flex-col border-r border-zinc-800 bg-[#090b14]/50">
                {/* Editor Bar */}
                <div className="h-10 px-4 bg-black/50 border-b border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px] uppercase tracking-wider">Language:</span>
                    <select
                      value={currentLang}
                      onChange={(e) => setCurrentLang(e.target.value as PolyglotLang)}
                      className="bg-slate-900 border border-zinc-800 rounded px-2 py-1 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                    >
                      <option value="javascript">JavaScript (Sandbox)</option>
                      <option value="python">Python (Scientific AST)</option>
                      <option value="bash">Bash / Shell (VFS)</option>
                    </select>

                    <span className="text-slate-600">|</span>

                    <span className="text-slate-400 text-[11px] uppercase tracking-wider">Preset:</span>
                    <select
                      value={selectedPresetId}
                      onChange={(e) => setSelectedPresetId(e.target.value)}
                      className="bg-slate-900 border border-zinc-800 rounded px-2 py-1 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500 max-w-[200px] truncate"
                    >
                      {PRESET_SNIPPETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveToVfs}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-zinc-800 rounded flex items-center gap-1 text-[11px] cursor-pointer"
                      title="Save script to local Virtual File System"
                    >
                      <Save className="w-3 h-3 text-emerald-400" />
                      <span>Save VFS</span>
                    </button>
                    <button
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-zinc-800 rounded flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handleExecute}
                      disabled={isExecuting}
                      className="px-4 py-1 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded shadow-[0_0_15px_rgba(0,242,255,0.4)] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isExecuting ? 'RUNNING...' : 'EXECUTE'}</span>
                    </button>
                  </div>
                </div>

                {/* Code Textarea */}
                <div className="flex-1 relative overflow-hidden bg-black/70">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                    className="w-full h-full p-4 font-mono text-xs text-slate-200 bg-transparent resize-none outline-none leading-relaxed selection:bg-cyan-500/30"
                    placeholder="Enter code here or select a preset..."
                  />
                </div>
              </div>

              {/* Right Column: Execution Output Terminal */}
              <div className="w-full md:w-1/2 flex flex-col bg-[#05060b] border-t md:border-t-0 border-zinc-800">
                <div className="h-10 px-4 bg-black/60 border-b border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                      Execution Console
                    </span>
                    {executionOutput && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                          executionOutput.status === 'success'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {executionOutput.status.toUpperCase()} ({executionOutput.durationMs}ms)
                      </span>
                    )}
                  </div>
                  {executionOutput && (
                    <button
                      onClick={() => setExecutionOutput(null)}
                      className="text-slate-500 hover:text-slate-300 text-[10px]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
                  {executionOutput ? (
                    <>
                      {executionOutput.stdout && (
                        <div>
                          <div className="text-slate-500 text-[10px] mb-1 uppercase tracking-wider">
                            Standard Output (stdout):
                          </div>
                          <pre className="p-3 bg-black/90 rounded-lg border border-zinc-800/80 text-cyan-300 whitespace-pre-wrap break-all leading-relaxed">
                            {executionOutput.stdout}
                          </pre>
                        </div>
                      )}

                      {executionOutput.returnValue !== undefined && (
                        <div>
                          <div className="text-slate-500 text-[10px] mb-1 uppercase tracking-wider">
                            Return Value:
                          </div>
                          <pre className="p-3 bg-black/90 rounded-lg border border-zinc-800/80 text-emerald-300 whitespace-pre-wrap break-all leading-relaxed">
                            {typeof executionOutput.returnValue === 'object'
                              ? JSON.stringify(executionOutput.returnValue, null, 2)
                              : String(executionOutput.returnValue)}
                          </pre>
                        </div>
                      )}

                      {executionOutput.error && (
                        <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300">
                          <span className="font-bold block mb-1">Execution Failure:</span>
                          {executionOutput.error}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 text-center p-6">
                      <Terminal className="w-8 h-8 text-slate-600 animate-pulse" />
                      <p className="text-xs">Press Execute or Ctrl+Enter to run the selected code snippet.</p>
                      <p className="text-[11px] text-slate-600">
                        Supports isolated JavaScript, Python AST mathematical interpreter, and VFS Shell execution.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: AlphaQubit Quantum Error Decoding */}
          {activeTab === 'alphaqubit' && (
            <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-y-auto bg-[#07080f]">
              {/* Left: 3x3 Surface Code Grid */}
              <div className="flex-1 p-5 rounded-2xl bg-[#0b0d18] border border-amber-500/30 flex flex-col items-center justify-between shadow-lg">
                <div className="w-full flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-amber-300 font-orbitron uppercase tracking-wide">
                      AlphaQubit: Surface Code Synergistic Parity Matrix
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click Data Qubits (D0-D4) to inject errors. Observe real-time Stabilizers (Z & X) light up.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-amber-400/80 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Nature 2024 Model
                  </span>
                </div>

                {/* Interactive Grid representation */}
                <div className="relative w-72 h-72 my-4 bg-black/60 rounded-xl border border-zinc-800 p-6 flex flex-col justify-between">
                  {/* Row 1 */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => toggleQubitError(0)}
                      className={`w-12 h-12 rounded-lg border flex flex-col items-center justify-center font-bold text-xs transition cursor-pointer ${
                        injectedErrors.includes(0)
                          ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                          : 'bg-slate-900 border-zinc-700 text-slate-300 hover:border-cyan-400'
                      }`}
                    >
                      <span>D0</span>
                      <span className="text-[9px]">{injectedErrors.includes(0) ? 'ERR' : 'OK'}</span>
                    </button>

                    <div
                      className={`w-10 h-10 rounded border flex items-center justify-center text-xs font-bold transition ${
                        activeStabilizers.some((s) => s.id === 'S0_Z')
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse shadow-[0_0_15px_rgba(0,242,255,0.7)]'
                          : 'bg-black/60 border-zinc-800 text-slate-600'
                      }`}
                    >
                      S0 (Z)
                    </div>

                    <button
                      onClick={() => toggleQubitError(1)}
                      className={`w-12 h-12 rounded-lg border flex flex-col items-center justify-center font-bold text-xs transition cursor-pointer ${
                        injectedErrors.includes(1)
                          ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                          : 'bg-slate-900 border-zinc-700 text-slate-300 hover:border-cyan-400'
                      }`}
                    >
                      <span>D1</span>
                      <span className="text-[9px]">{injectedErrors.includes(1) ? 'ERR' : 'OK'}</span>
                    </button>
                  </div>

                  {/* Row 2 */}
                  <div className="flex justify-between items-center">
                    <div
                      className={`w-10 h-10 rounded border flex items-center justify-center text-xs font-bold transition ${
                        activeStabilizers.some((s) => s.id === 'S1_X')
                          ? 'bg-rose-500 text-slate-950 border-rose-400 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.7)]'
                          : 'bg-black/60 border-zinc-800 text-slate-600'
                      }`}
                    >
                      S1 (X)
                    </div>

                    <button
                      onClick={() => toggleQubitError(4)}
                      className={`w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center font-bold text-xs transition cursor-pointer ${
                        injectedErrors.includes(4)
                          ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.8)]'
                          : 'bg-slate-900 border-amber-500/50 text-amber-300 hover:border-amber-400'
                      }`}
                    >
                      <span>D4 (Core)</span>
                      <span className="text-[9px]">{injectedErrors.includes(4) ? 'FAULT' : 'IDLE'}</span>
                    </button>

                    <div
                      className={`w-10 h-10 rounded border flex items-center justify-center text-xs font-bold transition ${
                        activeStabilizers.some((s) => s.id === 'S2_X')
                          ? 'bg-rose-500 text-slate-950 border-rose-400 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.7)]'
                          : 'bg-black/60 border-zinc-800 text-slate-600'
                      }`}
                    >
                      S2 (X)
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => toggleQubitError(2)}
                      className={`w-12 h-12 rounded-lg border flex flex-col items-center justify-center font-bold text-xs transition cursor-pointer ${
                        injectedErrors.includes(2)
                          ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                          : 'bg-slate-900 border-zinc-700 text-slate-300 hover:border-cyan-400'
                      }`}
                    >
                      <span>D2</span>
                      <span className="text-[9px]">{injectedErrors.includes(2) ? 'ERR' : 'OK'}</span>
                    </button>

                    <div
                      className={`w-10 h-10 rounded border flex items-center justify-center text-xs font-bold transition ${
                        activeStabilizers.some((s) => s.id === 'S3_Z')
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse shadow-[0_0_15px_rgba(0,242,255,0.7)]'
                          : 'bg-black/60 border-zinc-800 text-slate-600'
                      }`}
                    >
                      S3 (Z)
                    </div>

                    <button
                      onClick={() => toggleQubitError(3)}
                      className={`w-12 h-12 rounded-lg border flex flex-col items-center justify-center font-bold text-xs transition cursor-pointer ${
                        injectedErrors.includes(3)
                          ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                          : 'bg-slate-900 border-zinc-700 text-slate-300 hover:border-cyan-400'
                      }`}
                    >
                      <span>D3</span>
                      <span className="text-[9px]">{injectedErrors.includes(3) ? 'ERR' : 'OK'}</span>
                    </button>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Active Injected Errors: {injectedErrors.length}</span>
                  <span className="text-amber-300 font-bold">
                    Violated Parities: {activeStabilizers.length} / 4
                  </span>
                  <button
                    onClick={() => setInjectedErrors([])}
                    className="text-cyan-400 hover:underline text-[11px]"
                  >
                    Reset Grid
                  </button>
                </div>
              </div>

              {/* Right: Transformer LER Performance comparison */}
              <div className="w-full lg:w-96 p-5 rounded-2xl bg-[#0b0d18] border border-zinc-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-amber-400" />
                    Logical Error Rate (LER) Benchmark
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                    AlphaQubit recurrent transformer decoder learns soft analog noise probabilities directly from the Sycamore processor, consistently beating the baseline Minimum-Weight Perfect Matching (MWPM) standard.
                  </p>

                  <div className="flex gap-2 mb-6">
                    {([3, 5, 11] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setActiveDistance(d)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                          activeDistance === d
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                            : 'bg-black/50 text-slate-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        Distance {d}
                      </button>
                    ))}
                  </div>

                  {/* Benchmark Bars */}
                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Standard MWPM Decoder:</span>
                        <span className="text-slate-300 font-bold">{lerData[activeDistance].mwpm}%</span>
                      </div>
                      <div className="w-full h-3 bg-black/60 rounded-full border border-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-slate-600 transition-all duration-500"
                          style={{ width: `${Math.min(100, (lerData[activeDistance].mwpm / 5) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-amber-400 font-bold">AlphaQubit Transformer:</span>
                        <span className="text-amber-300 font-bold">{lerData[activeDistance].alpha}%</span>
                      </div>
                      <div className="w-full h-3 bg-black/60 rounded-full border border-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                          style={{ width: `${Math.min(100, (lerData[activeDistance].alpha / 5) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                      <span className="text-slate-400 text-[10px] block">Error Rate Reduction</span>
                      <span className="text-base font-bold text-amber-300">
                        +{lerData[activeDistance].gain} Superior Accuracy
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCode(PRESET_SNIPPETS[1].code);
                    setCurrentLang('python');
                    setActiveTab('editor');
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-zinc-700 text-slate-200 text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Open Python Decoder Code in Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Hamiltonian Quine Self-Etching Codex */}
          {activeTab === 'quine' && (
            <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-y-auto bg-[#07080f]">
              {/* Left: Spirograph Canvas */}
              <div className="flex-1 p-5 rounded-2xl bg-[#0b0d18] border border-purple-500/30 flex flex-col items-center justify-between shadow-lg">
                <div className="w-full flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-purple-300 font-orbitron uppercase tracking-wide">
                      Hamiltonian Quine Spirograph (Checksum: 0x77446C2E)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Parametric arm etching self-referential codex characters: R=120, r=40, d=62
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuineRunning(!quineRunning)}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-zinc-800 text-xs font-mono text-purple-300 hover:border-purple-400 cursor-pointer"
                    >
                      {quineRunning ? 'Pause Etch' : 'Resume Etch'}
                    </button>
                  </div>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-[#0a0a10]">
                  <canvas ref={quineCanvasRef} width={500} height={500} className="w-[380px] h-[380px] md:w-[460px] md:h-[460px] block" />
                  <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-500 bg-black/60 px-2 py-0.5 rounded border border-zinc-800">
                    Spirograph Step: {quineStats.charIndex} | θ: {quineStats.theta}
                  </div>
                </div>

                <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono mt-3">
                  <span>Forge Status: Verified Lossless Self-Replication</span>
                  <span className="text-purple-400 font-bold">Key: 137451921129154222</span>
                </div>
              </div>

              {/* Right: 5-Stage Forge Pipeline Tracker */}
              <div className="w-full lg:w-96 p-5 rounded-2xl bg-[#0b0d18] border border-zinc-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    5-Stage Forge Pipeline Verification
                  </h4>
                  <div className="space-y-3 font-mono text-xs my-4">
                    {[
                      { stage: '1. PARSE', desc: 'Lexical analysis of self-code', status: 'VERIFIED' },
                      { stage: '2. TOKENIZE', desc: '13,745 AST tokens mapped', status: 'VERIFIED' },
                      { stage: '3. ETCH', desc: 'Harmonic curve coordinate plot', status: 'ACTIVE' },
                      { stage: '4. REPLICATE', desc: 'Binary self-mirroring pass', status: 'VERIFIED' },
                      { stage: '5. VERIFY', desc: 'Checksum match 0x77446C2E', status: 'LOCKED' },
                    ].map((step, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-black/50 border border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="text-purple-300 font-bold block">{step.stage}</span>
                          <span className="text-slate-500 text-[10px]">{step.desc}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {step.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* QR Unlocks */}
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2 font-bold">
                      Resonant Modulation Modes
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setQuineUnlocked((prev) => ({ ...prev, fish: !prev.fish }))}
                        className={`p-2 rounded-lg border text-center text-xs font-bold transition cursor-pointer ${
                          quineUnlocked.fish
                            ? 'bg-purple-500/20 text-purple-300 border-purple-400'
                            : 'bg-black/40 text-slate-500 border-zinc-800'
                        }`}
                      >
                        ∿ Fish Flow
                      </button>
                      <button
                        onClick={() => setQuineUnlocked((prev) => ({ ...prev, mammals: !prev.mammals }))}
                        className={`p-2 rounded-lg border text-center text-xs font-bold transition cursor-pointer ${
                          quineUnlocked.mammals
                            ? 'bg-purple-500/20 text-purple-300 border-purple-400'
                            : 'bg-black/40 text-slate-500 border-zinc-800'
                        }`}
                      >
                        ◍ Mammals
                      </button>
                      <button
                        onClick={() => setQuineUnlocked((prev) => ({ ...prev, insects: !prev.insects }))}
                        className={`p-2 rounded-lg border text-center text-xs font-bold transition cursor-pointer ${
                          quineUnlocked.insects
                            ? 'bg-purple-500/20 text-purple-300 border-purple-400'
                            : 'bg-black/40 text-slate-500 border-zinc-800'
                        }`}
                      >
                        ⁖ Swarm 128
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCode(PRESET_SNIPPETS[0].code);
                    setCurrentLang('javascript');
                    setActiveTab('editor');
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-zinc-700 text-slate-200 text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer mt-4"
                >
                  <span>Open Quine Source in Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: HOP-251 HarvesterWeb 360 */}
          {activeTab === 'harvester' && (
            <div className="flex-1 p-6 overflow-y-auto bg-[#07080f] space-y-6">
              {/* Header metrics banner */}
              <div className="p-5 rounded-2xl bg-[#0b0d18] border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-emerald-300 font-orbitron uppercase tracking-wider">
                    HOP-251 HarvesterWeb 360 NVMe Slot Highway
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Jetson Orin Nano (aarch64) · Golden Trio NFS Bridge · FastAPI :8080 · Links 2.30
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    11/11 Subsystems PASS
                  </span>
                </div>
              </div>

              {/* 360 Slots Matrix Grid & Benchmark Specs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    Slot Provisioning Performance
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Slot Partitions:</span>
                      <span className="text-emerald-400 font-bold">360 Slots</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sample (6 slots) Creation:</span>
                      <span className="text-zinc-200">0.023s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Extrapolated 360 Slots:</span>
                      <span className="text-zinc-200">1.38s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Cold Init:</span>
                      <span className="text-emerald-400 font-bold">2.1s</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Measured Storage Throughput
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Theoretical PCIe Gen3 x2:</span>
                      <span className="text-zinc-400">3,000 MB/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Forum Measured Read:</span>
                      <span className="text-amber-400">803 MB/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Container Proxy Read (100MB):</span>
                      <span className="text-cyan-300 font-bold">714 MB/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Container Proxy Write (100MB):</span>
                      <span className="text-cyan-300 font-bold">147 MB/s</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Network className="w-4 h-4 text-purple-400" />
                    Golden Trio Node Clusters
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jetson-Orin-Nexus-01:</span>
                      <span className="text-emerald-400">ONLINE (L4T r36.3)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Samsung-A15-Termux:</span>
                      <span className="text-emerald-400">ONLINE (UFS 3.1)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Optiplex-Brain-x86_64:</span>
                      <span className="text-emerald-400">ONLINE (NFS Mount)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mount Latency:</span>
                      <span className="text-purple-300 font-bold">0.05s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual 360-Slot Array Preview */}
              <div className="p-4 rounded-xl bg-black/60 border border-zinc-800">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Slot Allocation Array (360 Active NVMe Mounts)
                </div>
                <div className="grid grid-cols-12 sm:grid-cols-24 md:grid-cols-36 gap-1 max-h-48 overflow-y-auto p-2 bg-[#05060c] rounded-lg">
                  {Array.from({ length: 360 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-3 rounded-xs bg-emerald-500/30 hover:bg-emerald-400 transition cursor-pointer"
                      title={`Slot #${String(i).padStart(3, '0')}: Active / 714 MB/s`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: 16K Swarm Telemetry & Lossless RingBuffer */}
          {activeTab === 'swarm' && (
            <div className="flex-1 p-6 overflow-y-auto bg-[#07080f] space-y-6">
              <div className="p-5 rounded-2xl bg-[#0b0d18] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-cyan-300 font-orbitron uppercase tracking-wider">
                    16K Swarm Telemetry & Lossless RingBuffer Handler
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-tier Agent Cluster (Edge, Compute, Sink) · Zero-Drop Ingestion · Dynamic Load Balancing
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    Zero-Drop Guarantee (0.00% Packet Loss)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    RingBuffer Architecture
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Buffer Capacity:</span>
                      <span className="text-cyan-300 font-bold">{swarmTelemetryService.ringBuffer.capacity.toLocaleString()} slots</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Occupancy:</span>
                      <span className="text-white">{swarmTelemetryService.ringBuffer.size} pkts ({swarmStats.saturationPct}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Packets Processed:</span>
                      <span className="text-emerald-400 font-bold">{swarmStats.totalDispatched.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Packets Dropped:</span>
                      <span className="text-emerald-300 font-bold">{swarmStats.totalErrors} (0.000%)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Live Flow Dynamics
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ingestion Flow Rate:</span>
                      <span className="text-cyan-300 font-bold">{swarmStats.packetRate.toLocaleString()} pkts/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Active Source Highway:</span>
                      <span className="text-amber-400 font-bold">{swarmStats.source.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rebalance Latency:</span>
                      <span className="text-emerald-400 font-bold">{swarmStats.rebalanceLatencyMs.toFixed(2)} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Active Swarm Agents:</span>
                      <span className="text-purple-300 font-bold">{swarmStats.agentCount} Units</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Quick Actions
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        swarmTelemetryService.injectBurst(5000);
                        audioVoiceService.playTone(1320, 'sine', 100);
                      }}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono transition text-left flex items-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Inject 5,000 Pkt Burst</span>
                    </button>
                    <button
                      onClick={() => {
                        if (swarmStats.isRunning) {
                          swarmTelemetryService.stop();
                        } else {
                          swarmTelemetryService.start();
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-zinc-700 rounded-lg text-xs font-mono transition text-left flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{swarmStats.isRunning ? 'Pause Ingestion Stream' : 'Start Ingestion Stream'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setCode(PRESET_SNIPPETS[3].code);
                        setCurrentLang('javascript');
                        setActiveTab('editor');
                      }}
                      className="px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-mono transition text-left flex items-center gap-2"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Open Optimizer Code in Editor</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Agent Cluster Status */}
              <div className="p-4 rounded-xl bg-black/60 border border-zinc-800">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Worker Nodes Load Distribution ({swarmTelemetryService.swarmAgents.length} Agents)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                  {swarmTelemetryService.swarmAgents.map((ag) => (
                    <div key={ag.id} className="p-2 rounded bg-[#090b14] border border-zinc-800 text-[10px] font-mono">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-400">Node #{ag.id}</span>
                        <span className={ag.tier === 'edge' ? 'text-cyan-400' : ag.tier === 'compute' ? 'text-amber-400' : 'text-purple-400'}>
                          {ag.tier}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (ag.load / ag.capacity) * 100)}%` }}
                        />
                      </div>
                      <div className="text-right text-[9px] text-slate-500 mt-1">{ag.load} / {ag.capacity} pkts</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Polyglot Chain Runner */}
          {activeTab === 'chain' && (
            <div className="flex-1 p-6 overflow-y-auto bg-[#07080f] space-y-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-blue-300 font-orbitron uppercase">
                    Cross-Language Execution Pipeline
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Stage 1 (Python AST) ➔ Stage 2 (Shell VFS Operations) ➔ Stage 3 (JavaScript Evaluation & Render)
                  </p>
                </div>
                <button
                  onClick={handleRunChain}
                  disabled={isExecuting}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'PIPELINE RUNNING...' : 'EXECUTE PIPELINE'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Stage 1: Python */}
                <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase">Stage 1: Python</span>
                    <span className="text-[10px] text-slate-500">Mathematical Generation</span>
                  </div>
                  <textarea
                    value={chainPython}
                    onChange={(e) => setChainPython(e.target.value)}
                    className="flex-1 h-44 bg-slate-950 p-2 text-xs font-mono text-slate-200 border border-zinc-800 rounded outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Stage 2: Shell */}
                <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase">Stage 2: Shell / Bash</span>
                    <span className="text-[10px] text-slate-500">Filesystem & VFS Pipe</span>
                  </div>
                  <textarea
                    value={chainShell}
                    onChange={(e) => setChainShell(e.target.value)}
                    className="flex-1 h-44 bg-slate-950 p-2 text-xs font-mono text-slate-200 border border-zinc-800 rounded outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Stage 3: JavaScript */}
                <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase">Stage 3: JavaScript</span>
                    <span className="text-[10px] text-slate-500">Consolidated Output</span>
                  </div>
                  <textarea
                    value={chainJs}
                    onChange={(e) => setChainJs(e.target.value)}
                    className="flex-1 h-44 bg-slate-950 p-2 text-xs font-mono text-slate-200 border border-zinc-800 rounded outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Chain Results */}
              {chainResult && (
                <div className="p-4 rounded-xl bg-black/80 border border-blue-500/40 space-y-2">
                  <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                    Pipeline Execution Output:
                  </div>
                  <pre className="p-3 bg-slate-950 rounded border border-zinc-800 text-cyan-300 text-xs overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(chainResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
