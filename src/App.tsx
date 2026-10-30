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
import { metadataPersistenceService } from './services/metadataPersistenceService';
import { voiceAuthGateService } from './services/voiceAuthGateService';
import { openSystemPage } from './services/nexusSystemRouter.mjs';
import { EnvironmentState } from './types';
import { SystemSelfTest } from './components/SystemSelfTest';
import { SystemLogViewer } from './components/SystemLogViewer';
import { DEFAULT_RGB_LED_CONFIG } from './services/colorProfileService';
import { DEFAULT_YOUTUBE_STATE } from './services/youtubeService';

const DEFAULT_ENV_STATE: EnvironmentState = {
  topology: 'torus',
  sentiment: 'creative',
  primaryColor: '#c084fc',
  secondaryColor: '#00f2ff',
  speed: 1.05,
  gravity: 1.2,
  turbulence: 0.5,
  cameraDistance: 140,
  floatingGlyph: '✨',
  activeSpeechText: 'HyperPolyglot visual and terminal interface ready. Live AI depends on an authenticated provider.',
  activeSpeechWord: '',
  activeSpeechTone: 'Harmonic & Adaptive',
  neuralityAuto: true,
  voiceActive: true,
  voicePitch: 1.15,
  voiceRate: 1.02,
  voiceName: '',
  voiceProfile: 'gemini_female',
  solfeggio963: false,
  wireframe: true,
  bloomIntensity: 1.2,
  audioReactiveLevel: 1.0,
  terminalOpacity: 0.85,
  terminalDock: 'center',
  highContrast: false,
  chromeVoxEnabled: false,
  ambientSoundscape: false,
  ambientVolume: 0.35,
  harmonicResonance: '432',
  mountedDevices: [],
  rgbLed: DEFAULT_RGB_LED_CONFIG,
  youtube: DEFAULT_YOUTUBE_STATE,
  macros: {},
  d3Stream: {
    active: false,
    shape: 'force',
    title: 'Orbital Mesh Telemetry Stream',
    packetRate: 0,
    throughputMbps: 0,
    nodeCount: 0,
    linkTension: 0.7,
    jitterMs: 0,
    packetLossPct: 0,
    palette: 'cyan',
    geminiTelemetrySummary: 'No verified network telemetry source is connected.',
    showPanel: false,
    lastCommand: 'idle',
    intensity: 1.0,
  },
};

export function App() {
  const STORAGE_KEY = 'hyperterminal_env_state_v1';

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
    const handleUnlockAllPaths = () => voiceAuthGateService.unlockAllPaths(true);
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
      </div>
      )}
    </SystemSelfTest>
  );
}

export default App;
