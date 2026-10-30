import test from 'node:test';
import assert from 'node:assert/strict';
import { githubAiStudioSyncService } from '../src/services/githubAiStudioSyncService.js';
import { iterationStateService } from '../src/services/iterationStateService.js';

test('GitHub ↔ AI Studio compare diff matrix is 100% merged with 0 diff conflicts', () => {
  const matrix = githubAiStudioSyncService.getCompareDiffMatrix();
  assert.equal(matrix.isMergedPerfectly, true);
  assert.equal(matrix.unmergedDiffsCount, 0);
  assert.equal(matrix.totalOptionsCount, 26);
  assert.equal(matrix.mergedOptionsCount, 26);
  assert.equal(matrix.overallStatus, 'PERFECTLY_MERGED');
  assert.match(matrix.reconciliationDigest, /^0xPRIME-AIS-GH-[0-9A-F]{8}$/);
});

test('Every iteration confirms that all GitHub and AI Studio options are seamlessly merged', () => {
  const fakeEnv = {
    topology: 'torus',
    sentiment: 'creative',
    primaryColor: '#c084fc',
    secondaryColor: '#00f2ff',
    speed: 1.0,
    gravity: 1.0,
    turbulence: 0.5,
    cameraDistance: 140,
    floatingGlyph: '✨',
    activeSpeechText: '',
    voiceActive: true,
    voicePitch: 1.0,
    voiceRate: 1.0,
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
    rgbLed: {
      enabled: false,
      profile: 'aurora_borealis',
      mode: 'spectrum_cycle',
      huePercent: 50,
      brightness: 1,
      speed: 1,
      pulseSpeed: 1,
      accentGlow: true,
      saturation: 100,
      lightness: 50,
    },
    youtube: {
      active: false,
      isPlaying: false,
      currentTrack: { id: '', title: '', artist: '', category: 'lofi' },
      playlist: [],
      volume: 80,
      isMuted: false,
      displayMode: 'background',
      showModal: false,
      selectedCategory: 'lofi',
      seekPositionSec: 0,
      durationSec: 0,
      videoOpacity: 0.7,
      blurIntensity: 0,
    },
    macros: {},
    d3Stream: {
      active: false,
      shape: 'force',
      title: '',
      packetRate: 0,
      throughputMbps: 0,
      nodeCount: 0,
      linkTension: 0.7,
      jitterMs: 0,
      packetLossPct: 0,
      palette: 'cyan',
      geminiTelemetrySummary: '',
      showPanel: false,
      lastCommand: 'idle',
      intensity: 1.0,
    },
  };

  const snap = iterationStateService.recordIteration(
    'git diff',
    'diff --git a/github b/aistudio\n0 diffs',
    fakeEnv,
    '/root'
  );

  assert.equal(snap.aiStudioGitHubConfirmed, true);
  assert.ok(snap.aiStudioGitHubDigest);
  assert.match(snap.aiStudioGitHubDigest, /^0xPRIME-AIS-GH-[0-9A-F]{8}$/);

  const telemetry = iterationStateService.getTelemetry();
  assert.equal(telemetry.aiStudioGitHubMerged, true);
  assert.equal(telemetry.aiStudioGitHubDiffs, 0);
  assert.ok(telemetry.aiStudioGitHubDigest);
});

test('Subsystem verification pass confirms all 26 options are functioning together without error', () => {
  const result = githubAiStudioSyncService.verifyAllOptions();
  assert.equal(result.success, true);
  assert.equal(result.conflicts, 0);
  assert.equal(result.merged, 26);
  assert.equal(result.total, 26);
  assert.equal(result.details.length, 26);
  for (const item of result.details) {
    assert.match(item, /\[✓ CONFIRMED MERGED\]/);
  }
});
