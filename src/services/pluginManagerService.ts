/**
 * Plugin & Extension Manager Service
 * Provides dynamic plugin/add-on registration, lifecycle execution, and permission governance
 * within the RAM-bound VFS environment.
 */

import { vfs } from './vfsService';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  category: 'SYSTEM' | 'HARDWARE' | 'VISUAL' | 'MODEL_BRIDGE' | 'COLAB' | 'COMMUNICATIONS' | 'USER_ADDON';
  permissions: Array<'VFS_RAM_READ' | 'VFS_RAM_WRITE' | 'WEB_BLUETOOTH' | 'WEB_SERIAL' | 'WEB_USB' | 'COLAB_TUNNEL' | 'MODEL_TRIGGER'>;
  entryPoint: string; // VFS path or inline JS code
  enabled: boolean;
  installedAt: string;
  isBuiltIn?: boolean;
}

export interface ExtensionHookContext {
  vfs: typeof vfs;
  timestamp: number;
  triggerModel: (actionId: string, payload: any) => Promise<any>;
}

export type PluginHook = (ctx: ExtensionHookContext, payload?: any) => Promise<any> | any;

class PluginManagerService {
  private plugins: Map<string, PluginManifest> = new Map();
  private activeHooks: Map<string, PluginHook> = new Map();
  private listeners: Array<() => void> = [];

  constructor() {
    this.registerDefaultBuiltInPlugins();
  }

  private registerDefaultBuiltInPlugins() {
    const defaultPlugins: PluginManifest[] = [
      {
        id: 'pwa_canvas_escalator',
        name: 'PWA / IWA Canvas GPU Permission Escalator',
        version: '2.4.0',
        description: 'Escalates WebGPU, WebGL2, and device hardware permissions for standalone PWA and Isolated Web App execution.',
        author: 'Nexus OS Kernel',
        category: 'SYSTEM',
        permissions: ['VFS_RAM_READ', 'MODEL_TRIGGER'],
        entryPoint: '/root/plugins/pwa_canvas_escalator.js',
        enabled: true,
        installedAt: new Date().toISOString(),
        isBuiltIn: true,
      },
      {
        id: 'colab_multiaccount_drive_bridge',
        name: 'Multi-Account Google Drive ↔ Colab Tunnel Add-on',
        version: '1.9.5',
        description: 'Dynamic SSO tunnel connecting Colab REST endpoints, notebook runtime candidates, and Drive file registries.',
        author: 'GAIA Synapse Core',
        category: 'COLAB',
        permissions: ['COLAB_TUNNEL', 'VFS_RAM_READ', 'VFS_RAM_WRITE'],
        entryPoint: '/root/plugins/colab_multiaccount_drive_bridge.js',
        enabled: true,
        installedAt: new Date().toISOString(),
        isBuiltIn: true,
      },
      {
        id: 'ram_vfs_package_pipeline',
        name: 'Unbound VFS RAM Package Manager Pipeline',
        version: '3.1.0',
        description: 'Dynamic in-memory component packager, dependency resolver, and hot-swappable bundle builder.',
        author: 'Sovereign Quine Core',
        category: 'SYSTEM',
        permissions: ['VFS_RAM_READ', 'VFS_RAM_WRITE'],
        entryPoint: '/root/plugins/ram_vfs_package_pipeline.js',
        enabled: true,
        installedAt: new Date().toISOString(),
        isBuiltIn: true,
      },
      {
        id: 'ble_sdr_hardware_gateway',
        name: 'BLE / WebSerial SDR Hardware Peripheral Matrix',
        version: '1.8.0',
        description: 'Direct Web Bluetooth GATT and WebSerial I/Q RF stream ingestion hook into AudioWorklet demodulator.',
        author: 'Nexus Hardware Lab',
        category: 'HARDWARE',
        permissions: ['WEB_BLUETOOTH', 'WEB_SERIAL', 'WEB_USB'],
        entryPoint: '/root/plugins/ble_sdr_hardware_gateway.js',
        enabled: true,
        installedAt: new Date().toISOString(),
        isBuiltIn: true,
      },
      {
        id: 'vertical_model_source_link',
        name: 'Vertical Model Capability Source Link Trigger Engine',
        version: '2.0.1',
        description: 'Interoperable source link binding internal function calls to AI model execution triggers.',
        author: 'Synapse AI Engine',
        category: 'MODEL_BRIDGE',
        permissions: ['MODEL_TRIGGER'],
        entryPoint: '/root/plugins/vertical_model_source_link.js',
        enabled: true,
        installedAt: new Date().toISOString(),
        isBuiltIn: true,
      },
      {
        id: 'raveneyte_pulse_plugin',
        name: 'RavenEyeTE Telemetry Core & NextBenchUp Pulse Plugin',
        version: '1.0.0',
        description: 'High-precision pulse engine, Planetarium Pluto Return orbit calculator, and OpenWrt gateway telemetry hook.',
        author: 'RavenEyeTE Core',
        category: 'SYSTEM',
        permissions: ['MODEL_TRIGGER', 'VFS_RAM_READ'],
        entryPoint: '/root/scripts/raveneyte_pulse_engine.py',
        enabled: true,
        installedAt: new Date().toISOString(),
        isBuiltIn: true,
      },
    ];

    defaultPlugins.forEach((p) => {
      this.plugins.set(p.id, p);
      this.writePluginToVfs(p);
    });
  }

  private writePluginToVfs(plugin: PluginManifest) {
    try {
      const code = `/**
 * Plugin: ${plugin.name} (${plugin.id})
 * Version: ${plugin.version}
 * Category: ${plugin.category}
 */
export async function onLoad(ctx) {
  console.log('[PluginManager] Loaded extension:', "${plugin.name}");
  return { status: 'ACTIVE', pluginId: "${plugin.id}" };
}
`;
      vfs.mkdir('/root', 'plugins');
      vfs.writeFile('/root', `plugins/${plugin.id}.js`, code);
    } catch {
      // VFS directory may already exist
    }
  }

  public getPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }

  public getPlugin(id: string): PluginManifest | undefined {
    return this.plugins.get(id);
  }

  public togglePlugin(id: string, enabled?: boolean): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    plugin.enabled = enabled !== undefined ? enabled : !plugin.enabled;
    this.notify();
    return plugin.enabled;
  }

  public installPlugin(manifest: Omit<PluginManifest, 'installedAt'>): PluginManifest {
    const newPlugin: PluginManifest = {
      ...manifest,
      installedAt: new Date().toISOString(),
    };
    this.plugins.set(newPlugin.id, newPlugin);
    this.writePluginToVfs(newPlugin);
    this.notify();
    return newPlugin;
  }

  public uninstallPlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;
    if (plugin.isBuiltIn) {
      throw new Error(`Cannot uninstall built-in system plugin: ${plugin.name}`);
    }
    this.plugins.delete(id);
    this.notify();
    return true;
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

export const pluginManagerService = new PluginManagerService();
