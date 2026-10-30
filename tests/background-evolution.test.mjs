import test from 'node:test';
import assert from 'node:assert';
import { BackgroundEvolutionEngine } from '../src/services/backgroundEvolutionEngine.ts';
import { vfs } from '../src/services/vfsService.ts';

test('🌌 Background Evolution Engine & Autopoietic Render Governor Tests', async (t) => {

  await t.test('1. Initial Render State Configuration', () => {
    const config = BackgroundEvolutionEngine.getActiveRenderConfig();
    assert.strictEqual(config.shaderVfsPath, '/sys/render/background.frag');
    assert.ok(config.particleCount >= 1000);
    assert.ok(config.rayMarchingSteps >= 64);
    assert.ok(typeof config.sha256Seal === 'string');
  });

  await t.test('2. Dynamic Posture Evolution Threshold Mutation', () => {
    const initialConfig = BackgroundEvolutionEngine.getActiveRenderConfig();
    
    // Optimal coherence evolution
    BackgroundEvolutionEngine.evolveBackgroundPosture(99.9, 1.5);
    const evolvedConfig = BackgroundEvolutionEngine.getActiveRenderConfig();
    assert.ok(evolvedConfig.particleCount >= initialConfig.particleCount);

    // Degraded coherence fallback
    BackgroundEvolutionEngine.evolveBackgroundPosture(92.0, 0.5);
    const fallbackConfig = BackgroundEvolutionEngine.getActiveRenderConfig();
    assert.strictEqual(fallbackConfig.rayMarchingSteps, 128);
  });

  await t.test('3. VFS Node Registration & Shader Hot-Swap Verification', async () => {
    const shaderContent = vfs.readFile('/', '/sys/render/background.frag');
    assert.ok(shaderContent);
    assert.ok(shaderContent.includes('gl_FragColor'));

    const newShader = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      void main() {
        gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0);
      }
    `;

    const swapResult = await BackgroundEvolutionEngine.verifyAndHotSwapShader(newShader);
    assert.strictEqual(swapResult.success, true);
    assert.ok(swapResult.seal.startsWith('0x'));

    const updatedContent = vfs.readFile('/', '/sys/render/background.frag');
    assert.ok(updatedContent.includes('vec4(1.0, 0.5, 0.0, 1.0)'));
  });
});
