import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, 
  Terminal, 
  HardDrive, 
  Cpu, 
  X, 
  Plus, 
  ArrowRight, 
  Shield, 
  Smartphone,
  Server,
  FolderOpen
} from 'lucide-react';
import { nexusRemoteService, RemoteConnection } from '../services/nexusRemoteService';
import { SshTerminal } from './SshTerminal';
import { AdbTerminal } from './AdbTerminal';

interface NexusRemoteHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NexusRemoteHub: React.FC<NexusRemoteHubProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'connections' | 'ssh' | 'adb' | 'smb'>('connections');
  const [connections, setConnections] = useState<RemoteConnection[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);

  // SSH Form State
  const [sshHost, setSshHost] = useState('');
  const [sshUser, setSshSUser] = useState('');
  const [sshPass, setSshPass] = useState('');

  // SMB Form State
  const [smbHost, setSmbHost] = useState('');
  const [smbShare, setSmbShare] = useState('');
  const [smbUser, setSmbUser] = useState('');
  const [smbPass, setSmbPass] = useState('');

  useEffect(() => {
    return nexusRemoteService.subscribe(setConnections);
  }, []);

  const handleConnectSsh = () => {
    setSelectedConfig({ host: sshHost, username: sshUser, password: sshPass });
    setActiveTab('ssh');
  };

  const handleConnectSmb = async () => {
    try {
      await nexusRemoteService.connectSMB({ host: smbHost, share: smbShare, username: smbUser, password: smbPass });
      setActiveTab('smb');
    } catch (err: any) {
      alert(`SMB Error: ${err.message}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 pointer-events-none"
        >
          <div className="w-full h-full max-w-5xl bg-slate-950/90 border border-cyan-500/30 rounded-3xl shadow-[0_0_80px_rgba(0,242,255,0.2)] flex overflow-hidden pointer-events-auto backdrop-blur-3xl">
            {/* Sidebar */}
            <div className="w-64 bg-black/40 border-r border-cyan-500/10 flex flex-col">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                    <Network className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white tracking-tighter uppercase">Nexus Remote</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Multi-Device Hub</p>
                  </div>
                </div>

                <nav className="space-y-1">
                  {[
                    { id: 'connections', label: 'Active Links', icon: Network },
                    { id: 'ssh', label: 'SSH Shell', icon: Terminal },
                    { id: 'adb', label: 'ADB Bridge', icon: Smartphone },
                    { id: 'smb', label: 'Storage (SMB)', icon: HardDrive },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                        activeTab === tab.id 
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="mt-auto p-6 border-t border-cyan-500/10">
                <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">E2EE Tunnel</span>
                  </div>
                  <p className="text-[8px] text-slate-500 leading-relaxed uppercase font-bold">All remote traffic is proxied through the sovereign bridge.</p>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              <header className="px-8 py-4 bg-black/20 border-b border-cyan-500/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">
                    {activeTab === 'connections' && 'Network Topology'}
                    {activeTab === 'ssh' && 'Secure Shell Interface'}
                    {activeTab === 'adb' && 'Android Debug Bridge'}
                    {activeTab === 'smb' && 'SMB Network Storage'}
                  </h3>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="flex-1 overflow-auto p-8">
                {activeTab === 'connections' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {connections.length === 0 ? (
                      <div className="col-span-full h-64 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800 rounded-3xl p-8">
                        <Cpu className="w-12 h-12 text-slate-800 mb-4" />
                        <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">No Active Links</h4>
                        <p className="text-[10px] text-slate-600 max-w-xs font-bold uppercase tracking-tighter">Initialize a remote connection to bridge external device compute into the sovereign environment.</p>
                      </div>
                    ) : (
                      connections.map(conn => (
                        <div key={conn.id} className="p-4 bg-slate-900/50 border border-cyan-500/20 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${conn.type === 'adb' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
                              {conn.type === 'adb' ? <Smartphone className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white uppercase">{conn.label}</div>
                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{conn.type} • {conn.status}</div>
                            </div>
                          </div>
                          <button onClick={() => nexusRemoteService.removeConnection(conn.id)} className="p-2 text-slate-600 hover:text-red-400 transition">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'ssh' && (
                  <div className="h-full flex flex-col">
                    {!selectedConfig ? (
                      <div className="max-w-md mx-auto w-full space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest ml-1">Terminal Endpoint (Host)</label>
                          <input 
                            type="text" 
                            value={sshHost} 
                            onChange={(e) => setSshHost(e.target.value)}
                            placeholder="e.g. 192.168.1.1 or user.remote.com"
                            className="w-full bg-black/60 border border-cyan-500/20 rounded-xl px-4 py-3 text-xs text-white focus:border-cyan-500/50 outline-none transition font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest ml-1">Operator ID</label>
                            <input 
                              type="text" 
                              value={sshUser} 
                              onChange={(e) => setSshSUser(e.target.value)}
                              placeholder="root"
                              className="w-full bg-black/60 border border-cyan-500/20 rounded-xl px-4 py-3 text-xs text-white focus:border-cyan-500/50 outline-none transition font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest ml-1">Access Key</label>
                            <input 
                              type="password" 
                              value={sshPass} 
                              onChange={(e) => setSshPass(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-black/60 border border-cyan-500/20 rounded-xl px-4 py-3 text-xs text-white focus:border-cyan-500/50 outline-none transition font-mono"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={handleConnectSsh}
                          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition shadow-lg shadow-cyan-900/20"
                        >
                          INITIALIZE SSH TUNNEL
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <SshTerminal config={selectedConfig} onClose={() => setSelectedConfig(null)} />
                    )}
                  </div>
                )}

                {activeTab === 'adb' && (
                  <div className="h-full">
                    <AdbTerminal />
                  </div>
                )}

                {activeTab === 'smb' && (
                  <div className="space-y-8">
                     <div className="max-w-md mx-auto w-full space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest ml-1">SMB Host & Share</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={smbHost} 
                              onChange={(e) => setSmbHost(e.target.value)}
                              placeholder="192.168.1.100"
                              className="flex-1 bg-black/60 border border-cyan-500/20 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono"
                            />
                            <input 
                              type="text" 
                              value={smbShare} 
                              onChange={(e) => setSmbShare(e.target.value)}
                              placeholder="Storage"
                              className="w-32 bg-black/60 border border-cyan-500/20 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            type="text" 
                            value={smbUser} 
                            onChange={(e) => setSmbUser(e.target.value)}
                            placeholder="Username"
                            className="bg-black/60 border border-cyan-500/20 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono"
                          />
                          <input 
                            type="password" 
                            value={smbPass} 
                            onChange={(e) => setSmbPass(e.target.value)}
                            placeholder="Password"
                            className="bg-black/60 border border-cyan-500/20 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono"
                          />
                        </div>
                        <button 
                          onClick={handleConnectSmb}
                          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition shadow-lg shadow-cyan-900/20"
                        >
                          MOUNT NETWORK DRIVE
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <footer className="px-8 py-3 bg-black/40 border-t border-cyan-500/10 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <div className="flex items-center gap-4">
                  <span>Sovereign Bridge: Operational</span>
                  <span>Active Links: {connections.length}</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>SYNC_ACTIVE</span>
                </div>
              </footer>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
