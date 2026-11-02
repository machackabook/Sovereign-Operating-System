import React, { useState, useEffect } from 'react';
import { X, Cpu, Radio, HardDrive, Wifi, ShieldCheck, RefreshCcw, Activity, Play, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { allDriversService, DriverDescriptor } from '../services/allDriversService';
import { sdrDemodulatorBridge } from '../services/sdrDemodulatorBridge';
import { bluetoothDeviceManager } from '../services/bluetoothDeviceManager';
import { wirelessBeaconBridge } from '../services/wirelessBeaconBridge';
import { googleDriveService } from '../services/googleDriveService';
import { nexusColabDriveBridge } from '../services/nexusColabDriveBridge';
import { vfsPackageManager } from '../services/vfsPackageManager';

interface AllDriversModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AllDriversModal: React.FC<AllDriversModalProps> = ({ isOpen, onClose }) => {
  const [drivers, setDrivers] = useState<DriverDescriptor[]>(allDriversService.getAllDrivers());
  const [selectedDriver, setSelectedDriver] = useState<DriverDescriptor | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  useEffect(() => {
    const unsub = allDriversService.subscribe(() => {
      setDrivers(allDriversService.getAllDrivers());
    });
    const interval = setInterval(() => {
      setDrivers(allDriversService.getAllDrivers());
    }, 1500);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  if (!isOpen) return null;

  const categories = ['ALL', 'HARDWARE', 'RF_WIRELESS', 'STORAGE_VFS', 'CLOUD_TUNNEL', 'MATHEMATICS', 'AUDIO_DSP'];

  const filteredDrivers = activeCategory === 'ALL'
    ? drivers
    : drivers.filter((d) => d.category === activeCategory);

  const handleAction = async (driverId: string) => {
    try {
      if (driverId === 'sdr_fm_demodulator') {
        await sdrDemodulatorBridge.connectSerial();
      } else if (driverId === 'web_bluetooth_ble_gatt') {
        await bluetoothDeviceManager.discoverAndPairDevice();
      } else if (driverId === 'webusb_adb_bus_hub') {
        await wirelessBeaconBridge.connectAdbUsb();
      } else if (driverId === 'google_workspace_oauth_sso') {
        await googleDriveService.signInWithGoogle();
      } else if (driverId === 'nexus_colab_ssh_pipe_tunnel') {
        await nexusColabDriveBridge.executeColabTunnelPrompt('Driver self-test');
      } else if (driverId === 'ram_vfs_package_pipeline') {
        vfsPackageManager.setLockState(!vfsPackageManager.getSystemLockState().isUnlocked);
      }
    } catch (err: any) {
      alert(`Driver action notice: ${err?.message || err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-5xl h-[88vh] flex flex-col rounded-xl border border-cyan-500/40 bg-slate-950 text-cyan-50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
            <div>
              <h2 className="text-lg font-bold tracking-wide text-cyan-300 font-mono">
                ALL DRIVERS // MASTER DRIVER MATRIX
              </h2>
              <p className="text-xs text-slate-400">
                Hardware Peripherals • RF Wireless Tuners • VFS Storage • Cloud Tunnels • Math Engines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Bar */}
        <div className="flex flex-wrap gap-2 border-b border-cyan-500/20 bg-slate-900/40 px-6 py-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition ${
                activeCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Driver List Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDrivers.map((driver) => {
              const isOnline = driver.status === 'ONLINE';
              const isSimulated = driver.status === 'SIMULATED';
              const isConnecting = driver.status === 'CONNECTING';

              return (
                <div
                  key={driver.id}
                  className={`rounded-lg border p-4 space-y-3 transition ${
                    isOnline
                      ? 'border-emerald-500/40 bg-emerald-950/20'
                      : isSimulated
                      ? 'border-cyan-500/40 bg-cyan-950/20'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100 font-mono">{driver.name}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{driver.description}</p>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                        isOnline
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                          : isSimulated
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                          : isConnecting
                          ? 'bg-amber-950 text-amber-300 border-amber-500/50 animate-pulse'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {driver.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                    <span className="bg-slate-950 text-cyan-300 px-2 py-0.5 rounded border border-slate-800">
                      PROTOCOL: {driver.protocol}
                    </span>
                    <span className="bg-slate-950 text-purple-300 px-2 py-0.5 rounded border border-slate-800">
                      PERM: {driver.permissionRequired}
                    </span>
                  </div>

                  {/* Driver Parameters */}
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 font-mono text-xs space-y-1">
                    {Object.entries(driver.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500">{k}:</span>
                        <span className="text-slate-300 font-bold">{String(v)}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleAction(driver.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded border border-cyan-500/40 bg-cyan-950/40 text-xs font-mono font-semibold text-cyan-200 hover:bg-cyan-900/40 transition cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    TRIGGER / INITIALIZE DRIVER
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Status Bar */}
        <div className="border-t border-cyan-500/20 bg-slate-900/80 px-6 py-3 flex justify-between items-center text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>DRIVERS ACTIVE: {drivers.filter((d) => d.status === 'ONLINE' || d.status === 'SIMULATED').length} / {drivers.length}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
