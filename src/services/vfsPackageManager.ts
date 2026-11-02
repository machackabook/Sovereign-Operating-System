/**
 * Unbound RAM-Bound VFS Package Manager Pipeline Workflow
 * Implements in-memory component packaging, locking/unlocking, resolution,
 * and staging pipeline for Sovereign OS applications.
 */

import { vfs } from './vfsService';
import { primeCompressor } from './primeMathCompressor';

export interface VfsPackageManifest {
  name: string;
  version: string;
  description: string;
  main: string;
  author: string;
  license: string;
  isUnlocked: boolean;
  ramUsageEstimateKb: number;
  dependencies: Record<string, string>;
  scripts: Record<string, string>;
  files: string[];
  buildStatus: 'STAGED' | 'BUILT' | 'LOCKED' | 'UNBOUND';
}

export interface PackageBuildResult {
  packageName: string;
  version: string;
  success: boolean;
  compressedSize: number;
  uncompressedSize: number;
  entropyBits: number;
  outputBundlePath: string;
  logs: string[];
}

class VfsPackageManagerService {
  private packageRegistry: Map<string, VfsPackageManifest> = new Map();
  private isUnlocked: boolean = true; // System default: unlocked and unbound RAM-bound
  private listeners: Array<() => void> = [];

  constructor() {
    this.initDefaultPackages();
  }

  private initDefaultPackages() {
    const defaultPkgs: VfsPackageManifest[] = [
      {
        name: '@nexus/core-os',
        version: '4.2.0',
        description: 'Sovereign Core OS Runtime & HyperTerminal Execution Engine',
        main: 'index.mjs',
        author: 'Nexus Engineering',
        license: 'UNBOUND-MIT',
        isUnlocked: true,
        ramUsageEstimateKb: 1420,
        dependencies: {
          '@nexus/polyglot-quine': '^2.1.0',
          '@nexus/symplectic-engine': '^1.5.0',
        },
        scripts: {
          build: 'polyglot build --unbound --ram-only',
          test: 'quine verify --lossless',
        },
        files: ['index.mjs', 'kernel.js', 'causal.mjs'],
        buildStatus: 'UNBOUND',
      },
      {
        name: '@nexus/sdr-demodulator',
        version: '1.8.5',
        description: 'WebSerial & Web Audio Worklet FM Radio Demodulator Package',
        main: 'audio-demodulator-processor.js',
        author: 'RF Telecom Lab',
        license: 'UNBOUND-MIT',
        isUnlocked: true,
        ramUsageEstimateKb: 512,
        dependencies: {
          '@nexus/resonance-engine': '^1.2.0',
        },
        scripts: {
          build: 'worklet compile --low-latency',
        },
        files: ['audio-demodulator-processor.js', 'sdrDemodulatorBridge.ts'],
        buildStatus: 'BUILT',
      },
      {
        name: '@nexus/ble-spatial-matrix',
        version: '2.0.0',
        description: 'Web Bluetooth LE Orbit Projector & Distance Estimator',
        main: 'bluetoothDeviceManager.ts',
        author: 'Spatial BLE Team',
        license: 'UNBOUND-MIT',
        isUnlocked: true,
        ramUsageEstimateKb: 280,
        dependencies: {},
        scripts: {
          build: 'tsc --noEmit',
        },
        files: ['bluetoothDeviceManager.ts'],
        buildStatus: 'BUILT',
      },
      {
        name: '@nexus/colab-drive-bridge',
        version: '1.0.4',
        description: 'Multi-Account Google Drive ↔ Colab REST & Pipe Tunnel Bridge',
        main: 'nexusColabDriveBridge.ts',
        author: 'GAIA Synapse Lab',
        license: 'UNBOUND-MIT',
        isUnlocked: true,
        ramUsageEstimateKb: 840,
        dependencies: {
          'google-drive-api': '^v3',
          'colab-rest-backend': '^latest',
        },
        scripts: {
          probe: 'drive probe --registry',
          sync: 'colab pull --all',
        },
        files: ['Nexus_MultiAccount_Drive_Bridge.ipynb', 'Nexus_Gemini_Colab_Backend.ipynb'],
        buildStatus: 'UNBOUND',
      },
    ];

    defaultPkgs.forEach((pkg) => {
      this.packageRegistry.set(pkg.name, pkg);
      this.writePackageToVfs(pkg);
    });
  }

  private writePackageToVfs(pkg: VfsPackageManifest) {
    try {
      const pkgPath = `/vfs/packages/${pkg.name.replace('@', '').replace('/', '-')}`;
      vfs.mkdir('/vfs', 'packages');
      vfs.mkdir('/vfs/packages', pkg.name.replace('@', '').replace('/', '-'));
      vfs.writeFile('/vfs', `${pkgPath}/package.json`, JSON.stringify(pkg, null, 2));
    } catch {
      // VFS directory handle
    }
  }

  public getPackages(): VfsPackageManifest[] {
    return Array.from(this.packageRegistry.values());
  }

  public getSystemLockState(): { isUnlocked: boolean; mode: string } {
    return {
      isUnlocked: this.isUnlocked,
      mode: this.isUnlocked ? 'VFS: RAM-BOUND (UNBOUND)' : 'VFS: READ-ONLY LOCK',
    };
  }

  public setLockState(unlocked: boolean) {
    this.isUnlocked = unlocked;
    this.packageRegistry.forEach((pkg) => {
      pkg.isUnlocked = unlocked;
      pkg.buildStatus = unlocked ? 'UNBOUND' : 'LOCKED';
    });
    this.notify();
  }

  /**
   * Build and stage package in RAM VFS
   */
  public async buildPackage(packageName: string): Promise<PackageBuildResult> {
    const pkg = this.packageRegistry.get(packageName);
    if (!pkg) {
      throw new Error(`Package ${packageName} not found in VFS registry.`);
    }

    const logs: string[] = [
      `[VFS PM] Initiating build for ${pkg.name}@${pkg.version}...`,
      `[VFS PM] Lock status: ${pkg.isUnlocked ? 'UNBOUND (RAM-BOUND)' : 'LOCKED'}`,
      `[VFS PM] Resolving ${Object.keys(pkg.dependencies).length} dependencies in memory...`,
    ];

    const sourcePayload = JSON.stringify(pkg);
    const { compressed, stats } = primeCompressor.compress(sourcePayload);

    const bundlePath = `/vfs/packages/${pkg.name.replace('@', '').replace('/', '-')}/bundle.prm`;
    vfs.writeFile('/vfs', bundlePath, compressed);

    pkg.buildStatus = 'BUILT';
    logs.push(`[VFS PM] Bundle generated: ${bundlePath} (${compressed.length} bytes compressed)`);
    logs.push(`[VFS PM] Compression Ratio: ${(stats.compressionRatio * 100).toFixed(1)}% | Entropy: ${stats.entropyBitsPerChar.toFixed(2)} bits/char`);

    this.notify();

    return {
      packageName: pkg.name,
      version: pkg.version,
      success: true,
      compressedSize: compressed.length,
      uncompressedSize: sourcePayload.length,
      entropyBits: stats.entropyBitsPerChar,
      outputBundlePath: bundlePath,
      logs,
    };
  }

  public installCustomPackage(manifest: Omit<VfsPackageManifest, 'buildStatus'>): VfsPackageManifest {
    const newPkg: VfsPackageManifest = {
      ...manifest,
      isUnlocked: this.isUnlocked,
      buildStatus: this.isUnlocked ? 'UNBOUND' : 'STAGED',
    };
    this.packageRegistry.set(newPkg.name, newPkg);
    this.writePackageToVfs(newPkg);
    this.notify();
    return newPkg;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const vfsPackageManager = new VfsPackageManagerService();
