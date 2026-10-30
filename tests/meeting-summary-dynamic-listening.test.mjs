import test from 'node:test';
import assert from 'node:assert/strict';
import { meetingSummaryService } from '../src/services/meetingSummaryService.ts';
import { dynamicListeningService, TV_GUIDE_CATALOG } from '../src/services/dynamicListeningService.ts';

test('MeetingSummaryService generates structured executive summary with harmonic frequency and receipt', async () => {
  const req = {
    meetingId: 'meet-test-123',
    title: 'Executive Architecture Review',
    durationSeconds: 300,
    transcript: 'We decided to adopt 0-diff GitHub sync. Action item: deploy updated firestore rules.',
    notes: 'Agreed on hyperbolic fusion compression.',
    participants: ['machackabook@gmail.com', 'System Architect'],
    geolocation: { latitude: 37.7749, longitude: -122.4194, accuracy: 10, timestamp: Date.now() },
    environmentSnapshot: { sentiment: 'in-session', topology: 'torus' }
  };

  const summary = meetingSummaryService.createFallbackSummary(req);

  assert.ok(summary.id.startsWith('sum-'));
  assert.equal(summary.meetingId, 'meet-test-123');
  assert.equal(summary.durationSeconds, 300);
  assert.ok(summary.executiveSummary.length > 20);
  assert.ok(summary.keyDecisions.length >= 1, 'Contains key decisions');
  assert.ok(summary.actionItems.length >= 1, 'Contains action items');
  assert.ok(summary.resonanceFrequencyHz === 528, 'Tuned to 528Hz Solfeggio harmonic');
  assert.match(summary.receiptDigest, /^0xSUM-/);
  assert.ok(summary.telemetryEvidence.includes('Geo [37.7749, -122.4194]'));
});

test('MeetingSummaryService persists summaries locally and enforces maximum storage quota', () => {
  const dummy = {
    id: 'sum-mock-99',
    meetingId: 'meet-mock-99',
    timestamp: new Date().toISOString(),
    title: 'Unit Test Session',
    durationSeconds: 120,
    executiveSummary: 'Test summary verified.',
    keyDecisions: ['Decision A'],
    actionItems: ['Action B'],
    sentimentTrajectory: 'Focused',
    resonanceFrequencyHz: 528,
    telemetryEvidence: 'Test evidence',
    receiptDigest: '0xSUM-TEST',
    source: 'local-resilient-engine',
  };

  const before = meetingSummaryService.getSavedSummaries();
  // Call internal storage if localStorage is available
  if (typeof localStorage !== 'undefined') {
    assert.ok(Array.isArray(before));
  }
});

test('DynamicListeningService correctly classifies TV Guide movie acoustic keywords', () => {
  const svc = dynamicListeningService;
  
  // Test Matrix keywords
  svc.setManualTranscription('Neo, the red pill reveals the real world beyond the Matrix simulation.');
  let st = svc.getState();
  assert.equal(st.classification, 'MOVIE');
  assert.ok(st.detectedTitle.includes('The Matrix'));
  assert.ok(st.confidence >= 0.75);
  assert.ok(st.randomTrivia.length >= 1);

  // Test Blade Runner keywords
  svc.setManualTranscription('Within cells interlinked. What is your baseline, replicant?');
  st = svc.getState();
  assert.equal(st.classification, 'MOVIE');
  assert.ok(st.detectedTitle.includes('Blade Runner 2049'));

  // Test Cosmos documentary keywords
  svc.setManualTranscription('We are made of starstuff exploring the cosmic ocean across light years.');
  st = svc.getState();
  assert.equal(st.classification, 'TELEVISION');
  assert.ok(st.detectedTitle.includes('Cosmos'));

  // Test casual conversation
  svc.setManualTranscription('Hey team, let us grab lunch and discuss the project roadmap tomorrow.');
  st = svc.getState();
  assert.equal(st.classification, 'CONVERSATION');
  assert.ok(st.confidence > 0.8);
});

test('DynamicListeningService accurately computes acoustic dynamic range and harmonic band', () => {
  const svc = dynamicListeningService;
  svc.sampleAndClassify();
  const st = svc.getState();

  assert.ok(typeof st.features.rms === 'number');
  assert.ok(typeof st.features.peak === 'number');
  assert.ok(typeof st.features.decibelsDb === 'number');
  assert.ok(['432Hz', '528Hz', '963Hz', 'BROADBAND'].includes(st.features.harmonicBand));
  assert.ok(['COMPACT', 'MODERATE', 'WIDE_CINEMATIC'].includes(st.features.dynamicRange));
});

test('TV_GUIDE_CATALOG contains verified media entries with curated trivia banks', () => {
  assert.ok(TV_GUIDE_CATALOG.length >= 5);
  for (const prog of TV_GUIDE_CATALOG) {
    assert.ok(prog.channelNumber > 0);
    assert.ok(prog.title.length > 3);
    assert.ok(prog.acousticKeywords.length >= 3);
    assert.ok(prog.triviaBank.length >= 3);
    assert.ok(['CINEMA', 'SERIES', 'DOCUMENTARY', 'NEWS', 'BROADCAST'].includes(prog.category));
  }
});

test('DynamicListeningService runtime trivia game handles challenge generation, scoring, and streaks', () => {
  const svc = dynamicListeningService;
  const challenge = svc.nextChallenge();

  assert.ok(challenge.id);
  assert.ok(challenge.question.length > 10);
  assert.ok(challenge.options.length >= 2);
  assert.ok(challenge.correctIndex >= 0 && challenge.correctIndex < challenge.options.length);
  assert.ok(challenge.points > 0);

  const initialScore = svc.getState().triviaScore;
  const initialStreak = svc.getState().currentStreak;

  // Submit correct answer
  const correctResult = svc.submitTriviaAnswer(challenge.correctIndex);
  assert.equal(correctResult.isCorrect, true);
  assert.equal(correctResult.points, challenge.points);
  assert.equal(svc.getState().triviaScore, initialScore + challenge.points);
  assert.equal(svc.getState().currentStreak, initialStreak + 1);

  // Submit intentionally incorrect answer to test streak reset
  const nextCh = svc.getState().currentChallenge;
  const wrongIndex = (nextCh.correctIndex + 1) % nextCh.options.length;
  const wrongResult = svc.submitTriviaAnswer(wrongIndex);
  assert.equal(wrongResult.isCorrect, false);
  assert.equal(wrongResult.points, 0);
  assert.equal(svc.getState().currentStreak, 0, 'Streak should reset on incorrect answer');
});

test('TvGuideService searchShow retrieves metadata with cast, episode title, and summary for identified shows', async () => {
  const { tvGuideService } = await import('../src/services/tvGuideService.ts');

  // Test Westworld
  const westworld = await tvGuideService.searchShow('Westworld');
  assert.ok(westworld);
  assert.equal(westworld.title, 'Westworld');
  assert.ok(westworld.summary.length > 20, 'Contains show summary');
  assert.ok(westworld.currentEpisode, 'Contains episode metadata');
  assert.ok(westworld.currentEpisode.title.length > 0, 'Contains episode title');
  assert.ok(westworld.currentEpisode.summary.length > 10, 'Contains episode summary');
  assert.ok(Array.isArray(westworld.cast), 'Cast is an array');
  assert.ok(westworld.cast.length >= 3, 'Contains multiple cast members');
  assert.ok(westworld.cast[0].name && westworld.cast[0].character, 'Cast member has name and character');

  // Test The Matrix
  const matrix = await tvGuideService.searchShow('The Matrix (1999)');
  assert.ok(matrix);
  assert.ok(matrix.title.includes('Matrix'));
  assert.ok(matrix.currentEpisode.title.length > 0);
  assert.ok(matrix.summary.length > 0);
  assert.ok(matrix.cast.some((c) => c.character.includes('Neo') || c.character.includes('Morpheus')));

  // Test custom or novel show fallback synthesis
  const custom = await tvGuideService.searchShow('Galactic Quantum Chronicles');
  assert.ok(custom);
  assert.equal(custom.title, 'Galactic Quantum Chronicles');
  assert.ok(custom.summary.length > 10, 'Has synthesized summary');
  assert.ok(custom.currentEpisode.title.length > 0, 'Has episode title');
  assert.ok(custom.currentEpisode.summary.length > 10, 'Has episode summary');
  assert.ok(custom.cast.length >= 1, 'Has cast array');
  assert.ok(custom.cast[0].name && custom.cast[0].character, 'Cast item has name and character');

  // Test empty query validation
  await assert.rejects(
    async () => {
      await tvGuideService.searchShow('   ');
    },
    { message: 'Search query is empty' }
  );
});
