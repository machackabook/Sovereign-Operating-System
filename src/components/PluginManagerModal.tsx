import React, { useState, useEffect } from 'react';
import { X, Puzzle, Package, Cloud, Cpu, Play, CheckCircle2, AlertTriangle, ShieldCheck, Lock, Unlock, Terminal, HardDrive } from 'lucide-react';
import { pluginManagerService, PluginManifest } from '../services/pluginManagerService';
import { vfsPackageManager, VfsPackageManifest } from '../services/vfsPackageManager';
import { nexusColabDriveBridge, ProbeResult } from '../services/nexusColabDriveBridge';
import { modelSourceLinkRegistry, ModelSourceLinkTrigger } from '../services/modelSourceLinkRegistry';
import { googleDriveService } from '../services/googleDriveService';

interface PluginManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PluginManagerModal: React.FC<PluginManagerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'plugins' | 'packages' | 'colab' | 'triggers'>('plugins');

  // Plugins State
  const [plugins, setPlugins] = useState<PluginManifest[]>(pluginManagerService.getPlugins());

  // Package Manager State
  const [packages, setPackages] = useState<VfsPackageManifest[]>(vfsPackageManager.getPackages());
  const [lockState, setLockState] = useState(vfsPackageManager.getSystemLockState());
  const [buildingPkg, setBuildingPkg] = useState<string | null>(null);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);

  // Colab Bridge State
  const [driveStatus, setDriveStatus] = useState(googleDriveService.getStatus());
  const [probes, setProbes] = useState<ProbeResult[]>([]);
  const [probing, setProbing] = useState(false);
  const [tunnelPrompt, setTunnelPrompt] = useState('Run system quantum coherence verification');
  const [tunneling, setTunneling] = useState(false);
  const [tunnelOutput, setTunnelOutput] = useState('');

  // Model Triggers State
  const [triggers, setTriggers] = useState<ModelSourceLinkTrigger[]>(modelSourceLinkRegistry.getTriggers());
  const [runningTrigger, setRunningTrigger] = useState<string | null>(null);
  const [triggerResults, setTriggerResults] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsubPlugins = pluginManagerService.subscribe(() => {
      setPlugins(pluginManagerService.getPlugins());
    });
    const unsubPkgs = vfsPackageManager.subscribe(() => {
      setPackages(vfsPackageManager.getPackages());
      setLockState(vfsPackageManager.getSystemLockState());
    });
    const unsubDrive = googleDriveService.onStatusChange((s) => setDriveStatus(s));
    const unsubBridge = nexusColabDriveBridge.subscribe(() => {});

    return () => {
      unsubPlugins();
      unsubPkgs();
      unsubDrive();
      unsubBridge();
    };
  }, []);

  if (!isOpen) return null;

  const handleTogglePlugin = (id: string) => {
    pluginManagerService.togglePlugin(id);
  };

  const handleToggleLockState = () => {
    vfsPackageManager.setLockState(!lockState.isUnlocked);
  };

  const handleBuildPackage = async (packageName: string) => {
    setBuildingPkg(packageName);
    try {
      const res = await vfsPackageManager.buildPackage(packageName);
      setBuildLogs(res.logs);
    } catch (err: any) {
      setBuildLogs([`[ERROR] Build failed: ${err.message}`]);
    } finally {
      setBuildingPkg(null);
    }
  };

  const handleProbeDrive = async () => {
    setProbing(true);
    try {
      const res = await nexusColabDriveBridge.probeAllRegistryFiles();
      setProbes(res);
    } catch (err: any) {
      console.warn('Probe error:', err);
    } finally {
      setProbing(false);
    }
  };

  const handlePullArtifact = async (key: string) => {
    try {
      const res = await nexusColabDriveBridge.pullArtifact(key);
      alert(`Artifact '${key}' pulled cleanly to VFS!\nPath: ${res.path}\nSHA-256: ${res.sha256.slice(0, 16)}...`);
    } catch (err: any) {
      alert(`Failed to pull artifact: ${err.message}`);
    }
  };

  const handleExecuteTunnel = async () => {
    if (!tunnelPrompt.trim()) return;
    setTunneling(true);
    try {
      const res = await nexusColabDriveBridge.executeColabTunnelPrompt(tunnelPrompt);
      setTunnelOutput(res.stdout);
    } catch (err: any) {
      setTunnelOutput(`[Tunnel Error] ${err.message}`);
    } finally {
      setTunneling(false);
    }
  };

  const handleRunTrigger = async (trig: ModelSourceLinkTrigger) => {
    setRunningTrigger(trig.id);
    try {
      const res = await modelSourceLinkRegistry.invokeTrigger(trig.id);
      setTriggerResults((prev) => ({ ...prev, [trig.id]: res }));
    } catch (err: any) {
      setTriggerResults((prev) => ({ ...prev, [trig.id]: { error: err.message } }));
    } finally {
      setRunningTrigger(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl h-[85vh] flex flex-col rounded-xl border border-cyan-500/40 bg-slate-950 text-cyan-50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <Puzzle className="w-6 h-6 text-cyan-400 animate-pulse" />
            <div>
              <h2 className="text-lg font-bold tracking-wide text-cyan-300 font-mono">
                EXTENSIONS & ADD-ONS // VFS RAM-BOUND ENGINE
              </h2>
              <p className="text-xs text-slate-400">
                PWA Permission Escalation • Multi-Account Colab Drive Tunnel • Model Source Link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-cyan-500/20 bg-slate-900/40 px-6">
          <button
            onClick={() => setActiveTab('plugins')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'plugins'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Puzzle className="w-4 h-4" />
            Plugins ({plugins.length})
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'packages'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            VFS Package Pipeline
          </button>
          <button
            onClick={() => setActiveTab('colab')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'colab'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Colab Drive Tunnel
          </button>
          <button
            onClick={() => setActiveTab('triggers')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'triggers'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Model Source Links ({triggers.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans">
          {/* TAB 1: PLUGINS & ADD-ONS */}
          {activeTab === 'plugins' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-cyan-500/20 bg-slate-900/50 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-cyan-200">Extension & Add-on Capability Governance</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Plugins operate inside the RAM-bound VFS sandbox and possess escalated Web APIs permissions.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-md">
                  <ShieldCheck className="w-4 h-4" />
                  SANDBOX: UNBOUND RAM
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {plugins.map((plugin) => (
                  <div
                    key={plugin.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/70 p-4 hover:border-cyan-500/40 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">{plugin.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          v{plugin.version}
                        </span>
                        {plugin.isBuiltIn && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                            CORE SYSTEM
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{plugin.description}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {plugin.permissions.map((perm) => (
                          <span key={perm} className="text-[9px] font-mono bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800">
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={plugin.enabled}
                          onChange={() => handleTogglePlugin(plugin.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                      <span className="text-xs font-mono w-16 text-right">
                        {plugin.enabled ? <span className="text-cyan-400">ENABLED</span> : <span className="text-slate-500">DISABLED</span>}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: VFS PACKAGE PIPELINE */}
          {activeTab === 'packages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-cyan-500/20 bg-slate-900/50 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-cyan-200">RAM-Bound VFS Package Manager Pipeline</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    System Lock State: <span className="text-cyan-300 font-mono font-bold">{lockState.mode}</span>
                  </p>
                </div>
                <button
                  onClick={handleToggleLockState}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border transition ${
                    lockState.isUnlocked
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                      : 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                  }`}
                >
                  {lockState.isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {lockState.isUnlocked ? 'UNLOCKED & UNBOUND' : 'LOCKED SYSTEM'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map((pkg) => (
                  <div key={pkg.name} className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-cyan-300 font-mono">{pkg.name}</h4>
                        <p className="text-xs text-slate-400">{pkg.description}</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                        {pkg.buildStatus}
                      </span>
                    </div>

                    <div className="text-xs font-mono space-y-1 bg-slate-950 p-2.5 rounded border border-slate-800/80">
                      <div>Main Entry: {pkg.main}</div>
                      <div>RAM Alloc: ~{pkg.ramUsageEstimateKb} KB</div>
                      <div>License: {pkg.license}</div>
                    </div>

                    <button
                      onClick={() => handleBuildPackage(pkg.name)}
                      disabled={buildingPkg === pkg.name}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded border border-cyan-500/40 bg-cyan-950/40 text-xs font-mono font-semibold text-cyan-200 hover:bg-cyan-900/40 disabled:opacity-50 transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {buildingPkg === pkg.name ? 'BUILDING BUNDLE...' : 'STAGE & BUILD BUNDLE'}
                    </button>
                  </div>
                ))}
              </div>

              {buildLogs.length > 0 && (
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs space-y-1">
                  <div className="text-cyan-400 font-bold border-b border-slate-800 pb-1 mb-2">BUILD LOG OUTPUT</div>
                  {buildLogs.map((log, i) => (
                    <div key={i} className="text-slate-300">{log}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COLAB MULTI-ACCOUNT DRIVE TUNNEL */}
          {activeTab === 'colab' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-cyan-500/20 bg-slate-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-cyan-200">Google Drive SSO & Colab Tunnel Gateway</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Identity: {driveStatus.isAuthenticated ? driveStatus.userEmail : 'Not signed in'}
                    </p>
                  </div>
                  {driveStatus.isAuthenticated ? (
                    <button
                      onClick={() => googleDriveService.signOut()}
                      className="px-3 py-1.5 text-xs font-mono rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <button
                      onClick={() => googleDriveService.signInWithGoogle()}
                      className="px-3 py-1.5 text-xs font-mono rounded bg-blue-600 text-white hover:bg-blue-500 font-semibold"
                    >
                      Sign In with Google SSO
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleProbeDrive}
                    disabled={probing}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded border border-cyan-500/40 bg-cyan-950/40 text-xs font-mono font-semibold text-cyan-200 hover:bg-cyan-900/40 disabled:opacity-50 transition"
                  >
                    <HardDrive className="w-4 h-4" />
                    {probing ? 'PROBING CANONICAL REGISTRY...' : 'PROBE CANONICAL DRIVE FILE REGISTRY'}
                  </button>
                </div>
              </div>

              {probes.length > 0 && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-3">
                  <h4 className="text-xs font-bold font-mono text-cyan-300 uppercase">Canonical Drive Registry Items</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {probes.map((p) => (
                      <div key={p.key} className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono">
                        <div>
                          <div className="text-slate-200 font-bold">{p.name} ({p.key})</div>
                          <div className="text-[10px] text-slate-400">ID: {p.fileId} | Editable: {p.canEdit ? 'YES' : 'NO'}</div>
                        </div>
                        <button
                          onClick={() => handlePullArtifact(p.key)}
                          className="px-2.5 py-1 rounded border border-cyan-500/30 bg-cyan-950 text-cyan-300 hover:bg-cyan-900 text-[11px]"
                        >
                          Pull to VFS
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pipe Tunnel Prompt Execution */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-3">
                <h4 className="text-xs font-bold font-mono text-cyan-300 uppercase">Colab REST / Pipe Tunnel Output Exec</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tunnelPrompt}
                    onChange={(e) => setTunnelPrompt(e.target.value)}
                    placeholder="Enter prompt for Colab gemini-backend pipe..."
                    className="flex-1 rounded bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleExecuteTunnel}
                    disabled={tunneling}
                    className="px-4 py-2 rounded border border-cyan-500/40 bg-cyan-950 text-cyan-200 text-xs font-mono font-semibold hover:bg-cyan-900 disabled:opacity-50"
                  >
                    {tunneling ? 'TUNNELING...' : 'DISPATCH TUNNEL'}
                  </button>
                </div>

                {tunnelOutput && (
                  <pre className="p-3 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 whitespace-pre-wrap">
                    {tunnelOutput}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MODEL SOURCE LINKS */}
          {activeTab === 'triggers' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-cyan-500/20 bg-slate-900/50 p-4">
                <h3 className="text-sm font-semibold text-cyan-200">Vertical Model Capability Source Link Registry</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Interoperably binds internal system feature calls to model execution triggers.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {triggers.map((trig) => (
                  <div key={trig.id} className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-100">{trig.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {trig.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{trig.description}</p>
                      </div>
                      <button
                        onClick={() => handleRunTrigger(trig)}
                        disabled={runningTrigger === trig.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyan-500/40 bg-cyan-950 text-xs font-mono text-cyan-200 hover:bg-cyan-900 disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {runningTrigger === trig.id ? 'EXECUTING...' : 'TRIGGER NOW'}
                      </button>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400">Target: {trig.targetFunction}</div>

                    {triggerResults[trig.id] && (
                      <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 whitespace-pre-wrap">
                        {JSON.stringify(triggerResults[trig.id], null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-cyan-500/20 bg-slate-900/80 px-6 py-3 flex justify-between items-center text-xs font-mono text-slate-400">
          <div>RAM-BOUND SANDBOX: ACTIVE</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
