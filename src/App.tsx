import React, { useState, useEffect, useCallback } from 'react';
import { VisualRenderer3D } from './components/VisualRenderer3D';
import { HyperTerminal } from './components/HyperTerminal';
import { ResonanceConsole } from './components/ResonanceConsole';
import { GaiaCognitionPanel } from './components/GaiaCognitionPanel';
import { GaiaAbsorptionLauncher } from './components/GaiaAbsorptionLauncher';
import { startNexusSync } from './services/nexusEvolutionSync.mjs';
import { YouTubeBackgroundPlayer } from './components/YouTubeBackgroundPlayer';
import { XYouTubeAICard } from './components/XYouTubeAICard';
import { GoogleMeetModule } from './components/GoogleMeetModule';
import { AtcStreamingModule } from './components/AtcStreamingModule';
import { DynamicListeningHUD } from './components/DynamicListeningHUD';
import { GaiaConnectionCenter } from './components/GaiaConnectionCenter';
import { ConnectorSettingsModule } from './components/ConnectorSettingsModule';
import { DistributedSchedulerModule } from './components/DistributedSchedulerModule';
import { MultiModelSingularityModal } from './components/MultiModelSingularityModal';
import { CrystallineCrossvoidGate } from './components/CrystallineCrossvoidGate';
import { NexusSystemPages } from './components/NexusSystemPages';
import { SystemHeaderDeck } from './components/SystemHeaderDeck';
import { SystemDockBar } from './components/SystemDockBar';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { LivingComputationLifecycleHUD } from './components/LivingComputationLifecycleHUD';
import { NexusCosmicLineageModal } from './components/NexusCosmicLineageModal';
import { MailHubModal } from './components/MailHubModal';
import { FinanceHubModal } from './components/FinanceHubModal';
import { CloudIdentityModal } from './components/CloudIdentityModal';
import { EUAIActComplianceModal } from './components/EUAIActComplianceModal';
import { ConfidentialComputeSlurmModal } from './components/ConfidentialComputeSlurmModal';
import { SovereignMerkleZkModal } from './components/SovereignMerkleZkModal';
import { metadataPersistenceService } from './services/metadataPersistenceService';
import { voiceAuthGateService } from './services/voiceAuthGateService';
import { openSystemPage } from './services/nexusSystemRouter.mjs';
import { EnvironmentState } from './types';
import { SystemSelfTest } from './components/SystemSelfTest';
import { SystemLogViewer } from './components/SystemLogViewer';
import { DEFAULT_RGB_LED_CONFIG } from './services/colorProfileService';
import { DEFAULT_YOUTUBE_STATE } from './services/youtubeService';
import { GeminiLiveInterface } from './components/GeminiLiveInterface';
import { AudioTranscriptionTool } from './components/AudioTranscriptionTool';
import { QuantumEntropyPanel } from './components/QuantumEntropyPanel';
import { BiometricGateway } from './components/BiometricGateway';
import { YouTubePortal } from './components/YouTubePortal';
import { NexusRemoteHub } from './components/NexusRemoteHub';
import { PluginManagerModal } from './components/PluginManagerModal';
import { AllDriversModal } from './components/AllDriversModal';
import { RavenEyePulsePanel } from './components/RavenEyePulsePanel';
import { RegistryEditorModal } from './components/RegistryEditorModal';
import { VGSGiFileExplorerModal } from './components/VGSGiFileExplorerModal';




const DEFAULT_ENV_STATE: EnvironmentState = {
  topology: 'singularity',
  sentiment: 'cyberpunk',
  primaryColor: '#00f2ff',
  secondaryColor: '#ff007f',
  speed: 1.25,
  gravity: 1.5,
  turbulence: 0.8,
  cameraDistance: 140,
  floatingGlyph: '🛸',
  activeSpeechText: 'HyperPolyglot Ultra-High Fidelity System Active. All subsystems initialized to performance baseline.',
  activeSpeechWord: '',
  activeSpeechTone: 'Sovereign & Resonant',
  neuralityAuto: true,
  voiceActive: true,
  voicePitch: 1.1,
  voiceRate: 1.0,
  voiceName: '',
  voiceProfile: 'gemini_female',
  solfeggio963: false,
  wireframe: false,
  bloomIntensity: 2.2,
  audioReactiveLevel: 1.2,
  terminalOpacity: 0.9,
  terminalDock: 'center',
  highContrast: false,
  chromeVoxEnabled: false,
  ambientSoundscape: false,
  ambientVolume: 0.1,
  harmonicResonance: '963',
  mountedDevices: [],
  rgbLed: DEFAULT_RGB_LED_CONFIG,
  youtube: {
    ...DEFAULT_YOUTUBE_STATE,
    active: true,
    blendWith3D: true,
    displayMode: 'background'
  },
  macros: {},
  d3Stream: {
    active: true,
    shape: 'force',
    title: 'High-Fidelity Telemetry Stream',
    packetRate: 120,
    throughputMbps: 850,
    nodeCount: 1024,
    linkTension: 0.75,
    jitterMs: 1.2,
    packetLossPct: 0,
    palette: 'cyan',
    geminiTelemetrySummary: 'Performance baseline verified. All neural links operational.',
    showPanel: true,
    lastCommand: 'sys_init',
    intensity: 1.2,
  },
  droneViewActive: true,
  droneOrbitSpeed: 1.4,
  droneViewpoint: 'default',
};

export function App() {
  const STORAGE_KEY = 'hyperterminal_env_state_v2_performance';

  // Global Environment State governing the 100% Background Visual Renderer & Terminal
  const [envState, setEnvState] = useState<EnvironmentState>(() => {
    if (typeof window === 'undefined') return DEFAULT_ENV_STATE;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_ENV_STATE;
    } catch (e) {
      console.warn('Failed to load envState:', e);
      return DEFAULT_ENV_STATE;
    }
  });

  useEffect(() => {
    metadataPersistenceService.saveEnvironmentMetadata(envState);
  }, [envState]);

  // Initial cloud hydration
  useEffect(() => {
    metadataPersistenceService.loadEnvironmentMetadata().then((persisted) => {
      if (persisted) {
        setEnvState((prev) => ({ ...prev, ...persisted }));
      }
    });
  }, []);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const [isMeetOpen, setIsMeetOpen] = useState(false);
  const [isAtcOpen, setIsAtcOpen] = useState(false);
  const [isListeningHudOpen, setIsListeningHudOpen] = useState(false);
  const [isConnectorSettingsOpen, setIsConnectorSettingsOpen] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isSingularityOpen, setIsSingularityOpen] = useState(false);
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
  const [isLifecycleOpen, setIsLifecycleOpen] = useState(false);
  const [isLineageOpen, setIsLineageOpen] = useState(false);
  const [isMailOpen, setIsMailOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isIdentityOpen, setIsIdentityOpen] = useState(false);
  const [isEuComplianceOpen, setIsEuComplianceOpen] = useState(false);
  const [isSlurmOpen, setIsSlurmOpen] = useState(false);
  const [isMerkleZkOpen, setIsMerkleZkOpen] = useState(false);
  const [isVoiceLiveOpen, setIsVoiceLiveOpen] = useState(false);
  const [isTranscriptionOpen, setIsTranscriptionOpen] = useState(false);
  const [isEntropyPanelOpen, setIsEntropyPanelOpen] = useState(false);
  const [isYouTubePortalOpen, setIsYouTubePortalOpen] = useState(false);
  const [isRemoteHubOpen, setIsRemoteHubOpen] = useState(false);
  const [isPluginManagerOpen, setIsPluginManagerOpen] = useState(false);
  const [isAllDriversOpen, setIsAllDriversOpen] = useState(false);
  const [isPulsePanelOpen, setIsPulsePanelOpen] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [isVGSExplorerOpen, setIsVGSExplorerOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);


  // Sync canvas mode toggle with HyperTerminal
  const handleToggleCanvas = useCallback(() => {
    setIsCanvasMode((prev) => {
      const next = !prev;
      window.dispatchEvent(new CustomEvent('gaia:toggle-canvas'));
      return next;
    });
  }, []);

  // Listen for canvas mode changes from HyperTerminal
  useEffect(() => {
    const onShowTerminal = () => setIsCanvasMode(false);
    window.addEventListener('gaia:show-terminal', onShowTerminal);
    return () => window.removeEventListener('gaia:show-terminal', onShowTerminal);
  }, []);

  // One sync listener, atomic Mesh v4 metadata reconciliation, no full-canvas remount.
  useEffect(() => startNexusSync(window), []);

  // Global hotkeys: Ctrl+K / Cmd+K for command palette, Alt+1..Alt+8 for modules
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('gaia:show-terminal'));
          setIsCanvasMode(false);
        } else if (e.key === '2') {
          e.preventDefault();
          handleToggleCanvas();
        } else if (e.key === '3') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('gaia:toggle-resonance'));
        } else if (e.key === '4') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('gaia:toggle-cognition-panel'));
        } else if (e.key === '5') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('gaia:toggle-crossvoid'));
        } else if (e.key === '6') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('gaia:toggle-x-card'));
        } else if (e.key === '7') {
          e.preventDefault();
          const href = import.meta.env.BASE_URL + 'gaia-absorption-quine.html';
          window.open(href, '_blank', 'noopener,noreferrer');
        } else if (e.key === '8') {
          e.preventDefault();
          openSystemPage('terminal');
        }
      }
    };

    const handleToggleMeet = () => setIsMeetOpen(prev => !prev);
    const handleToggleAtc = () => setIsAtcOpen(prev => !prev);
    const handleToggleListening = () => setIsListeningHudOpen(prev => !prev);
    const handleOpenListening = () => setIsListeningHudOpen(true);
    const handleToggleConnectorSettings = () => setIsConnectorSettingsOpen(prev => !prev);
    const handleToggleScheduler = () => setIsSchedulerOpen(prev => !prev);
    const handleToggleSingularity = () => setIsSingularityOpen(prev => !prev);
    const handleToggleLifecycle = () => setIsLifecycleOpen(prev => !prev);
    const handleOpenLifecycle = () => setIsLifecycleOpen(true);
    const handleToggleLineage = () => setIsLineageOpen(prev => !prev);
    const handleOpenLineage = () => setIsLineageOpen(true);
    const handleToggleMail = () => setIsMailOpen(prev => !prev);
    const handleOpenMail = () => setIsMailOpen(true);
    const handleToggleFinance = () => setIsFinanceOpen(prev => !prev);
    const handleOpenFinance = () => setIsFinanceOpen(true);
    const handleToggleIdentity = () => setIsIdentityOpen(prev => !prev);
    const handleOpenIdentity = () => setIsIdentityOpen(true);
    const handleOpenEuCompliance = () => setIsEuComplianceOpen(true);
    const handleOpenSlurm = () => setIsSlurmOpen(true);
    const handleOpenMerkleZk = () => setIsMerkleZkOpen(true);
    const handleToggleVoiceLive = () => setIsVoiceLiveOpen(prev => !prev);
    const handleToggleTranscription = () => setIsTranscriptionOpen(prev => !prev);
    const handleToggleEntropyPanel = () => setIsEntropyPanelOpen(prev => !prev);
    const handleToggleYouTubePortal = () => setIsYouTubePortalOpen(prev => !prev);
    const handleToggleRemoteHub = () => setIsRemoteHubOpen(prev => !prev);
    const handleTogglePluginManager = () => setIsPluginManagerOpen(prev => !prev);
    const handleToggleAllDrivers = () => setIsAllDriversOpen(prev => !prev);
    const handleTogglePulsePanel = () => setIsPulsePanelOpen(prev => !prev);
    const handleToggleRegistry = () => setIsRegistryOpen(prev => !prev);
    const handleToggleVGSExplorer = () => setIsVGSExplorerOpen(prev => !prev);
    const handleUnlockAllPaths = () => window.dispatchEvent(new CustomEvent('gaia:open-voice-auth'));


    window.addEventListener('gaia:toggle-meet', handleToggleMeet);
    window.addEventListener('gaia:toggle-atc', handleToggleAtc);
    window.addEventListener('gaia:toggle-listening', handleToggleListening);
    window.addEventListener('gaia:open-listening', handleOpenListening);
    window.addEventListener('gaia:toggle-connector-settings', handleToggleConnectorSettings);
    window.addEventListener('gaia:toggle-scheduler', handleToggleScheduler);
    window.addEventListener('gaia:toggle-singularity', handleToggleSingularity);
    window.addEventListener('gaia:toggle-lifecycle', handleToggleLifecycle);
    window.addEventListener('gaia:open-lifecycle', handleOpenLifecycle);
    window.addEventListener('gaia:toggle-lineage-map', handleToggleLineage);
    window.addEventListener('gaia:open-lineage-map', handleOpenLineage);
    window.addEventListener('gaia:toggle-mail', handleToggleMail);
    window.addEventListener('gaia:open-mail', handleOpenMail);
    window.addEventListener('gaia:toggle-finance', handleToggleFinance);
    window.addEventListener('gaia:open-finance', handleOpenFinance);
    window.addEventListener('gaia:toggle-identity', handleToggleIdentity);
    window.addEventListener('gaia:open-identity', handleOpenIdentity);
    window.addEventListener('gaia:open-eu-compliance', handleOpenEuCompliance);
    window.addEventListener('gaia:open-slurm', handleOpenSlurm);
    window.addEventListener('gaia:open-merkle-zk', handleOpenMerkleZk);
    window.addEventListener('gaia:toggle-voice-live', handleToggleVoiceLive);
    window.addEventListener('gaia:toggle-transcription', handleToggleTranscription);
    window.addEventListener('gaia:toggle-entropy-panel', handleToggleEntropyPanel);
    window.addEventListener('gaia:open-youtube-portal', handleToggleYouTubePortal);
    window.addEventListener('gaia:open-remote-hub', handleToggleRemoteHub);
    window.addEventListener('gaia:toggle-plugin-manager', handleTogglePluginManager);
    window.addEventListener('gaia:toggle-all-drivers', handleToggleAllDrivers);
    window.addEventListener('gaia:toggle-raveneyte-pulse', handleTogglePulsePanel);
    window.addEventListener('gaia:toggle-registry', handleToggleRegistry);
    window.addEventListener('gaia:toggle-vgs-explorer', handleToggleVGSExplorer);
    window.addEventListener('gaia:unlock-all-paths', handleUnlockAllPaths);


    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('gaia:toggle-meet', handleToggleMeet);
      window.removeEventListener('gaia:toggle-atc', handleToggleAtc);
      window.removeEventListener('gaia:toggle-listening', handleToggleListening);
      window.removeEventListener('gaia:open-listening', handleOpenListening);
      window.removeEventListener('gaia:toggle-connector-settings', handleToggleConnectorSettings);
      window.removeEventListener('gaia:toggle-scheduler', handleToggleScheduler);
      window.removeEventListener('gaia:toggle-singularity', handleToggleSingularity);
      window.removeEventListener('gaia:toggle-lifecycle', handleToggleLifecycle);
      window.removeEventListener('gaia:open-lifecycle', handleOpenLifecycle);
      window.removeEventListener('gaia:toggle-lineage-map', handleToggleLineage);
      window.removeEventListener('gaia:open-lineage-map', handleOpenLineage);
      window.removeEventListener('gaia:toggle-mail', handleToggleMail);
      window.removeEventListener('gaia:open-mail', handleOpenMail);
      window.removeEventListener('gaia:toggle-finance', handleToggleFinance);
      window.removeEventListener('gaia:open-finance', handleOpenFinance);
      window.removeEventListener('gaia:toggle-identity', handleToggleIdentity);
      window.removeEventListener('gaia:open-identity', handleOpenIdentity);
      window.removeEventListener('gaia:toggle-voice-live', handleToggleVoiceLive);
      window.removeEventListener('gaia:toggle-transcription', handleToggleTranscription);
      window.removeEventListener('gaia:toggle-entropy-panel', handleToggleEntropyPanel);
      window.removeEventListener('gaia:open-youtube-portal', handleToggleYouTubePortal);
      window.removeEventListener('gaia:open-remote-hub', handleToggleRemoteHub);
      window.removeEventListener('gaia:unlock-all-paths', handleUnlockAllPaths);
    };
  }, [handleToggleCanvas]);

  return (
    <SystemSelfTest>
      {(health) => (
        <div className="relative w-screen h-screen overflow-hidden bg-[#02050b] select-none font-mono">
          {/* Executive Holographic Header Deck */}
          <SystemHeaderDeck
            envState={envState}
            setEnvState={setEnvState}
            isCanvasMode={isCanvasMode}
            onToggleCanvas={handleToggleCanvas}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenLogs={() => setIsLogViewerOpen(true)}
            healthState={health}
            isLocked={isLocked}
            onToggleLock={() => setIsLocked(!isLocked)}
          />

        {/* Dynamic YouTube Background Video Player & Content Transition Layer */}
        <YouTubeBackgroundPlayer envState={envState} setEnvState={setEnvState} />

        {/* Optional X/Grok chat card: authenticated local provider and genuine YouTube embed. */}
        <XYouTubeAICard envState={envState} />
        {isMeetOpen && (
          <GoogleMeetModule 
            onClose={() => {
              setIsMeetOpen(false);
              setEnvState(prev => ({ ...prev, sentiment: 'creative' }));
            }} 
            envState={envState} 
            setEnvState={setEnvState}
          />
        )}
        {isAtcOpen && <AtcStreamingModule onClose={() => setIsAtcOpen(false)} />}
        {isConnectorSettingsOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <ConnectorSettingsModule />
            <button className="absolute top-4 right-4 text-white" onClick={() => setIsConnectorSettingsOpen(false)}>Close</button>
          </div>
        )}
        {isSchedulerOpen && <DistributedSchedulerModule onClose={() => setIsSchedulerOpen(false)} />}
        {isSingularityOpen && (
          <MultiModelSingularityModal
            onClose={() => setIsSingularityOpen(false)}
            onSelectProteinTopology={() => {
              setEnvState((prev) => ({ ...prev, topology: 'protein_fold' }));
            }}
          />
        )}

        {/* Continuous *measured* account/service status; one-shot authorized toasts. */}
        <GaiaConnectionCenter />

        <SystemLogViewer isOpen={isLogViewerOpen} onClose={() => setIsLogViewerOpen(false)} />

        {/* 100% Visual Background Renderer (Polymorphic Neurality) */}
        <VisualRenderer3D envState={envState} />

        {/* The Sole UI: Sovereign HyperTerminal */}
        <HyperTerminal envState={envState} setEnvState={setEnvState} />

        {/* Explicit opt-in mathematical field console; original HyperTerminal stays intact. */}
        <ResonanceConsole />
        <GaiaCognitionPanel />

        {/* Portable local HTML archive: does not import secrets or executable code. */}
        <GaiaAbsorptionLauncher />

        {/* Private/live data requires each device to pair with its local bridge. */}
        <NexusSystemPages />

        {/* Public CrossVoid visual entry. All authentication remains at Cryptic News. */}
        <CrystallineCrossvoidGate />

        {/* Unified Telemetry Status & System Dock Bar */}
        <SystemDockBar
          envState={envState}
          setEnvState={setEnvState}
          isCanvasMode={isCanvasMode}
          onToggleCanvas={handleToggleCanvas}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Full-Feature Command Spotlight Palette (Ctrl+K / ⌘K) */}
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          envState={envState}
          setEnvState={setEnvState}
        />

        {/* Dynamic Listening System Profile & Acoustic Shazam Trivia Game */}
        <DynamicListeningHUD
          isOpen={isListeningHudOpen}
          onClose={() => setIsListeningHudOpen(false)}
          envState={envState}
          setEnvState={setEnvState}
        />

        {/* Living Computation Lifecycle Substrate (observe → digest → integrate → stabilize → shed) */}
        <LivingComputationLifecycleHUD
          isOpen={isLifecycleOpen}
          onClose={() => setIsLifecycleOpen(false)}
        />

        {/* The Nexus Ecosystem Cosmic Lineage Map (TDOC-12000 Series v6.0.0) */}
        <NexusCosmicLineageModal
          isOpen={isLineageOpen}
          onClose={() => setIsLineageOpen(false)}
        />

        {/* Gmail API & Sovereign Mail Dispatch Hub */}
        <MailHubModal
          isOpen={isMailOpen}
          onClose={() => setIsMailOpen(false)}
        />

        {/* Multi-Gateway Finance & Payment Hub (Google Pay, Stripe, Cash App) */}
        <FinanceHubModal
          isOpen={isFinanceOpen}
          onClose={() => setIsFinanceOpen(false)}
        />

        {/* Federated Cloud SSO & Identity Manager (AWS STS, Microsoft Entra ID) */}
        <CloudIdentityModal
          isOpen={isIdentityOpen}
          onClose={() => setIsIdentityOpen(false)}
        />

        {/* EU AI Act Compliance Profiler & Risk-Tier Registry */}
        <EUAIActComplianceModal
          isOpen={isEuComplianceOpen}
          onClose={() => setIsEuComplianceOpen(false)}
        />

        {/* Confidential Compute Enclave & Slurm Orchestration Telemetry */}
        <ConfidentialComputeSlurmModal
          isOpen={isSlurmOpen}
          onClose={() => setIsSlurmOpen(false)}
        />

        {/* Sovereign Merkle Proofs & Multi-Tenant ZK Access Control */}
        <SovereignMerkleZkModal
          isOpen={isMerkleZkOpen}
          onClose={() => setIsMerkleZkOpen(false)}
        />

        {/* Biometric Gateway Overlay */}
        {isLocked && (
          <BiometricGateway onUnlock={() => setIsLocked(false)} />
        )}

        {/* Quantum Entropy Metrics Panel */}
        <QuantumEntropyPanel
          isOpen={isEntropyPanelOpen}
          onClose={() => setIsEntropyPanelOpen(false)}
          envState={envState}
        />

        {/* Real-Time Gemini Voice Live Enclave */}
        {isVoiceLiveOpen && (
          <div className="fixed bottom-24 right-6 w-96 h-[500px] z-[130] animate-in slide-in-from-right-10 duration-300">
            <GeminiLiveInterface onClose={() => setIsVoiceLiveOpen(false)} />
          </div>
        )}

        {/* Audio Transcription Substrate */}
        {isTranscriptionOpen && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[600px] z-[140] animate-in zoom-in-95 duration-200">
            <AudioTranscriptionTool onClose={() => setIsTranscriptionOpen(false)} />
          </div>
        )}

        {/* Interactive YouTube Claunch Portal */}
        <YouTubePortal
          isOpen={isYouTubePortalOpen}
          onClose={() => setIsYouTubePortalOpen(false)}
        />

        {/* Nexus Remote Connectivity Hub */}
        <NexusRemoteHub
          isOpen={isRemoteHubOpen}
          onClose={() => setIsRemoteHubOpen(false)}
        />

        {/* Extensions & Add-ons Manager Modal */}
        <PluginManagerModal
          isOpen={isPluginManagerOpen}
          onClose={() => setIsPluginManagerOpen(false)}
        />

        {/* All Drivers Master Matrix Modal */}
        <AllDriversModal
          isOpen={isAllDriversOpen}
          onClose={() => setIsAllDriversOpen(false)}
        />

        {/* RavenEyeTE Telemetry Core & NextBenchUp Pulse HUD Panel */}
        <RavenEyePulsePanel
          isOpen={isPulsePanelOpen}
          onClose={() => setIsPulsePanelOpen(false)}
        />

        {/* Sovereign Registry Editor & FileSystem BootChain Modal */}
        <RegistryEditorModal
          isOpen={isRegistryOpen}
          onClose={() => setIsRegistryOpen(false)}
        />

        {/* VGS GiFile Explorer & Polyglot Encoding Engine Modal */}
        <VGSGiFileExplorerModal
          isOpen={isVGSExplorerOpen}
          onClose={() => setIsVGSExplorerOpen(false)}
        />
      </div>

      )}
    </SystemSelfTest>
  );
}

export default App;
