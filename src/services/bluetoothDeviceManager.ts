/**
 * BluetoothDeviceManager Service
 * Sovereign Web Bluetooth API Driver & BLE Peripheral Manager
 * 
 * Capabilities:
 * 1. Web Bluetooth API discovery (requestDevice) & GATT connection/disconnection management
 * 2. Persistent permission tracking (navigator.bluetooth.getDevices()) & advertisement watching (watchAdvertisements)
 * 3. Reactive device catalog with RSSI proximity, battery telemetry, and service UUIDs
 * 4. 3D spatial coordinate projection (radial distance mapped from RSSI/path loss) for Three.js VisualRenderer3D
 * 5. High-fidelity synthetic peripheral simulation for immediate multi-device demonstration
 */

export type BleConnectionState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting';

export interface BleDeviceRecord {
  id: string;
  name: string;
  connectionState: BleConnectionState;
  rssi: number; // in dBm (e.g. -45 dBm strong, -85 dBm weak)
  txPower?: number; // dBm at 1m (typically -59 dBm)
  estimatedDistanceMeters: number;
  batteryLevel?: number; // 0-100%
  serviceUuids: string[];
  manufacturerData?: Record<string, string>;
  lastSeen: number; // timestamp
  isSimulated: boolean;
  gattServer?: any;
  deviceRef?: any;
  // 3D Spatial Presence parameters for VisualRenderer3D
  spatialPosition: {
    x: number;
    y: number;
    z: number;
    orbitRadius: number;
    orbitSpeed: number;
    orbitAngle: number;
  };
}

export interface BluetoothManagerStatus {
  isSupported: boolean;
  isScanning: boolean;
  deviceCount: number;
  connectedCount: number;
  lastUpdated: string;
}

export type BleCatalogListener = (devices: BleDeviceRecord[]) => void;
export type BleStatusListener = (status: BluetoothManagerStatus) => void;

export class BluetoothDeviceManager {
  private static instance: BluetoothDeviceManager;

  private catalog: Map<string, BleDeviceRecord> = new Map();
  private catalogListeners: Set<BleCatalogListener> = new Set();
  private statusListeners: Set<BleStatusListener> = new Set();
  private isScanning: boolean = false;
  private animInterval: any = null;

  private constructor() {
    this.initSyntheticDevices();
    this.startProximitySimulationLoop();
    this.checkPersistentDevices();
  }

  public static getInstance(): BluetoothDeviceManager {
    if (!BluetoothDeviceManager.instance) {
      BluetoothDeviceManager.instance = new BluetoothDeviceManager();
    }
    return BluetoothDeviceManager.instance;
  }

  // =========================================================================
  // 1. HARDWARE DISCOVERY & GATT PAIRING (WEB BLUETOOTH API)
  // =========================================================================

  /**
   * Prompts the native browser Web Bluetooth device selector to discover and pair a nearby BLE device.
   */
  public async discoverAndPairDevice(): Promise<{ success: boolean; device?: BleDeviceRecord; message: string }> {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      return {
        success: false,
        message: 'Web Bluetooth API is unsupported in this browser. Ensure Chrome/Edge or ChromeOS flag #enable-web-bluetooth-new-permissions-backend is enabled.',
      };
    }

    try {
      this.isScanning = true;
      this.notifyStatusListeners();

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'battery_service',
          'device_information',
          'generic_access',
          'generic_attribute',
          'heart_rate',
          'environmental_sensing',
          '0000fee0-0000-1000-8000-00805f9b34fb', // Smart band / BLE tag
          '0000fff0-0000-1000-8000-00805f9b34fb', // Custom telemetry service
        ],
      });

      const initialRssi = -55;
      const initialDist = this.calculateDistance(initialRssi, -59);
      const angle = (this.catalog.size * Math.PI) / 3;

      const record: BleDeviceRecord = {
        id: device.id,
        name: device.name || 'Discovered BLE Peripheral',
        connectionState: 'connecting',
        rssi: initialRssi,
        txPower: -59,
        estimatedDistanceMeters: initialDist,
        serviceUuids: [],
        lastSeen: Date.now(),
        isSimulated: false,
        deviceRef: device,
        spatialPosition: {
          x: Math.cos(angle) * (35 + initialDist * 8),
          y: (Math.sin(angle * 2) * 15),
          z: Math.sin(angle) * (35 + initialDist * 8),
          orbitRadius: 35 + initialDist * 8,
          orbitSpeed: 0.35 + Math.random() * 0.2,
          orbitAngle: angle,
        },
      };

      this.catalog.set(device.id, record);
      this.notifyCatalogListeners();

      // Listen for disconnection events
      device.addEventListener('gattserverdisconnected', () => {
        const d = this.catalog.get(device.id);
        if (d) {
          d.connectionState = 'disconnected';
          d.gattServer = null;
          this.notifyCatalogListeners();
          this.notifyStatusListeners();
        }
      });

      // Connect to GATT Server
      if (device.gatt) {
        try {
          const server = await device.gatt.connect();
          record.gattServer = server;
          record.connectionState = server.connected ? 'connected' : 'disconnected';

          // Attempt reading battery level
          try {
            const batteryService = await server.getPrimaryService('battery_service');
            const batteryChar = await batteryService.getCharacteristic('battery_level');
            const val = await batteryChar.readValue();
            record.batteryLevel = val.getUint8(0);
          } catch {
            // Battery service is optional
          }

          // Discover services
          try {
            const services = await server.getPrimaryServices();
            record.serviceUuids = services.map((s: any) => s.uuid);
          } catch {
            // Optional service discovery
          }
        } catch (gattErr: any) {
          console.warn('[BluetoothDeviceManager] GATT connect error:', gattErr);
          record.connectionState = 'disconnected';
        }
      }

      // Check if advertisement watching is supported (ChromeOS flag)
      if (device.watchAdvertisements) {
        try {
          await device.watchAdvertisements();
          device.addEventListener('advertisementreceived', (event: any) => {
            const d = this.catalog.get(device.id);
            if (d) {
              d.rssi = event.rssi || d.rssi;
              d.txPower = event.txPower || d.txPower;
              d.estimatedDistanceMeters = this.calculateDistance(d.rssi, d.txPower || -59);
              d.lastSeen = Date.now();
              this.updateSpatialFromRssi(d);
              this.notifyCatalogListeners();
            }
          });
        } catch {
          // Ignore if watchAdvertisements not granted
        }
      }

      this.isScanning = false;
      this.notifyCatalogListeners();
      this.notifyStatusListeners();

      return {
        success: true,
        device: record,
        message: `Paired and cataloged BLE peripheral: ${record.name} (${record.id})`,
      };
    } catch (err: any) {
      this.isScanning = false;
      this.notifyStatusListeners();
      return {
        success: false,
        message: `Bluetooth discovery aborted: ${err?.message || err}`,
      };
    }
  }

  /**
   * Connects to a previously cataloged BLE device's GATT server.
   */
  public async connectDevice(id: string): Promise<boolean> {
    const dev = this.catalog.get(id);
    if (!dev) return false;

    if (dev.isSimulated) {
      dev.connectionState = 'connected';
      this.notifyCatalogListeners();
      this.notifyStatusListeners();
      return true;
    }

    if (!dev.deviceRef || !dev.deviceRef.gatt) return false;

    try {
      dev.connectionState = 'connecting';
      this.notifyCatalogListeners();

      const server = await dev.deviceRef.gatt.connect();
      dev.gattServer = server;
      dev.connectionState = server.connected ? 'connected' : 'disconnected';
      this.notifyCatalogListeners();
      this.notifyStatusListeners();
      return server.connected;
    } catch (err) {
      console.warn('[BluetoothDeviceManager] Reconnect error:', err);
      dev.connectionState = 'disconnected';
      this.notifyCatalogListeners();
      this.notifyStatusListeners();
      return false;
    }
  }

  /**
   * Disconnects a BLE device.
   */
  public disconnectDevice(id: string): boolean {
    const dev = this.catalog.get(id);
    if (!dev) return false;

    if (dev.isSimulated) {
      dev.connectionState = 'disconnected';
      this.notifyCatalogListeners();
      this.notifyStatusListeners();
      return true;
    }

    if (dev.deviceRef && dev.deviceRef.gatt && dev.deviceRef.gatt.connected) {
      try {
        dev.deviceRef.gatt.disconnect();
        dev.connectionState = 'disconnected';
        this.notifyCatalogListeners();
        this.notifyStatusListeners();
        return true;
      } catch (err) {
        console.warn('[BluetoothDeviceManager] Disconnect error:', err);
        return false;
      }
    }
    return false;
  }

  /**
   * Loads already permitted devices in Chromium if supported.
   */
  public async checkPersistentDevices() {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator && (navigator as any).bluetooth.getDevices) {
      try {
        const devices = await (navigator as any).bluetooth.getDevices();
        devices.forEach((dev: any) => {
          if (!this.catalog.has(dev.id)) {
            const angle = (this.catalog.size * Math.PI) / 3;
            this.catalog.set(dev.id, {
              id: dev.id,
              name: dev.name || 'Permitted BLE Peripheral',
              connectionState: dev.gatt?.connected ? 'connected' : 'disconnected',
              rssi: -60,
              txPower: -59,
              estimatedDistanceMeters: 1.1,
              serviceUuids: [],
              lastSeen: Date.now(),
              isSimulated: false,
              deviceRef: dev,
              spatialPosition: {
                x: Math.cos(angle) * 45,
                y: 5,
                z: Math.sin(angle) * 45,
                orbitRadius: 45,
                orbitSpeed: 0.4,
                orbitAngle: angle,
              },
            });
          }
        });
        this.notifyCatalogListeners();
        this.notifyStatusListeners();
      } catch {
        // Ignore
      }
    }
  }

  // =========================================================================
  // 2. 3D SPATIAL PROJECTION & PROXIMITY CALCULATIONS
  // =========================================================================

  /**
   * Estimates physical distance in meters using the Log-Distance Path Loss Model:
   * d = 10 ^ ((TxPower - RSSI) / (10 * n)) where n is the path-loss exponent (typically 2.0 to 2.5 indoors).
   */
  public calculateDistance(rssi: number, txPower: number = -59, pathLossExponent: number = 2.2): number {
    const exp = (txPower - rssi) / (10 * pathLossExponent);
    return Math.max(0.1, Number(Math.pow(10, exp).toFixed(2)));
  }

  private updateSpatialFromRssi(dev: BleDeviceRecord) {
    const dist = dev.estimatedDistanceMeters;
    // Map 0.1m - 15m physical distance to 20 - 90 3D world space radius
    const orbitRadius = Math.max(22, Math.min(95, 20 + dist * 6.5));
    dev.spatialPosition.orbitRadius = orbitRadius;
    dev.spatialPosition.x = Math.cos(dev.spatialPosition.orbitAngle) * orbitRadius;
    dev.spatialPosition.z = Math.sin(dev.spatialPosition.orbitAngle) * orbitRadius;
  }

  // =========================================================================
  // 3. SYNTHETIC BLE PERIPHERAL SIMULATION FOR DEMO/TESTING
  // =========================================================================

  private initSyntheticDevices() {
    const presets: {
      id: string;
      name: string;
      rssi: number;
      txPower: number;
      batteryLevel: number;
      connectionState: BleConnectionState;
      serviceUuids: string[];
      angle: number;
    }[] = [
      {
        id: 'ble-v380-pro-cam',
        name: 'V380_PRO_IP_CAMERA',
        rssi: -52,
        txPower: -59,
        batteryLevel: 98,
        connectionState: 'connected',
        serviceUuids: ['0000fee0-0000-1000-8000-00805f9b34fb', '0000180a-0000-1000-8000-00805f9b34fb'],
        angle: 0.2,
      },
      {
        id: 'ble-fcc15-beacon-core',
        name: 'FCC15_BEACON_NODE_ALPHA',
        rssi: -65,
        txPower: -59,
        batteryLevel: 84,
        connectionState: 'connected',
        serviceUuids: ['0000180f-0000-1000-8000-00805f9b34fb'],
        angle: 1.8,
      },
      {
        id: 'ble-rtl-sdr-dongle',
        name: 'RTL_SDR_BLUETOOTH_BRIDGE',
        rssi: -44,
        txPower: -55,
        batteryLevel: 100,
        connectionState: 'connected',
        serviceUuids: ['00001800-0000-1000-8000-00805f9b34fb'],
        angle: 3.4,
      },
      {
        id: 'ble-drone-telemetry-tag',
        name: 'DRONE_ORBIT_TELEMETRY_TAG',
        rssi: -74,
        txPower: -59,
        batteryLevel: 71,
        connectionState: 'disconnected',
        serviceUuids: ['0000fff0-0000-1000-8000-00805f9b34fb'],
        angle: 4.9,
      },
    ];

    presets.forEach((p) => {
      const dist = this.calculateDistance(p.rssi, p.txPower);
      const orbitRadius = 25 + dist * 6.5;
      this.catalog.set(p.id, {
        id: p.id,
        name: p.name,
        connectionState: p.connectionState,
        rssi: p.rssi,
        txPower: p.txPower,
        estimatedDistanceMeters: dist,
        batteryLevel: p.batteryLevel,
        serviceUuids: p.serviceUuids,
        lastSeen: Date.now(),
        isSimulated: true,
        spatialPosition: {
          x: Math.cos(p.angle) * orbitRadius,
          y: Math.sin(p.angle * 2) * 12,
          z: Math.sin(p.angle) * orbitRadius,
          orbitRadius,
          orbitSpeed: 0.3 + Math.random() * 0.15,
          orbitAngle: p.angle,
        },
      });
    });
  }

  private startProximitySimulationLoop() {
    if (this.animInterval) clearInterval(this.animInterval);

    this.animInterval = setInterval(() => {
      let changed = false;
      this.catalog.forEach((dev) => {
        // Orbit animation in 3D space
        dev.spatialPosition.orbitAngle += (dev.spatialPosition.orbitSpeed * 0.02);
        if (dev.spatialPosition.orbitAngle > Math.PI * 2) {
          dev.spatialPosition.orbitAngle -= Math.PI * 2;
        }

        dev.spatialPosition.x = Math.cos(dev.spatialPosition.orbitAngle) * dev.spatialPosition.orbitRadius;
        dev.spatialPosition.z = Math.sin(dev.spatialPosition.orbitAngle) * dev.spatialPosition.orbitRadius;
        dev.spatialPosition.y = Math.sin(dev.spatialPosition.orbitAngle * 1.5) * 10;

        // Subtle RSSI jitter for simulated devices to emulate RF fading
        if (dev.isSimulated) {
          const delta = (Math.random() - 0.5) * 1.2;
          dev.rssi = Math.max(-95, Math.min(-35, Number((dev.rssi + delta).toFixed(1))));
          dev.estimatedDistanceMeters = this.calculateDistance(dev.rssi, dev.txPower || -59);
          dev.lastSeen = Date.now();
          changed = true;
        }
      });

      if (changed) {
        this.notifyCatalogListeners();
      }
    }, 1500);
  }

  // =========================================================================
  // 4. ROSTER & OBSERVABLE SUBSCRIPTIONS
  // =========================================================================

  public getDevices(): BleDeviceRecord[] {
    return Array.from(this.catalog.values());
  }

  public getConnectedDevices(): BleDeviceRecord[] {
    return this.getDevices().filter((d) => d.connectionState === 'connected');
  }

  public getStatus(): BluetoothManagerStatus {
    const devices = this.getDevices();
    return {
      isSupported: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
      isScanning: this.isScanning,
      deviceCount: devices.length,
      connectedCount: devices.filter((d) => d.connectionState === 'connected').length,
      lastUpdated: new Date().toLocaleTimeString(),
    };
  }

  public subscribe(cb: BleCatalogListener): () => void {
    this.catalogListeners.add(cb);
    cb(this.getDevices());
    return () => this.catalogListeners.delete(cb);
  }

  public subscribeStatus(cb: BleStatusListener): () => void {
    this.statusListeners.add(cb);
    cb(this.getStatus());
    return () => this.statusListeners.delete(cb);
  }

  private notifyCatalogListeners() {
    const list = this.getDevices();
    this.catalogListeners.forEach((cb) => {
      try {
        cb(list);
      } catch (err) {
        console.error('[BluetoothDeviceManager] Catalog callback error:', err);
      }
    });
  }

  private notifyStatusListeners() {
    const status = this.getStatus();
    this.statusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (err) {
        console.error('[BluetoothDeviceManager] Status callback error:', err);
      }
    });
  }
}

export const bluetoothDeviceManager = BluetoothDeviceManager.getInstance();
