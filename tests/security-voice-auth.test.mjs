import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeVfsPath,
  isSafeRedirectUrl,
  sanitizeRedirect,
  sanitizeTaintedInput,
  escapeHtml
} from '../src/services/securitySanitizer.ts';
import { voiceAuthGateService } from '../src/services/voiceAuthGateService.ts';
import { AudioVoiceService } from '../src/services/audioVoiceService.ts';
import { polyglotEngine, PRESET_SNIPPETS } from '../src/services/polyglotEngine.ts';

test('Security Sanitizer: VFS path traversal prevention', () => {
  assert.equal(sanitizeVfsPath('/', '../../etc/passwd'), '/etc/passwd');
  assert.equal(sanitizeVfsPath('/root', '../etc/passwd'), '/etc/passwd');
  assert.equal(sanitizeVfsPath('/root/docs', '../../../'), '/');
  assert.equal(sanitizeVfsPath('/root', 'test\0null'), '/root/testnull');
  assert.equal(sanitizeVfsPath('/root', 'docs/architecture.md'), '/root/docs/architecture.md');
});

test('Security Sanitizer: open redirect validation', () => {
  assert.equal(isSafeRedirectUrl('/relative/path'), true);
  assert.equal(isSafeRedirectUrl('//malicious-domain.com'), false);
  assert.equal(isSafeRedirectUrl('/\\malicious-domain.com'), false);
  assert.equal(isSafeRedirectUrl('javascript:alert(1)'), false);
  assert.equal(isSafeRedirectUrl('https://crypticnews.org/dashboard'), true);
  assert.equal(isSafeRedirectUrl('https://evil-site.com'), false);
  assert.equal(sanitizeRedirect('https://evil-site.com', '/fallback'), '/fallback');
  assert.equal(sanitizeRedirect('/safe/path', '/fallback'), '/safe/path');
});

test('Security Sanitizer: input taint scrubbing', () => {
  assert.equal(sanitizeTaintedInput('hello\0world'), 'helloworld');
  assert.equal(sanitizeTaintedInput('clean command 123'), 'clean command 123');
  assert.equal(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
});

test('Voice Auth Gate: phrase challenge never substitutes for signed identity', () => {
  voiceAuthGateService.logoutUser();
  assert.equal(voiceAuthGateService.isAuthorized(), false);
  assert.equal(voiceAuthGateService.isProtectedDocument('/docs/architecture.md'), true);
  assert.equal(voiceAuthGateService.isProtectedDocument('docs/private-notes.md'), true);
  assert.equal(voiceAuthGateService.isProtectedDocument('/root/architecture.md'), true);
  assert.equal(voiceAuthGateService.isProtectedDocument('/root/soul.md'), true);
  assert.equal(voiceAuthGateService.isProtectedDocument('/root/welcome.txt'), false);

  const failResult = voiceAuthGateService.verifyVoice('wrong passphrase');
  assert.equal(failResult.verified, false);
  assert.equal(voiceAuthGateService.isAuthorized(), false);

  const passResult = voiceAuthGateService.verifyVoice('Please open sovereign matrix now');
  assert.equal(passResult.verified, true);
  assert.equal(voiceAuthGateService.isAuthorized(), false);
  assert.equal(voiceAuthGateService.unlockAllPaths(true), false);

  const status = voiceAuthGateService.getStatus();
  assert.equal(status.isAuthenticated, false);
  assert.equal(status.voiceMatched, true);
  assert.equal(status.accessAssertionVerified, false);
  assert.equal(status.confidence, 0);
  assert.equal(status.environmentalMatch, null);

  voiceAuthGateService.logoutUser();
  assert.equal(voiceAuthGateService.isAuthorized(), false);
  assert.equal(voiceAuthGateService.getStatus().voiceMatched, false);
});

test('AudioVoiceService: Natch voice profile configuration', () => {
  assert.ok(AudioVoiceService.PROFILES.natch);
  assert.equal(AudioVoiceService.PROFILES.natch.id, 'natch');
  assert.equal(AudioVoiceService.PROFILES.natch.carrierFreq, 432);
});

test('Polyglot Engine: executes presets successfully', async () => {
  const quine = PRESET_SNIPPETS.find(p => p.id === 'hamiltonian_quine');
  assert.ok(quine);
  const qRes = await polyglotEngine.execute(quine.lang, quine.code);
  assert.equal(qRes.status, 'success');
  assert.equal(qRes.returnValue.checksum, '0x77446C2E');

  const alpha = PRESET_SNIPPETS.find(p => p.id === 'alphaqubit_decoder');
  assert.ok(alpha);
  const aRes = await polyglotEngine.execute(alpha.lang, alpha.code);
  assert.equal(aRes.status, 'success');

  const harvester = PRESET_SNIPPETS.find(p => p.id === 'hop251_harvester');
  assert.ok(harvester);
  const hRes = await polyglotEngine.execute(harvester.lang, harvester.code);
  assert.equal(hRes.status, 'success');

  const swarm = PRESET_SNIPPETS.find(p => p.id === 'swarm_telemetry_optimizer');
  assert.ok(swarm);
  const sRes = await polyglotEngine.execute(swarm.lang, swarm.code);
  assert.equal(sRes.status, 'success');
});
