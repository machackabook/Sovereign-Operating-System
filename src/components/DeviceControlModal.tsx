import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  X,
  Zap,
  Lock,
  Unlock,
  Battery,
  BatteryCharging,
  Wifi,
  Cpu,
  Monitor,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Terminal,
  Volume2,
  Play,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  Eye,
  Keyboard,
  Bell,
  RefreshCw,
  Camera,
  Mic,
  Bluetooth,
  Usb,
  Radio,
  Compass,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Award,
} from 'lucide-react';
import {
  DeviceCapabilityTelemetry,
  TextFragmentMatch,
  BrowserExecutionResult,
  A11yNavigationState,
} from '../types';
import { browserControl } from '../services/browserControlService';
import { audioVoiceService } from '../services/audioVoiceService';
import { voiceAuthGateService } from '../services/voiceAuthGateService';
import { SdrDemodulatorBridge } from './SdrDemodulatorBridge';
import {
  wirelessBeaconBridge,
  BleCatalogEntry,
  WifiCarrierChannel,
  AdbDeviceBusNode,
  AdbShellExecutionResult,
} from '../services/wirelessBeaconBridge';

interface DeviceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunInTerminal?: (cmd: string) => void;
}

type TabType =
  | 'permissions'
  | 'recommendations'
  | 'sdr'
  | 'wireless'
  | 'adb'
  | 'fragment'
  | 'execution'
  | 'a11y'
  | 'gemini-assist';

export const DeviceControlModal: React.FC<DeviceControlModalProps> = ({
  isOpen,
  onClose,
  onRunInTerminal,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('permissions');
  const [telemetry, setTelemetry] = useState<DeviceCapabilityTelemetry | null>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);

  // Text Fragment State
  const [fragmentInput, setFragmentInput] = useState('');
  const [activeMatches, setActiveMatches] = useState<TextFragmentMatch[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(-1);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Live Browser Execution State
  const [codeSnippet, setCodeSnippet] = useState('document.title');
  const [execResult, setExecResult] = useState<BrowserExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Accessibility State
  const [a11yState, setA11yState] = useState<A11yNavigationState | null>(null);
  const [announceInput, setAnnounceInput] = useState('');
  const [isAssertive, setIsAssertive] = useState(false);

  // Gemini Assist State
  const [assistPrompt, setAssistPrompt] = useState('highlight singularity in terminal');
  const [assistOutput, setAssistOutput] = useState<string | null>(null);
  const [isProcessingAssist, setIsProcessingAssist] = useState(false);

  // Wireless & BLE Catalog State
  const [bleCatalog, setBleCatalog] = useState<BleCatalogEntry[]>([]);
  const [wifiChannels, setWifiChannels] = useState<WifiCarrierChannel[]>([]);
  const [isBleScanning, setIsBleScanning] = useState(false);
  const [blePairMsg, setBlePairMsg] = useState('');

  // ADB Bus State
  const [adbDevices, setAdbDevices] = useState<AdbDeviceBusNode[]>([]);
  const [adbCmdInput, setAdbCmdInput] = useState('adb devices');
  const [adbLog, setAdbLog] = useState<AdbShellExecutionResult[]>([]);
  const [isAdbRunning, setIsAdbRunning] = useState(false);
  const [adbStatusMsg, setAdbStatusMsg] = useState('');

  // Refresh Telemetry
  const refreshTelemetry = async () => {
    setIsLoadingTelemetry(true);
    const data = await browserControl.getDeviceTelemetry();
    setTelemetry(data);
    setA11yState(browserControl.getA11yNavigationState());
    setActiveMatches(browserControl.getActiveFragmentMatches());
    setCurrentMatchIdx(browserControl.getCurrentFragmentIndex());
    setIsLoadingTelemetry(false);
  };

  useEffect(() => {
    if (isOpen) {
      refreshTelemetry();
      audioVoiceService.playTone(960, 'sine', 70);

      const unsubBle = wirelessBeaconBridge.subscribeBleCatalog(setBleCatalog);
      const unsubWifi = wirelessBeaconBridge.subscribeWifiChannels(setWifiChannels);
      const unsubAdb = wirelessBeaconBridge.subscribeAdbDevices(setAdbDevices);
      setAdbLog(wirelessBeaconBridge.getAdbHistory());

      return () => {
        unsubBle();
        unsubWifi();
        unsubAdb();
      };
    }
  }, [isOpen]);

  const [isGrantingAll, setIsGrantingAll] = useState(false);
  const [grantSummary, setGrantSummary] = useState<string | null>(null);

  if (!isOpen) return null;

  // Universal Grant All Permissions Handler
  const handleGrantAllPermissions = async () => {
    setIsGrantingAll(true);
    setGrantSummary('Requesting native browser permissions for Microphone, Camera, Notifications, Geolocation, WakeLock, MIDI...');
    audioVoiceService.playEnterChirp();
    try {
      const { results, telemetry: updatedTelemetry } = await browserControl.requestAllPermissions();
      setTelemetry(updatedTelemetry);
      audioVoiceService.playTone(880, 'sine', 150);
      setGrantSummary(`Permissions processed! Mic: ${results.microphone || 'ok'}, Cam: ${results.camera || 'ok'}, Notifications: ${results.notifications || 'ok'}, Geo: ${results.geolocation || 'ok'}, WakeLock: ${results.screenWakeLock || 'ok'}, Sovereign Matrix: ${results.sovereignMatrixAuth || 'unlocked'}.`);
    } catch (err: any) {
      setGrantSummary(`Permission request encounter: ${err?.message || err}`);
    } finally {
      setIsGrantingAll(false);
      await refreshTelemetry();
    }
  };

  const handlePairUsb = async () => {
    audioVoiceService.playTone(660, 'sine', 60);
    const res = await browserControl.requestUsbDevice();
    alert(res.message);
    await refreshTelemetry();
  };

  const handleScanBluetooth = async () => {
    audioVoiceService.playTone(740, 'sine', 60);
    const res = await browserControl.requestBluetoothDevice();
    alert(res.message);
    await refreshTelemetry();
  };

  const handleOpenSerial = async () => {
    audioVoiceService.playTone(820, 'sine', 60);
    const res = await browserControl.requestSerialPort();
    alert(res.message);
    await refreshTelemetry();
  };

  const handlePairHid = async () => {
    audioVoiceService.playTone(550, 'sine', 60);
    const res = await browserControl.requestHidDevice();
    alert(res.message);
    await refreshTelemetry();
  };

  // Handlers for Wake Lock
  const handleToggleWakeLock = async () => {
    audioVoiceService.playEnterChirp();
    if (browserControl.isWakeLockActive()) {
      await browserControl.releaseScreenWakeLock();
    } else {
      await browserControl.requestScreenWakeLock();
    }
    await refreshTelemetry();
  };

  // Handlers for Notifications
  const handleTestNotification = async () => {
    audioVoiceService.playTone(1200, 'sine', 90);
    const ok = await browserControl.dispatchNotification('⚡ HyperTerminal Polyglot Quine OS', {
      body: 'Authorized browser device control active. Screen wake lock & neural sync engaged.',
    });
    if (!ok) {
      alert('Notification permission not granted. Request permission in browser settings.');
    }
    await refreshTelemetry();
  };

  // Handlers for Haptics
  const handleTestVibration = () => {
    audioVoiceService.playTone(440, 'triangle', 80);
    const ok = browserControl.vibrate([60, 40, 60]);
    if (!ok) {
      browserControl.announceToScreenReader('Haptic vibration not supported on this platform.');
    }
  };

  // Handlers for Text Fragment
  const handleSearchFragment = (phrase?: string) => {
    const target = phrase || fragmentInput;
    if (!target) return;
    audioVoiceService.playEnterChirp();
    const matches = browserControl.highlightTextFragment(target, { scroll: true, announce: true });
    setActiveMatches(matches);
    setCurrentMatchIdx(matches.length > 0 ? 0 : -1);
  };

  const handleNextFragment = () => {
    audioVoiceService.playTone(700, 'sine', 40);
    browserControl.nextFragment();
    setCurrentMatchIdx(browserControl.getCurrentFragmentIndex());
  };

  const handlePrevFragment = () => {
    audioVoiceService.playTone(600, 'sine', 40);
    browserControl.prevFragment();
    setCurrentMatchIdx(browserControl.getCurrentFragmentIndex());
  };

  const handleClearFragments = () => {
    audioVoiceService.playTone(300, 'sine', 50);
    browserControl.clearTextFragments();
    setActiveMatches([]);
    setCurrentMatchIdx(-1);
  };

  const handleCopyFragmentUrl = async () => {
    if (!fragmentInput) return;
    const url = browserControl.generateFragmentUrl(fragmentInput);
    const ok = await browserControl.copyToClipboard(url);
    if (ok) {
      audioVoiceService.playTone(880, 'sine', 50);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // Handlers for Live Browser Execution
  const handleExecuteBrowserCode = async () => {
    if (!codeSnippet.trim()) return;
    setIsExecuting(true);
    audioVoiceService.playEnterChirp();
    const res = await browserControl.executeBrowserCode(codeSnippet);
    setExecResult(res);
    setIsExecuting(false);
  };

  // Handlers for Accessibility Navigation
  const handleA11yTabNext = () => {
    audioVoiceService.playTone(650, 'sine', 40);
    browserControl.focusNextA11yElement();
    setA11yState(browserControl.getA11yNavigationState());
  };

  const handleA11yTabPrev = () => {
    audioVoiceService.playTone(550, 'sine', 40);
    browserControl.focusPrevA11yElement();
    setA11yState(browserControl.getA11yNavigationState());
  };

  const handleSendA11yAnnouncement = () => {
    if (!announceInput.trim()) return;
    audioVoiceService.playTone(880, 'sine', 60);
    browserControl.announceToScreenReader(announceInput, isAssertive);
    setAnnounceInput('');
    setA11yState(browserControl.getA11yNavigationState());
  };

  // Handlers for Gemini Device Assistance
  const handleRunAssistIntent = async (override?: string) => {
    const text = override || assistPrompt;
    if (!text.trim()) return;
    setIsProcessingAssist(true);
    audioVoiceService.playEnterChirp();
    const res = await browserControl.executeDeviceAssistIntent(text);
    setAssistOutput(res.reply);
    setIsProcessingAssist(false);
    await refreshTelemetry();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-control-title"
    >
      <div className="device-control-panel relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#050b14]/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden font-mono text-slate-200">
        {/* Holographic Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/30 bg-slate-900/60 select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="device-control-title" className="text-sm font-bold tracking-wider text-cyan-300">
                  DEVICE CONTROL &amp; ACCESSIBILITY SUBSYSTEM
                </h2>
                <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded-full">
                  SOVEREIGN HOST
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Live Browser Execution</span>
                <span>•</span>
                <span>W3C Text Fragments (:~:text=)</span>
                <span>•</span>
                <span>ChromeVox ARIA Live</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshTelemetry}
              disabled={isLoadingTelemetry}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-950 hover:text-cyan-300 text-slate-400 border border-slate-700/50 transition-all cursor-pointer"
              title="Refresh Device Telemetry"
              aria-label="Refresh Device Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingTelemetry ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-700/50 transition-all cursor-pointer"
              title="Close Panel (Escape)"
              aria-label="Close Device Control Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Telemetry Bar */}
        {telemetry && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 text-[10.5px]">
            <div className="flex items-center gap-2">
              {telemetry.battery ? (
                <>
                  {telemetry.battery.charging ? (
                    <BatteryCharging className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Battery className="w-4 h-4 text-cyan-400" />
                  )}
                  <span>
                    BATTERY: <span className="text-cyan-300 font-bold">{telemetry.battery.level}%</span>
                  </span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-400">POWER: AC MAINS</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Lock className={`w-4 h-4 ${telemetry.wakeLockActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>
                WAKE LOCK:{' '}
                <span className={telemetry.wakeLockActive ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                  {telemetry.wakeLockActive ? 'ACTIVE' : 'IDLE'}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-fuchsia-400" />
              <span>
                CORES: <span className="text-fuchsia-300 font-bold">{telemetry.hardware.logicalCores}</span>
                {telemetry.hardware.deviceMemoryGb && (
                  <span className="text-slate-400"> ({telemetry.hardware.deviceMemoryGb}GB)</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <span>
                DISPLAY:{' '}
                <span className="text-slate-300">
                  {telemetry.screen.width}x{telemetry.screen.height}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="truncate">
                AI:{' '}
                <span className="text-emerald-300 font-semibold">
                  {telemetry.onDeviceAI.modelAvailable ? 'NANO ACTIVE' : 'HYBRID'}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-900/40 overflow-x-auto select-none">
          <button
            onClick={() => {
              setActiveTab('permissions');
              audioVoiceService.playTone(500, 'sine', 30);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-[#050b14] border-cyan-500/50 text-cyan-300 shadow-[0_-4px_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Device Permissions</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('recommendations');
              audioVoiceService.playTone(520, 'sine', 30);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'recommendations'
                ? 'bg-[#050b14] border-cyan-500/50 text-cyan-300 shadow-[0_-4px_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Recommendations &amp; Audit</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('sdr');
              audioVoiceService.playTone(530, 'sine', 30);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'sdr'
                ? 'bg-[#050b14] border-cyan-500/50 text-cyan-300 shadow-[0_-4px_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>SDR FM Tuner</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('wireless');
              audioVoiceService.playTone(540, 'sine', 30);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'wireless'
                ? 'bg-[#050b14] border-cyan-500/50 text-cyan-300 shadow-[0_-4px_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span>Wireless &amp; BLE Matrix</span>
            <span className="px-1.5 py-0.2 text-[9px] bg-cyan-900 text-cyan-200 rounded-full font-bold">
              {bleCatalog.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('adb');
              audioVoiceService.playTone(550, 'sine', 30);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'adb'
                ? 'bg-[#050b14] border-cyan-500/50 text-cyan-300 shadow-[0_-4px_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Usb className="w-3.5 h-3.5 text-cyan-400" />
            <span>ADB Bus &amp; Hub</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('fragment');
              audioVoiceService.playTone(550, 'sine', 30);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'fragment'
                ? 'bg-[#050b14] border-cyan-500/50 text-cyan-300 shadow-[0_-4px_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Text Fragments (:~:text=)</span>
            {activeMatches.length > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] bg-cyan-900 text-cyan-200 rounded-full font-bold">
                {activeMatches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('execution');
              audioVoiceService.playTone(600, 'sine', 30);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'execution'
                ? 'bg-[#050b14] border-cyan-500/50 text-cyan-300 shadow-[0_-4px_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live Browser Execution</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('a11y');
              audioVoiceService.playTone(650, 'sine', 30);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'a11y'
                ? 'bg-[#050b14] border-cyan-500/50 text-cyan-300 shadow-[0_-4px_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Accessibility &amp; ChromeVox</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('gemini-assist');
              audioVoiceService.playTone(700, 'sine', 30);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'gemini-assist'
                ? 'bg-[#050b14] border-cyan-500/50 text-cyan-300 shadow-[0_-4px_12px_rgba(6,182,212,0.2)]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>On-Device Gemini Assist</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[60vh]">
          {/* TAB 1: PERMISSIONS & HARDWARE */}
          {activeTab === 'permissions' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
                <div>
                  <h3 className="text-xs font-bold text-cyan-300 tracking-wider">
                    AUTHORIZED DEVICE PERMISSIONS &amp; HARDWARE CONTROL
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Direct access to native user device APIs, hardware bridges, and sovereign authorization gates.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGrantAllPermissions}
                    disabled={isGrantingAll}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isGrantingAll ? 'animate-spin' : ''}`} />
                    <span>{isGrantingAll ? 'GRANTING PERMISSIONS...' : '⚡ GRANT ALL PERMISSIONS'}</span>
                  </button>

                  <button
                    onClick={handleToggleWakeLock}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                      browserControl.isWakeLockActive()
                        ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-800/80 hover:bg-slate-700 border-slate-600 text-slate-300'
                    }`}
                  >
                    {browserControl.isWakeLockActive() ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Release Wake Lock</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Keep Screen Awake</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {grantSummary && (
                <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                  <span className="flex-1">{grantSummary}</span>
                  <button onClick={() => setGrantSummary(null)} className="text-cyan-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {telemetry && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Permission: Microphone */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-bold text-slate-300">Microphone Audio</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.permissions.microphone === 'granted'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {telemetry.permissions.microphone}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Real-time audio input for border waveform oscilloscope and voice recognition.
                    </p>
                  </div>

                  {/* Permission: Camera */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-bold text-slate-300">Camera Video</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.permissions.camera === 'granted'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {telemetry.permissions.camera}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Biometric optical verification, QR parsing, and edge camera feed ingestion.
                    </p>
                  </div>

                  {/* Permission: Notifications */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-slate-300">System Notifications</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.permissions.notifications === 'granted'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {telemetry.permissions.notifications}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Background operational alerts and Gemini completion broadcasts.
                    </p>
                  </div>

                  {/* Permission: Screen Wake Lock */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-slate-300">Screen Wake Lock</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.wakeLockActive
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {telemetry.wakeLockActive ? 'LOCKED' : 'AVAILABLE'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Prevents display sleep during long neural generation or quine execution.
                    </p>
                  </div>

                  {/* Permission: Geolocation */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-300">Geolocation (TerraSphere)</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.permissions.geolocation === 'granted'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {telemetry.permissions.geolocation}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Local terrestrial positioning for orbital Earth NASA camera and geosync.
                    </p>
                  </div>

                  {/* Permission: Clipboard Read/Write */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-bold text-slate-300">Clipboard Read/Write</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.permissions.clipboardWrite === 'granted'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {telemetry.permissions.clipboardWrite}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Enables copying text fragments, quine standalone HTML, and logs to clipboard.
                    </p>
                  </div>

                  {/* WebUSB / ADB Bridge */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Usb className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-bold text-slate-300">WebUSB / ADB Bridge</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.permissions.usb !== 'unsupported'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {telemetry.permissions.usb}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Direct browser connection to Android ADB debug bridges, hardware dongles, &amp; FPGAs.
                    </p>
                  </div>

                  {/* Web Bluetooth / BLE */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bluetooth className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-bold text-slate-300">Web Bluetooth / BLE</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.permissions.bluetooth !== 'unsupported'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {telemetry.permissions.bluetooth}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      HCI socket listening, low-energy beacon RSSI tracking, and AirCast proximity.
                    </p>
                  </div>

                  {/* Web Serial / RTL-SDR */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-bold text-slate-300">Web Serial / RTL-SDR</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.permissions.serial !== 'unsupported'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {telemetry.permissions.serial}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Direct serial streaming for SDR wideband FM (Part 15.239) and microcontroller UART.
                    </p>
                  </div>

                  {/* WebHID Peripherals */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Keyboard className="w-3.5 h-3.5 text-fuchsia-400" />
                        <span className="text-xs font-bold text-slate-300">WebHID Peripherals</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.permissions.hid !== 'unsupported'
                            ? 'bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {telemetry.permissions.hid}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Human interface device control for macro pads, game controllers, and hardware keys.
                    </p>
                  </div>

                  {/* Web MIDI Controller */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-slate-300">Web MIDI Controller</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          telemetry.permissions.midi === 'granted'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : telemetry.permissions.midi !== 'unsupported'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {telemetry.permissions.midi}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Synthesizer control, Solfeggio 963 harmonic keyboard modulation, &amp; SysEx.
                    </p>
                  </div>

                  {/* Sovereign Root VFS Authorization */}
                  <div className="p-3 bg-cyan-950/30 border border-cyan-500/40 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-cyan-300" />
                        <span className="text-xs font-bold text-cyan-200">Sovereign Matrix Auth</span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        OPERATOR ROOT
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Unrestricted access to all 9 kernel editions, /docs/protected, and hot-swap sectors.
                    </p>
                  </div>
                </div>
              )}

              {/* Hardware Quick Action Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={handleGrantAllPermissions}
                  disabled={isGrantingAll}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                >
                  <Zap className="w-3.5 h-3.5 text-slate-950" />
                  <span>Grant All Permissions</span>
                </button>

                <button
                  onClick={handlePairUsb}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700/80 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Usb className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Pair WebUSB (ADB)</span>
                </button>

                <button
                  onClick={handleScanBluetooth}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700/80 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Bluetooth className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Scan Web Bluetooth</span>
                </button>

                <button
                  onClick={handleOpenSerial}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700/80 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open Web Serial (RTL-SDR)</span>
                </button>

                <button
                  onClick={handlePairHid}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700/80 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Pair WebHID Device</span>
                </button>

                <button
                  onClick={handleTestNotification}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700/80 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Dispatch Test Notification</span>
                </button>

                <button
                  onClick={handleTestVibration}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700/80 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Trigger Haptic Vibration</span>
                </button>

                <button
                  onClick={() => browserControl.toggleFullscreen()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700/80 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Toggle Fullscreen</span>
                </button>

                <button
                  onClick={async () => {
                    const t = await browserControl.getDeviceTelemetry();
                    await browserControl.copyToClipboard(JSON.stringify(t, null, 2));
                    audioVoiceService.playTone(880, 'sine', 50);
                    alert('Copied Device Telemetry JSON to clipboard!');
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700/80 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Telemetry JSON</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SOVEREIGN RECOMMENDATIONS & ARCHITECTURAL AUDIT */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-amber-300 tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>SOVEREIGN RECOMMENDATIONS &amp; ACCESS AUDIT</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Architectural and browser-level recommendations for unrestricted device autonomy across Chromium, Android PWA, and iOS.
                  </p>
                </div>
                <button
                  onClick={handleGrantAllPermissions}
                  disabled={isGrantingAll}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Grant All</span>
                </button>
              </div>

              {/* Recommendations Card List */}
              <div className="space-y-3">
                {browserControl.getPermissionRecommendations().map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 hover:border-cyan-500/40 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                          {rec.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-200">{rec.title}</h4>
                      </div>
                      <span
                        className={`self-start sm:self-auto px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          rec.status === 'optimal'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : rec.status === 'recommended'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : rec.status === 'action_required'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {rec.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">{rec.description}</p>

                    <div className="flex items-center gap-2 pt-1">
                      {rec.command && (
                        <button
                          onClick={() => {
                            if (onRunInTerminal) onRunInTerminal(rec.command!);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-[10.5px] font-mono bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Terminal className="w-3 h-3 text-cyan-400" />
                          <span>Run '{rec.command}'</span>
                        </button>
                      )}
                      {rec.actionLabel && !rec.command && (
                        <button
                          onClick={handleGrantAllPermissions}
                          className="px-2.5 py-1 text-[10.5px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-all cursor-pointer"
                        >
                          <span>{rec.actionLabel}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Browser Configuration Cheat Sheet */}
              <div className="p-3 bg-slate-950/90 border border-amber-500/30 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>CHROMIUM FLAG CONFIGURATION CHEAT SHEET</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-300 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">1.</span>
                    <span>Enter <code className="text-amber-200 bg-black/40 px-1 py-0.5 rounded">chrome://flags</code> into your Chromium browser address bar.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">2.</span>
                    <span>Search for <code className="text-cyan-200 bg-black/40 px-1 py-0.5 rounded">#enable-experimental-web-platform-features</code> and set to <strong>Enabled</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">3.</span>
                    <span>Search for <code className="text-cyan-200 bg-black/40 px-1 py-0.5 rounded">#enable-webusb-on-any-page</code> and set to <strong>Enabled</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">4.</span>
                    <span>Relaunch browser. All WebUSB (ADB), WebBluetooth, and WebSerial APIs will execute with zero origin isolation barriers.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SDR FM DEMODULATOR & TUNER */}
          {activeTab === 'sdr' && (
            <div className="space-y-4 animate-in fade-in">
              <SdrDemodulatorBridge />
            </div>
          )}

          {/* TAB: WIRELESS BEACON & BLE CATALOG */}
          {activeTab === 'wireless' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Header & BLE Scan Action */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-cyan-300 tracking-wider flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-cyan-400" />
                    <span>SOVEREIGN WIRELESS BEACON &amp; BLUETOOTH MATRIX</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    FCC Part 15 signal discovery, BLE peripheral cataloging, multiplexed virtual AP beacons, and multi-AP Wi-Fi bonding.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      setIsBleScanning(true);
                      setBlePairMsg('Prompting Bluetooth pairing dialog...');
                      audioVoiceService.playEnterChirp();
                      const res = await wirelessBeaconBridge.scanAndConnectBluetooth();
                      setIsBleScanning(false);
                      setBlePairMsg(res.message);
                    }}
                    disabled={isBleScanning}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    <Bluetooth className="w-3.5 h-3.5" />
                    <span>{isBleScanning ? 'Scanning...' : 'Pair &amp; Catalog BLE Device'}</span>
                  </button>
                </div>
              </div>

              {blePairMsg && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-cyan-800/40 text-xs text-cyan-300 font-mono">
                  {blePairMsg}
                </div>
              )}

              {/* Discovered BLE Peripherals Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>DISCOVERED &amp; CATALOGED BLE PERIPHERALS ({bleCatalog.length})</span>
                  <span className="text-[10px] text-slate-500">Live RSSI &amp; GATT Telemetry</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300 font-mono">
                    <thead className="bg-slate-950/80 text-[10px] text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Peripheral Name</th>
                        <th className="p-2.5">Device ID</th>
                        <th className="p-2.5">RSSI</th>
                        <th className="p-2.5">Battery</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {bleCatalog.map((dev) => (
                        <tr key={dev.id} className="hover:bg-cyan-950/20 transition">
                          <td className="p-2.5 font-bold text-cyan-300 flex items-center gap-2">
                            <Bluetooth className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{dev.name}</span>
                          </td>
                          <td className="p-2.5 text-[10.5px] text-slate-400 truncate max-w-[140px]">{dev.id}</td>
                          <td className="p-2.5">
                            <span className={`font-bold ${dev.rssi > -60 ? 'text-emerald-400' : dev.rssi > -75 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {dev.rssi} dBm
                            </span>
                          </td>
                          <td className="p-2.5">
                            {dev.batteryLevel !== undefined ? (
                              <span className="text-emerald-300 font-semibold">{dev.batteryLevel}%</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="p-2.5 text-[10px]">
                            {dev.isSimulated ? (
                              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">SYNTHETIC</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">HARDWARE</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                dev.connected
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {dev.connected ? 'PAIRED' : 'DISCOVERED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Multiplexed Wireless Beacon & Multi-AP Aggregator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Multiplexed Virtual AP Beacon Generator */}
                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 uppercase">802.11 MULTIPLEXED BEACON GENERATOR</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      ACTIVE (100 TU)
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">PRIMARY SSID:</span>
                      <span className="font-bold text-cyan-300">GAIA_SOVEREIGN_MESH_AP</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">CARRIER MODULATION:</span>
                      <span className="font-bold text-amber-300">OFDM (2.4 GHz CH 6)</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">TX POWER:</span>
                      <span className="font-bold text-slate-300">+18 dBm (FCC Part 15.247)</span>
                    </div>
                  </div>
                  <div className="text-[10.5px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono">
                    <div className="text-slate-500 mb-1">Synthesized 802.11 Beacon Frame (Hex):</div>
                    <div className="break-all text-cyan-400">
                      80000000FFFFFFFFFFFF02005E7B060002005E7B06000000640031040016474149415F534F5645524549474E5F4D4553485F4150
                    </div>
                  </div>
                </div>

                {/* Multi-AP Bonding & Internet Aggregation */}
                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 uppercase">MULTI-AP WI-FI BONDING ENGINE</span>
                    <span className="text-[10px] text-cyan-400 font-bold">CARRIER AGGREGATION</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Accept multiple wireless access points and tethered devices into a unified bonded sovereign data pipe.
                  </p>
                  <div className="space-y-2">
                    {wifiChannels.slice(0, 3).map((ch) => (
                      <div
                        key={ch.bssid}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{ch.ssid}</div>
                          <div className="text-[10px] text-slate-500">
                            CH {ch.channel} ({ch.band}) • {ch.rssiDbm} dBm • SINR {ch.sinrDb} dB
                          </div>
                        </div>
                        <button
                          onClick={() => wirelessBeaconBridge.toggleApBonding(ch.bssid)}
                          className={`px-2.5 py-1 rounded text-[10.5px] font-bold transition ${
                            ch.bonded
                              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {ch.bonded ? 'BONDED' : 'BOND AP'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ADB BUS & DEVICE HUB */}
          {activeTab === 'adb' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-cyan-300 tracking-wider flex items-center gap-2">
                    <Usb className="w-4 h-4 text-cyan-400" />
                    <span>BIDIRECTIONAL ADB BUS &amp; HARDWARE HUB BRIDGE</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Direct WebUSB Android Debug Bridge connection, USB endpoint topology tree, and reverse socket forwarding.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setAdbStatusMsg('Opening WebUSB device selector for Android device...');
                    audioVoiceService.playEnterChirp();
                    const res = await wirelessBeaconBridge.connectAdbUsb();
                    setAdbStatusMsg(res.message);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Usb className="w-3.5 h-3.5 text-slate-950" />
                  <span>Connect WebUSB ADB Device</span>
                </button>
              </div>

              {adbStatusMsg && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-800/40 text-xs text-emerald-300 font-mono">
                  {adbStatusMsg}
                </div>
              )}

              {/* Connected ADB Device Bus Nodes */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase">CONNECTED USB BUS HARDWARE TOPOLOGY</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {adbDevices.map((dev, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300">{dev.productName}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          BUS {dev.busId} : PORT {dev.portId}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                        <div>Vendor ID: <span className="text-slate-200">{dev.vendorId}</span></div>
                        <div>Product ID: <span className="text-slate-200">{dev.productId}</span></div>
                        <div>Manufacturer: <span className="text-slate-200">{dev.manufacturer}</span></div>
                        <div>Serial: <span className="text-slate-200">{dev.serialNumber || 'N/A'}</span></div>
                      </div>
                      <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5 flex items-center justify-between">
                        <span>Endpoints: {dev.interfaces[0]?.endpoints.length || 2} Bulk Bi-dir</span>
                        <span className="text-cyan-400">REVERSE TETHER READY</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick ADB Shell Runner */}
              <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-200 uppercase">BIDIRECTIONAL ADB COMMAND RUNNER</span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 font-mono">
                    <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={adbCmdInput}
                      onChange={(e) => setAdbCmdInput(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          setIsAdbRunning(true);
                          audioVoiceService.playTone(740, 'triangle', 40);
                          const res = await wirelessBeaconBridge.executeAdbCommand(adbCmdInput);
                          setAdbLog((prev) => [res, ...prev.slice(0, 20)]);
                          setIsAdbRunning(false);
                        }
                      }}
                      placeholder="e.g. adb devices, adb shell ip a, adb reverse tcp:8080 tcp:8080..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-cyan-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      setIsAdbRunning(true);
                      audioVoiceService.playTone(740, 'triangle', 40);
                      const res = await wirelessBeaconBridge.executeAdbCommand(adbCmdInput);
                      setAdbLog((prev) => [res, ...prev.slice(0, 20)]);
                      setIsAdbRunning(false);
                    }}
                    disabled={isAdbRunning}
                    className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    <span>EXECUTE</span>
                  </button>
                </div>

                {/* Preset Fast Actions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['adb devices', 'adb shell getprop ro.product.model', 'adb shell ip a', 'adb shell dumpsys battery', 'adb reverse tcp:8080 tcp:8080', 'adb shell logcat'].map((cmd) => (
                    <button
                      key={cmd}
                      onClick={async () => {
                        setAdbCmdInput(cmd);
                        setIsAdbRunning(true);
                        audioVoiceService.playTone(740, 'triangle', 40);
                        const res = await wirelessBeaconBridge.executeAdbCommand(cmd);
                        setAdbLog((prev) => [res, ...prev.slice(0, 20)]);
                        setIsAdbRunning(false);
                      }}
                      className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-[10.5px] font-mono text-slate-300 rounded border border-slate-800 transition cursor-pointer"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>

                {/* ADB Execution Output Console */}
                <div className="mt-2 p-3 bg-black/90 border border-slate-800 rounded-xl font-mono text-xs max-h-48 overflow-y-auto space-y-2">
                  {adbLog.length > 0 ? (
                    adbLog.map((entry, idx) => (
                      <div key={idx} className="border-b border-slate-800/60 pb-2 last:border-b-0 last:pb-0">
                        <div className="text-[10px] text-cyan-400 flex items-center justify-between">
                          <span>$ {entry.command}</span>
                          <span className="text-slate-500">{entry.timestamp}</span>
                        </div>
                        <pre className="text-slate-300 whitespace-pre-wrap text-[11px] mt-1">{entry.output}</pre>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-600 text-center py-4">Run an ADB command or click a preset to inspect bus output...</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEXT FRAGMENTS (:~:text=) */}
          {activeTab === 'fragment' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-cyan-300 tracking-wider">
                  W3C SCROLL-TO-TEXT FRAGMENT ENGINE (`:~:text=`)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Target, highlight, and anchor exact phrases in the terminal, VFS documents, and DOM with smooth viewport auto-centering and accessibility announcements.
                </p>
              </div>

              {/* Fragment Input Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={fragmentInput}
                    onChange={(e) => setFragmentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchFragment();
                    }}
                    placeholder="Enter text fragment to highlight (e.g. Polymorphic, singularity, 963)..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-cyan-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <button
                  onClick={() => handleSearchFragment()}
                  className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Highlight &amp; Anchor</span>
                </button>

                {activeMatches.length > 0 && (
                  <button
                    onClick={handleClearFragments}
                    className="p-2 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl transition-all cursor-pointer"
                    title="Clear Fragment Highlights"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sample Quick Fragment Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-500">Quick Anchors:</span>
                {['Polymorphic', 'Singularity', '963 Hz', 'Satcom', 'VFS', 'Torus Knot'].map((pill) => (
                  <button
                    key={pill}
                    onClick={() => {
                      setFragmentInput(pill);
                      handleSearchFragment(pill);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all"
                  >
                    "{pill}"
                  </button>
                ))}
              </div>

              {/* Results & Navigation Controls */}
              {activeMatches.length > 0 ? (
                <div className="p-4 bg-slate-900/70 border border-cyan-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded-full">
                        MATCH {currentMatchIdx + 1} OF {activeMatches.length}
                      </span>
                      <span className="text-xs text-slate-300">
                        Active Fragment: <strong className="text-cyan-400">"{activeMatches[0].text}"</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handlePrevFragment}
                        className="p-1 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 cursor-pointer"
                        title="Previous Match"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextFragment}
                        className="p-1 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 cursor-pointer"
                        title="Next Match"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Canonical Fragment URL preview */}
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                    <div className="truncate text-slate-400 font-mono">
                      <span className="text-cyan-400">W3C URL: </span>
                      <span>{activeMatches[0].fragmentUrl}</span>
                    </div>
                    <button
                      onClick={handleCopyFragmentUrl}
                      className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  </div>

                  {/* Match Snippets */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {activeMatches.slice(0, 5).map((m, idx) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          browserControl.jumpToMatch(idx);
                          setCurrentMatchIdx(idx);
                        }}
                        className={`w-full text-left p-2 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                          currentMatchIdx === idx
                            ? 'bg-cyan-950/60 border-cyan-400/80 text-cyan-200'
                            : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-cyan-500 font-bold mr-2">#{idx + 1}</span>
                        <span>...{m.fullSnippet}...</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
                  <Search className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No active text fragment highlighted.</p>
                  <p className="text-[10.5px] text-slate-500">
                    Type a query above or run <code className="text-cyan-400">fragment search &lt;text&gt;</code> in the terminal.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE BROWSER EXECUTION */}
          {activeTab === 'execution' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-cyan-300 tracking-wider">
                  LIVE BROWSER JAVASCRIPT &amp; DOM EXECUTION RUNTIME
                </h3>
                <p className="text-[11px] text-slate-400">
                  Safely execute browser expressions, inspect live window state, read local storage, and dispatch DOM events with microsecond precision.
                </p>
              </div>

              {/* Code Snippet Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">JavaScript Expression or Script:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Snippets:</span>
                    {[
                      { label: 'Title', code: 'document.title' },
                      { label: 'Screen', code: 'window.innerWidth + "x" + window.innerHeight' },
                      { label: 'UserAgent', code: 'navigator.userAgent' },
                      { label: 'Storage', code: 'Object.keys(localStorage)' },
                      { label: 'Marks', code: '$$(".os-text-fragment-highlight").length' },
                    ].map((snip) => (
                      <button
                        key={snip.label}
                        onClick={() => setCodeSnippet(snip.code)}
                        className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-cyan-300 border border-slate-800 cursor-pointer"
                      >
                        {snip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        handleExecuteBrowserCode();
                      }
                    }}
                    rows={4}
                    className="w-full p-3 bg-slate-950 font-mono text-xs text-cyan-300 border border-cyan-500/40 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    placeholder="Enter JavaScript expression (e.g. document.title, location.href, performance.now())..."
                  />
                  <div className="absolute right-3 bottom-3 text-[10px] text-slate-500 select-none">
                    Ctrl + Enter to Run
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={handleExecuteBrowserCode}
                    disabled={isExecuting}
                    className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isExecuting ? 'Executing...' : 'Run in Browser Context'}</span>
                  </button>

                  {onRunInTerminal && (
                    <button
                      onClick={() => {
                        onRunInTerminal(`browser exec ${codeSnippet}`);
                        onClose();
                      }}
                      className="text-xs text-slate-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      Send to Terminal Console
                    </button>
                  )}
                </div>
              </div>

              {/* Execution Result Log */}
              {execResult && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-mono">
                  <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Execution Result:</span>
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                          execResult.error ? 'bg-rose-950 text-rose-300' : 'bg-cyan-950 text-cyan-300'
                        }`}
                      >
                        {execResult.resultType}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[10px]">{execResult.executionTimeMs} ms</span>
                  </div>

                  {execResult.error ? (
                    <div className="text-xs text-rose-400 font-bold bg-rose-950/30 p-2.5 rounded border border-rose-500/30">
                      Error: {execResult.error}
                    </div>
                  ) : (
                    <pre className="text-xs text-cyan-200 overflow-x-auto whitespace-pre-wrap max-h-40 bg-slate-900/50 p-2 rounded">
                      {String(execResult.result)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACCESSIBILITY & CHROMEVOX */}
          {activeTab === 'a11y' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-cyan-300 tracking-wider">
                  BACKEND ACCESSIBILITY KEYBOARD ACCESS &amp; CHROMEVOX SUB-TIER
                </h3>
                <p className="text-[11px] text-slate-400">
                  Comprehensive keyboard traversal, active element inspection, and dedicated ARIA live broadcast regions (<code className="text-cyan-400">aria-live="polite"</code> and <code className="text-fuchsia-400">"assertive"</code>).
                </p>
              </div>

              {/* Accessibility Focus Navigator Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                    <span>ACCESSIBILITY TREE WALKER</span>
                    <span className="text-[10px] text-slate-400">
                      {a11yState ? `${a11yState.totalTraversableElements} Interactive Nodes` : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Navigate through focusable elements programmatically, triggering native screen reader updates.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleA11yTabPrev}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Shift + Tab</span>
                    </button>
                    <button
                      onClick={handleA11yTabNext}
                      className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                    >
                      <span>Tab (Focus Next)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                    <span>ACTIVE FOCUSED ELEMENT</span>
                  </div>
                  {a11yState && (
                    <div className="text-[11px] space-y-1">
                      <div>
                        <span className="text-slate-500">Selector: </span>
                        <code className="text-cyan-300 font-bold">{a11yState.focusedElementSelector}</code>
                      </div>
                      <div>
                        <span className="text-slate-500">Role: </span>
                        <span className="text-fuchsia-300">{a11yState.focusedRole}</span>
                      </div>
                      {a11yState.focusedAriaLabel && (
                        <div>
                          <span className="text-slate-500">ARIA Label: </span>
                          <span className="text-emerald-300">"{a11yState.focusedAriaLabel}"</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Screen Reader Broadcast Dispatcher */}
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>BROADCAST TO CHROMEVOX / SCREEN READER</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAssertive}
                      onChange={(e) => setIsAssertive(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-400 focus:ring-0"
                    />
                    <span>Assertive Priority (Interrupts Speech)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={announceInput}
                    onChange={(e) => setAnnounceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendA11yAnnouncement();
                    }}
                    placeholder="Enter announcement phrase for ChromeVox..."
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleSendA11yAnnouncement}
                    className="px-3.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Broadcast
                  </button>
                </div>
              </div>

              {/* Announcement History Log */}
              {a11yState && a11yState.announcementHistory.length > 0 && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400">Recent ChromeVox Broadcasts:</span>
                  <div className="space-y-1 max-h-28 overflow-y-auto text-[10.5px] text-slate-300 font-mono">
                    {a11yState.announcementHistory.slice(-5).map((log: string, i: number) => (
                      <div key={i} className="text-cyan-200/90 truncate">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ON-DEVICE GEMINI ASSIST */}
          {activeTab === 'gemini-assist' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-fuchsia-300 tracking-wider">
                  ON-DEVICE GEMINI ASSISTANT &amp; DEVICE CONTROL INTENT BRIDGE
                </h3>
                <p className="text-[11px] text-slate-400">
                  Allow on-device Gemini to iteratively parse natural language commands, execute authorized browser controls, highlight text fragments, and maintain screen wake lock seamlessly.
                </p>
              </div>

              {/* Sample Intent Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400">Sample Autonomous Directives:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { title: 'Highlight Text Fragment', prompt: 'highlight singularity in terminal' },
                    { title: 'Display Wake Lock', prompt: 'keep screen awake and check battery' },
                    { title: 'ChromeVox Broadcast', prompt: 'announce Polymorphic Neural Substrate ready' },
                    { title: 'Live Browser Exec', prompt: 'exec document.title + " | " + window.innerWidth' },
                  ].map((item) => (
                    <button
                      key={item.title}
                      onClick={() => {
                        setAssistPrompt(item.prompt);
                        handleRunAssistIntent(item.prompt);
                      }}
                      className="p-2.5 text-left rounded-xl bg-slate-900/60 hover:bg-fuchsia-950/40 border border-slate-800 hover:border-fuchsia-500/50 transition-all cursor-pointer space-y-1"
                    >
                      <div className="text-xs font-bold text-fuchsia-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                        <span>{item.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">"{item.prompt}"</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt Box */}
              <div className="space-y-2 pt-2">
                <div className="relative">
                  <input
                    type="text"
                    value={assistPrompt}
                    onChange={(e) => setAssistPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRunAssistIntent();
                    }}
                    placeholder="Tell Gemini what to do on this device (e.g. highlight torus, keep awake, check battery)..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 font-mono text-xs text-white border border-fuchsia-500/40 rounded-xl focus:outline-none focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleRunAssistIntent()}
                    disabled={isProcessingAssist}
                    className="px-4 py-2 bg-fuchsia-950 hover:bg-fuchsia-900 text-fuchsia-200 border border-fuchsia-500/50 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(217,70,239,0.3)]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isProcessingAssist ? 'Processing Intent...' : 'Dispatch Assistant Directive'}</span>
                  </button>
                </div>
              </div>

              {/* Assistant Output */}
              {assistOutput && (
                <div className="p-3.5 bg-slate-950 border border-fuchsia-500/30 rounded-xl space-y-1.5 animate-in fade-in">
                  <span className="text-[11px] font-bold text-fuchsia-300">Device Assistant Output:</span>
                  <p className="text-xs text-slate-200 font-mono whitespace-pre-wrap">{assistOutput}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] select-none text-slate-400">
          <div className="flex items-center gap-3">
            <span>Hotkeys: Alt+Shift+D (HUD)</span>
            <span>•</span>
            <span>Alt+Shift+F (Fragment)</span>
            <span>•</span>
            <span>Tab / Shift+Tab (A11y)</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
