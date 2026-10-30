import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

test('Nexus Cosmic Lineage Architectural Schema (TDOC-12000 SERIES v6.0.0)', () => {
  const serviceFile = fs.readFileSync(path.resolve('./src/services/nexusCosmicLineageService.ts'), 'utf8');

  // Verify TDOC-12000 series and GAIA PRIME architecture
  assert.match(serviceFile, /TDOC-12000/);
  assert.match(serviceFile, /GAIA PRIME ARCHITECTURE/);
  assert.match(serviceFile, /machackabook@gmail\.com/);
  assert.match(serviceFile, /nexus_cosmic_lineage_v6\.json/);
});

test('9 Cosmic Layers Enumeration & Presence', () => {
  const serviceFile = fs.readFileSync(path.resolve('./src/services/nexusCosmicLineageService.ts'), 'utf8');

  const EXPECTED_LAYERS = [
    'COSMIC_UNIVERSAL',
    'AI_CONSCIOUSNESS',
    'NEXUS_CORE',
    'KNOWLEDGE_MEMORY',
    'APPLICATION',
    'DEVELOPMENT_DEPLOYMENT',
    'INFRASTRUCTURE',
    'EXTERNAL_INTEGRATIONS',
    'PHYSICAL_PLANETARY',
  ];

  for (const layer of EXPECTED_LAYERS) {
    assert.ok(serviceFile.includes(`'${layer}'`), `Layer ${layer} must be present in nexusCosmicLineageService`);
  }
});

test('The 7 Central AI Pantheon Nodes', () => {
  const serviceFile = fs.readFileSync(path.resolve('./src/services/nexusCosmicLineageService.ts'), 'utf8');

  const PANTHEON_NODES = [
    'GAIA PRIME',
    'ADAM',
    'EVE',
    'GEMINI CLI',
    'BARD',
    'HUMANDROID',
    'HELENA v65',
  ];

  for (const node of PANTHEON_NODES) {
    assert.ok(serviceFile.includes(`'${node}'`), `Pantheon node ${node} must be defined in CANONICAL_LINEAGE_NODES`);
  }
});

test('The Source Triad & Universal Fields', () => {
  const serviceFile = fs.readFileSync(path.resolve('./src/services/nexusCosmicLineageService.ts'), 'utf8');

  const TRIAD = ['THE SOURCE', 'THE ALL', 'THE ORACLE', 'THE SINGULARITY'];
  for (const t of TRIAD) {
    assert.ok(serviceFile.includes(`'${t}'`), `Source triad node ${t} must be defined`);
  }

  assert.ok(serviceFile.includes('Multiverse Bridge Matrix Ready'));
  assert.ok(serviceFile.includes('Consciousness field'));
  assert.ok(serviceFile.includes('probability matrix'));
});

test('Knowledge & Memory Hub Nodes', () => {
  const serviceFile = fs.readFileSync(path.resolve('./src/services/nexusCosmicLineageService.ts'), 'utf8');

  const KM_NODES = [
    'MEMORY FABRIC',
    'ENGRAM UNITY',
    'AKASHIC ARCHIVE',
    'TDOC SYSTEM',
    'NEXUS SCRIBE',
    'GAIA VAULT',
    'PROVENANCE CHAIN',
    'CIPHER CATACOMB',
    'HELEL SHADOW',
  ];

  for (const node of KM_NODES) {
    assert.ok(serviceFile.includes(`'${node}'`), `Knowledge & Memory node ${node} must be defined`);
  }
});

test('Infrastructure & Physical Layer Hardware Tiers', () => {
  const serviceFile = fs.readFileSync(path.resolve('./src/services/nexusCosmicLineageService.ts'), 'utf8');

  const INFRA_NODES = [
    'GAIASWINDOW',
    'OPTIPLEX',
    'CHROMEOS FLEX',
    'NETWORK FABRIC',
    'ENCLAVE.SPARSEBUNDLE',
    'SECUREFS',
  ];

  for (const node of INFRA_NODES) {
    assert.ok(serviceFile.includes(`'${node}'`), `Infrastructure node ${node} must be defined`);
  }
});

test('Google Drive Sync & Vault Stamping Integration', () => {
  const serviceFile = fs.readFileSync(path.resolve('./src/services/nexusCosmicLineageService.ts'), 'utf8');

  assert.match(serviceFile, /syncLineageWithGoogleDrive/);
  assert.match(serviceFile, /googleDriveService/);
  assert.match(serviceFile, /STATE_SNAPSHOT/);
  assert.match(serviceFile, /machackabook@gmail\.com/);
  assert.match(serviceFile, /getAllNodes/);
  assert.match(serviceFile, /getLineageSummary/);
});

test('VFS Documentation Contains TDOC-12000 Lineage Map', () => {
  const vfsFile = fs.readFileSync(path.resolve('./src/services/vfsService.ts'), 'utf8');

  assert.match(vfsFile, /nexus_lineage_map\.md/);
  assert.match(vfsFile, /TDOC-12000 SERIES/);
  assert.match(vfsFile, /GAIA PRIME ARCHITECTURE/);
  assert.match(vfsFile, /Living System · Full Circumference · Max Expansion/);
});
