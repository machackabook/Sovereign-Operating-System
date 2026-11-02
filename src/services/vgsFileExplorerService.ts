/**
 * VGS (Virtual Graphics System) GiFile Explorer Service
 * Provides graphical interface file format (.gifile, .vgs) management,
 * 2D/3D visual asset previews, hex inspections, and polyglot artifact rendering.
 */

import { vfs } from './vfsService';
import { polyglotEncodingEngine, PolyglotArtifact } from './polyglotEncodingEngine';
import { fileSystemBootChain, DiskImageMeta } from './fileSystemBootChain';

export interface VGSGiFileRecord {
  id: string;
  name: string;
  path: string;
  extension: string;
  isPolyglot: boolean;
  polyglotFormats?: string[];
  sizeBytes: number;
  mimeType: string;
  previewType: 'IMAGE_CANVAS' | 'HEX_STREAM' | 'VECTOR_GRAPHICS' | 'POLYGLOT_CODE';
  previewData?: string;
  hexPreview?: string;
  modifiedAt: string;
}

class VGSFileExplorerService {
  private listeners: Array<() => void> = [];

  /**
   * Scans VFS, Disk Images, and Polyglot Engine to produce a unified VGS GiFile list
   */
  public getGiFiles(): VGSGiFileRecord[] {
    const files: VGSGiFileRecord[] = [];

    // 1. Polyglot Artifacts from PolyglotEncodingEngine
    polyglotEncodingEngine.getArtifacts().forEach((art) => {
      files.push({
        id: art.id,
        name: art.filename,
        path: `/root/polyglot/${art.filename}`,
        extension: art.filename.split('.').pop() || 'polyglot',
        isPolyglot: true,
        polyglotFormats: art.validFormats,
        sizeBytes: art.sizeBytes,
        mimeType: art.mimeType,
        previewType: 'POLYGLOT_CODE',
        previewData: art.payloadText.slice(0, 500),
        hexPreview: Array.from(art.bytes.slice(0, 32))
          .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
          .join(' '),
        modifiedAt: art.createdAt,
      });
    });

    // 2. Mounted Disk Images from FileSystemBootChain
    fileSystemBootChain.getMountedImages().forEach((img) => {
      files.push({
        id: `img-${img.filename}`,
        name: img.filename,
        path: img.mountPoint,
        extension: img.format,
        isPolyglot: img.format === 'iso' || img.partitionTable === 'HYBRID_POLYGLOT',
        polyglotFormats: [img.format.toUpperCase(), img.partitionTable],
        sizeBytes: img.sizeBytes,
        mimeType: `application/x-${img.format}-image`,
        previewType: 'HEX_STREAM',
        previewData: `Mount Point: ${img.mountPoint} | Sector Size: ${img.sectorSize}B | SHA256: ${img.checksumSha256}`,
        hexPreview: 'EB 3C 90 53 4F 56 45 52 45 49 47 4E 20 4F 53 20 42 4F 4F 54',
        modifiedAt: img.mountedAt,
      });
    });

    // 3. Default VGS Graphical Vector Assets (.gifile & .vgs)
    files.push({
      id: 'vgs-quantum-vector-01',
      name: 'sovereign_neural_topology.gifile',
      path: '/root/graphics/sovereign_neural_topology.gifile',
      extension: 'gifile',
      isPolyglot: true,
      polyglotFormats: ['VGS Vector Canvas', 'WebGL Shading Code'],
      sizeBytes: 1024 * 48,
      mimeType: 'image/x-vgs-gifile',
      previewType: 'VECTOR_GRAPHICS',
      previewData: '<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" stroke="#00f2ff" stroke-width="2" fill="none"/><polygon points="100,20 170,150 30,150" stroke="#a855f7" stroke-width="2" fill="none"/></svg>',
      hexPreview: '56 47 53 32 30 32 36 20 4E 45 55 52 41 4C 20 54 4F 50 4F 4C',
      modifiedAt: new Date().toISOString(),
    });

    files.push({
      id: 'vgs-solfeggio-spindle-02',
      name: 'solfeggio_963hz_oscillator.vgs',
      path: '/root/graphics/solfeggio_963hz_oscillator.vgs',
      extension: 'vgs',
      isPolyglot: true,
      polyglotFormats: ['VGS 3D Spindle Geometry', 'Audio Soliton Wave'],
      sizeBytes: 1024 * 32,
      mimeType: 'image/x-vgs-gifile',
      previewType: 'IMAGE_CANVAS',
      previewData: 'SOLFEGGIO_963HZ_HARMONIC_SOLITON_WAVEFORM',
      hexPreview: '53 4F 4C 46 45 47 47 49 4F 20 39 36 33 48 5A 20 57 41 56 45',
      modifiedAt: new Date().toISOString(),
    });

    return files;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public notify() {
    this.listeners.forEach((l) => l());
  }
}

export const vgsFileExplorerService = new VGSFileExplorerService();
