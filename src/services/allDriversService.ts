/**
 * All Drivers Subsystem Service
 * Central aggregator for all physical, virtual, and protocol drivers in HyperPolyglot Sovereign OS.
 */

import { sdrDemodulatorBridge } from './sdrDemodulatorBridge';
import { bluetoothDeviceManager } from './bluetoothDeviceManager';
import { wirelessBeaconBridge } from './wirelessBeaconBridge';
import { googleDriveService } from './googleDriveService';
import { nexusColabDriveBridge } from './nexusColabDriveBridge';
import { vfsPackageManager } from './vfsPackageManager';
import { pluginManagerService } from './pluginManagerService';
import { sqe } from './symplecticEngine';
import { causalCore } from './causalCore.mjs';
import { geoNexusService } from './geoNexusService';

export interface DriverDescriptor {
  id: string;
  name: string;
  category: 'HARDWARE' | 'RF_WIRELESS' | 'STORAGE_VFS' | 'CLOUD_TUNNEL' | 'MATHEMATICS' | 'AUDIO_DSP';
  protocol: 'WebSerial' | 'WebBluetooth' | 'WebUSB' | 'WebAudio' | 'OAuth2' | 'SSH_Pipe' | 'VFS_RAM' | 'BrowserAPI';
  status: 'ONLINE' | 'STANDBY' | 'CONNECTING' | 'SIMULATED' | 'OFFLINE';
  permissionRequired: string;
  description: string;
  details: Record<string, any>;
}

class AllDriversService {
  private listeners: Array<() => void> = [];

  public getAllDrivers(): DriverDescriptor[] {
    const sdrStatus = sdrDemodulatorBridge.getTelemetry();
    const bleStatus = bluetoothDeviceManager.getStatus();
    const beaconConfig = wirelessBeaconBridge.getBeaconConfig();
    const adbDevices = wirelessBeaconBridge.getAdbDevices();
    const driveStatus = googleDriveService.getStatus();
    const colabStatus = nexusColabDriveBridge.getTunnelStatus();
    const vfsLock = vfsPackageManager.getSystemLockState();
    const sqeState = sqe.getState();
    const causalStatus = causalCore.status();
    const geoStatus = geoNexusService.getTelemetry();

    return [
      {
        id: 'sdr_fm_demodulator',
        name: 'RTL-SDR / HackRF USB Wideband FM Demodulator Driver',
        category: 'RF_WIRELESS',
        protocol: 'WebSerial',
        status: sdrStatus.sourceType !== 'synthetic-carrier' ? 'ONLINE' : 'SIMULATED',
        permissionRequired: 'serial / usb',
        description: 'Direct I/Q raw byte stream ingestion & AudioWorklet polar discriminator DSP',
        details: {
          frequencyMhz: sdrStatus.frequencyMhz,
          mode: sdrStatus.sourceType !== 'synthetic-carrier' ? 'Hardware USB' : 'Synthetic Broadcast Generator',
          sampleRateHz: sdrStatus.sampleRate,
          gainDb: sdrStatus.gain,
        },
      },
      {
        id: 'web_bluetooth_ble_gatt',
        name: 'Web Bluetooth LE Peripheral & GATT Driver',
        category: 'HARDWARE',
        protocol: 'WebBluetooth',
        status: bleStatus.connectedCount > 0 ? 'ONLINE' : bleStatus.isSupported ? 'STANDBY' : 'OFFLINE',
        permissionRequired: 'bluetooth',
        description: 'BLE advertisement watching, GATT battery/service reading & 3D spatial orbit projection',
        details: {
          devicesInCatalog: bleStatus.deviceCount,
          activeGattConnections: bleStatus.connectedCount,
          browserSupported: bleStatus.isSupported,
        },
      },
      {
        id: 'webusb_adb_bus_hub',
        name: 'WebUSB ADB Bus & Composite Device Hub Driver',
        category: 'HARDWARE',
        protocol: 'WebUSB',
        status: adbDevices.some((d) => d.connected) ? 'ONLINE' : 'STANDBY',
        permissionRequired: 'usb',
        description: 'Bidirectional ADB protocol driver & USB host controller bus explorer',
        details: {
          attachedBusNodes: adbDevices.length,
          activeInterfaces: adbDevices.flatMap((d) => d.interfaces).length,
        },
      },
      {
        id: 'audio_worklet_pcm_dsp',
        name: 'Web Audio Worklet Real-Time PCM Audio Driver',
        category: 'AUDIO_DSP',
        protocol: 'WebAudio',
        status: 'ONLINE',
        permissionRequired: 'audio',
        description: '16,384-sample ring buffer audio processor with 0.995 single-pole DC blocking filter',
        details: {
          ringBufferCapacity: 16384,
          dcBlockingFactor: 0.995,
          underrunConcealment: true,
        },
      },
      {
        id: 'wifi_beacon_carrier_synth',
        name: '802.11 Carrier Wave & Multiplexed Beacon Synthesizer',
        category: 'RF_WIRELESS',
        protocol: 'BrowserAPI',
        status: 'ONLINE',
        permissionRequired: 'none',
        description: 'Multi-BSSID beacon frame synthesizer and multi-AP Wi-Fi bonding abstraction',
        details: {
          primarySsid: beaconConfig.primarySsid,
          virtualBssidsCount: beaconConfig.virtualBssids.length,
          carrierModulation: beaconConfig.carrierModulation,
        },
      },
      {
        id: 'google_workspace_oauth_sso',
        name: 'Google Workspace OAuth2 SSO Authentication Driver',
        category: 'CLOUD_TUNNEL',
        protocol: 'OAuth2',
        status: driveStatus.isAuthenticated ? 'ONLINE' : 'STANDBY',
        permissionRequired: 'drive.readonly, drive.file',
        description: 'Single sign-on driver with in-memory access token caching',
        details: {
          userEmail: driveStatus.userEmail || 'Not Authenticated',
          lastSyncedAt: driveStatus.lastSyncedAt || 'N/A',
          geminiMdFound: !!driveStatus.geminiFileMeta,
        },
      },
      {
        id: 'nexus_colab_ssh_pipe_tunnel',
        name: 'Multi-Account Google Drive ↔ Colab SSH Pipe Tunnel Driver',
        category: 'CLOUD_TUNNEL',
        protocol: 'SSH_Pipe',
        status: colabStatus === 'TUNNEL_OPEN' ? 'ONLINE' : colabStatus === 'CONNECTING' ? 'CONNECTING' : 'STANDBY',
        permissionRequired: 'COLAB_TUNNEL',
        description: 'SSH pipe transport for Colab REST backend and canonical notebook corpus',
        details: {
          tunnelState: colabStatus,
          canonicalRegistryEntries: 6,
        },
      },
      {
        id: 'ram_vfs_package_pipeline',
        name: 'RAM-Bound VFS Package Manager Pipeline Driver',
        category: 'STORAGE_VFS',
        protocol: 'VFS_RAM',
        status: vfsLock.isUnlocked ? 'ONLINE' : 'STANDBY',
        permissionRequired: 'VFS_RAM_WRITE',
        description: 'Unbound in-memory package builder, dependency resolver & bundle packager',
        details: {
          lockMode: vfsLock.mode,
          packagesInRegistry: vfsPackageManager.getPackages().length,
        },
      },
      {
        id: 'symplectic_quine_engine',
        name: 'Symplectic Quine Hamiltonian Phase-Space Driver',
        category: 'MATHEMATICS',
        protocol: 'BrowserAPI',
        status: 'ONLINE',
        permissionRequired: 'none',
        description: 'Conservatively integrates code mutation trajectory via Leapfrog symplectic algorithm',
        details: {
          hamiltonianEnergy: Number(sqeState.hamiltonian.toFixed(3)),
          momentumP: Number(sqeState.p.toFixed(3)),
          kineticT: Number(sqeState.kinetic.toFixed(3)),
          potentialV: Number(sqeState.potential.toFixed(3)),
        },
      },
      {
        id: 'causal_core_steered_graph',
        name: 'Causal Core Induced Steered Graph Driver',
        category: 'MATHEMATICS',
        protocol: 'BrowserAPI',
        status: 'ONLINE',
        permissionRequired: 'none',
        description: 'Ternary relation causality observer and local session state rollback manager',
        details: {
          eventsObserved: causalStatus.eventsObserved,
          retainedVertices: causalStatus.vertices,
          frameAvgMs: Number(causalStatus.frameAverageMs.toFixed(2)),
        },
      },
      {
        id: 'browser_geolocation_terrasphere',
        name: 'Terrasphere Geolocation & Satellite Telemetry Driver',
        category: 'HARDWARE',
        protocol: 'BrowserAPI',
        status: geoStatus.status === 'active' ? 'ONLINE' : 'STANDBY',
        permissionRequired: 'geolocation',
        description: 'Session-only GPS latitude, longitude, and accuracy tracker',
        details: {
          lat: Number(geoStatus.lat.toFixed(4)),
          lng: Number(geoStatus.lng.toFixed(4)),
          accuracyMeters: geoStatus.accuracyMeters || 0,
        },
      },
    ];
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }
}

export const allDriversService = new AllDriversService();
