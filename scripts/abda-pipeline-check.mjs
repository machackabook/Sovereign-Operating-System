#!/usr/bin/env node
/**
 * ABDA Automated Trigger Script
 * Executed during Git pre-commit hooks & container spin-up sequences.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('========================================================================');
console.log('⚡ ABDA PIPELINE: AUTOMATED BUILD & DIAGNOSTIC AUDIT INITIALIZING');
console.log('========================================================================');

// Phase 1: Pre-Flight Dependency & Configuration Isolation
console.log('\n[PHASE 1: PRE-FLIGHT DEPENDENCY & CONFIGURATION ISOLATION]');
const crucialFiles = [
  'metadata.json',
  'firebase-applet-config.json',
  'firebase-blueprint.json',
  'firestore.rules',
  'package.json',
  'index.html',
];

let p1Success = true;
for (const file of crucialFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✓ Configuration anchor verified: ${file}`);
  } else {
    console.error(`  ❌ Missing crucial file: ${file}`);
    p1Success = false;
  }
}

if (!p1Success) {
  console.error('\n❌ ABDA Phase 1 Pre-Flight Check Failed!');
  process.exit(1);
}

// Phase 2: Compilation & Code Quality Verification
console.log('\n[PHASE 2: COMPILATION & CODE QUALITY VERIFICATION]');
try {
  console.log('  Executing strict TypeScript compilation audit (tsc --noEmit)...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('  ✓ Type-check passed with 0 errors.');
} catch (err) {
  console.error('\n❌ ABDA Phase 2 Code Quality Check Failed!');
  process.exit(1);
}

// Phase 3: Runtime Matrix Posture Verification
console.log('\n[PHASE 3: RUNTIME MATRIX POSTURE VERIFICATION]');
try {
  console.log('  Running automated test suites...');
  const testFiles = fs.readdirSync('tests').filter((f) => f.endsWith('.test.mjs')).map((f) => `tests/${f}`).join(' ');
  execSync(`npx tsx --test ${testFiles}`, { stdio: 'inherit' });
  console.log('  ✓ Runtime matrix test suites passed 100%.');
} catch (err) {
  console.error('\n❌ ABDA Phase 3 Runtime Matrix Verification Failed!');
  process.exit(1);
}

console.log('\n========================================================================');
console.log('✨ ABDA PIPELINE PASSED 100% — WORKSPACE POSTURE VERIFIED & SECURED');
console.log('========================================================================\n');
