import React, { useState, useEffect } from 'react';
import { X, Database, Folder, FolderOpen, FileCode, Play, Download, Search, CheckCircle2, RefreshCw, Cpu, HardDrive, ShieldCheck, Zap, Plus, Trash2 } from 'lucide-react';
import { registryDatabaseService, RegistryHive, RegistryKeyNode, RegistryValue, RegistryValueType } from '../services/registryDatabaseService';
import { fileSystemBootChain, DiskImageMeta, BootChainStatus } from '../services/fileSystemBootChain';

interface RegistryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistryEditorModal: React.FC<RegistryEditorModalProps> = ({ isOpen, onClose }) => {
  const [selectedHive, setSelectedHive] = useState<RegistryHive>('HKLM');
  const [selectedPath, setSelectedPath] = useState<string>('HKLM');
  const [currentNode, setCurrentNode] = useState<RegistryKeyNode | null>(registryDatabaseService.getKeyNode('HKLM'));
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['HKLM', 'HKCU', 'HKCR', 'HKU', 'HKCC']));

  // Registry Search
  const [searchQuery, setSearchQuery] = useState('');

  // Optimization & Boot logs
  const [optLogs, setOptLogs] = useState<string[]>([]);
  const [bootStatus, setBootStatus] = useState<BootChainStatus | null>(null);

  // New Value Form
  const [newValueName, setNewValueName] = useState('');
  const [newValueType, setNewValueType] = useState<RegistryValueType>('REG_SZ');
  const [newValueData, setNewValueData] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const unsubReg = registryDatabaseService.subscribe(() => {
      const node = registryDatabaseService.getKeyNode(selectedPath);
      setCurrentNode(node);
    });
    const unsubBoot = fileSystemBootChain.subscribe(() => {
      setBootStatus(fileSystemBootChain.verifyAndExecuteBootChain());
    });

    return () => {
      unsubReg();
      unsubBoot();
    };
  }, [selectedPath]);

  if (!isOpen) return null;

  const handleSelectKey = (path: string) => {
    setSelectedPath(path);
    const node = registryDatabaseService.getKeyNode(path);
    setCurrentNode(node);
  };

  const toggleExpand = (path: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleRunOptimization = () => {
    const result = registryDatabaseService.executeBaselineOptimizations();
    setOptLogs(result.logs);
  };

  const handleAddValue = () => {
    if (!newValueName.trim()) return;
    let parsedVal: any = newValueData;
    if (newValueType === 'REG_DWORD') {
      parsedVal = parseInt(newValueData, 10) || 0;
    }

    registryDatabaseService.setValue(selectedPath, newValueName, newValueType, parsedVal);
    setNewValueName('');
    setNewValueData('');
    setShowAddForm(false);
  };

  const handleDeleteValue = (valName: string) => {
    registryDatabaseService.deleteValue(selectedPath, valName);
  };

  const handleExportReg = () => {
    const content = registryDatabaseService.exportRegFormat();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sovereign_registry.reg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunBootchainCheck = () => {
    const status = fileSystemBootChain.verifyAndExecuteBootChain();
    setBootStatus(status);
  };

  // Render tree node recursively
  const renderTree = (node: RegistryKeyNode) => {
    const isExpanded = expandedNodes.has(node.path);
    const isSelected = selectedPath === node.path;
    const subkeys = Array.from(node.subkeys.values());

    return (
      <div key={node.path} className="pl-3 text-xs font-mono select-none">
        <div
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition ${
            isSelected ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800' : 'text-slate-300 hover:bg-slate-900'
          }`}
          onClick={() => {
            handleSelectKey(node.path);
            toggleExpand(node.path);
          }}
        >
          {subkeys.length > 0 ? (
            isExpanded ? <FolderOpen className="w-3.5 h-3.5 text-cyan-400" /> : <Folder className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>{node.path.split('\\').pop()}</span>
        </div>

        {isExpanded && subkeys.length > 0 && (
          <div className="border-l border-slate-800 ml-2.5">
            {subkeys.map((child) => renderTree(child))}
          </div>
        )}
      </div>
    );
  };

  const currentValues = currentNode ? Array.from(currentNode.values.values()) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-5xl h-[88vh] flex flex-col rounded-xl border border-cyan-500/40 bg-slate-950 text-cyan-50 shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-cyan-400 animate-pulse" />
            <div>
              <h2 className="text-lg font-bold tracking-wide text-cyan-300 font-mono">
                SOVEREIGN REGISTRY EDITOR & BOOTCHAIN ENGINE
              </h2>
              <p className="text-xs text-slate-400">
                HKEY Hives (HKLM, HKCU, HKCR, HKU, HKCC) • Polyglot Disk Image Mounter (.img, .dmg, .iso, .qcow2)
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

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 bg-slate-900/40 px-6 py-2.5 text-xs font-mono">
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunOptimization}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 font-semibold transition"
            >
              <Zap className="w-3.5 h-3.5" />
              RUN BASELINE OPTIMIZATION
            </button>
            <button
              onClick={handleRunBootchainCheck}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyan-500/40 bg-cyan-950/60 text-cyan-200 hover:bg-cyan-900/60 font-semibold transition"
            >
              <HardDrive className="w-3.5 h-3.5" />
              VERIFY BOOTCHAIN & DISK IMAGES
            </button>
            <button
              onClick={handleExportReg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition"
            >
              <Download className="w-3.5 h-3.5" />
              EXPORT .REG
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search registry keys or values..."
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 w-56"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: HKEY Tree Hierarchy */}
          <div className="w-1/3 border-r border-cyan-500/20 bg-slate-950/80 p-4 overflow-y-auto space-y-2">
            <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
              REGISTRY HIVE ROOT TREE
            </div>
            {Array.from(registryDatabaseService.getHives().values()).map((rootNode) => renderTree(rootNode))}
          </div>

          {/* Right Panel: Value Inspector & Bootchain Logs */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-4">
            {/* Key Path Display */}
            <div className="flex items-center justify-between rounded bg-slate-900/80 border border-slate-800 p-3 font-mono text-xs">
              <span className="text-cyan-300 font-bold">Path: {selectedPath}</span>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Value
              </button>
            </div>

            {/* Add Value Form */}
            {showAddForm && (
              <div className="rounded border border-cyan-500/30 bg-slate-900 p-3 space-y-2 text-xs font-mono">
                <div className="text-cyan-300 font-bold">New Registry Value</div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newValueName}
                    onChange={(e) => setNewValueName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                  />
                  <select
                    value={newValueType}
                    onChange={(e) => setNewValueType(e.target.value as RegistryValueType)}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                  >
                    <option value="REG_SZ">REG_SZ (String)</option>
                    <option value="REG_DWORD">REG_DWORD (Integer)</option>
                    <option value="REG_BINARY">REG_BINARY (Hex)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Value Data"
                    value={newValueData}
                    onChange={(e) => setNewValueData(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                  />
                </div>
                <button
                  onClick={handleAddValue}
                  className="px-3 py-1 rounded bg-cyan-600 text-white hover:bg-cyan-500 font-bold text-xs"
                >
                  Save Value
                </button>
              </div>
            )}

            {/* Values Table */}
            <div className="rounded border border-slate-800 bg-slate-900/60 overflow-hidden">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Data</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {currentValues.map((v) => (
                    <tr key={v.name} className="hover:bg-slate-900/80">
                      <td className="p-2.5 text-cyan-200 font-bold">{v.name}</td>
                      <td className="p-2.5 text-purple-300">{v.type}</td>
                      <td className="p-2.5 text-slate-300 font-mono">{String(v.value)}</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => handleDeleteValue(v.name)}
                          className="text-red-400 hover:text-red-200 p-1"
                          title="Delete Value"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {currentValues.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500 italic">
                        No values configured under this key.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Optimization Logs Output */}
            {optLogs.length > 0 && (
              <div className="rounded border border-emerald-500/30 bg-slate-950 p-4 font-mono text-xs space-y-1">
                <div className="text-emerald-400 font-bold pb-1 border-b border-slate-800">
                  BASELINE OPTIMIZATION LOGS
                </div>
                {optLogs.map((l, i) => (
                  <div key={i} className="text-slate-300">{l}</div>
                ))}
              </div>
            )}

            {/* Bootchain, Driver Load Order & Blue Dream Signature Status */}
            {bootStatus && (
              <div className="rounded border border-cyan-500/30 bg-slate-950 p-4 font-mono text-xs space-y-3">
                <div className="text-cyan-300 font-bold pb-1 border-b border-slate-800 flex justify-between">
                  <span>FILE SYSTEM BOOTCHAIN VERIFICATION</span>
                  <span className="text-emerald-400 font-bold">STATUS: VALID</span>
                </div>

                {/* Blue Dream Signature Validation Banner */}
                <div className="rounded border border-blue-500/40 bg-blue-950/40 p-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-blue-300">BLUE DREAM DOOMSDAY PROTOCOL SIGNATURE</div>
                    <div className="text-[10px] text-slate-400">Read-Only Telemetry Mount Check • Signature: {bootStatus.blueDreamSignature}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                    bootStatus.blueDreamValidated ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300' : 'bg-red-950 border border-red-500/50 text-red-300'
                  }`}>
                    {bootStatus.blueDreamValidated ? 'VALIDATED BEFORE VISUAL KERNEL' : 'UNCONFIRMED'}
                  </span>
                </div>

                {/* Driver Load Sequence Table */}
                {bootStatus.driverSequence && bootStatus.driverSequence.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-cyan-400 font-bold">REGISTRY DRIVER & SERVICE LOAD SEQUENCE</div>
                    <div className="grid grid-cols-1 gap-1">
                      {bootStatus.driverSequence.map((drv) => (
                        <div key={drv.serviceName} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">#{drv.orderIndex}</span>
                            <span className="font-bold text-slate-200">{drv.serviceName}</span>
                            <span className="text-slate-400 text-[10px]">{drv.details}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            drv.status === 'VALIDATED' || drv.status === 'INITIALIZED'
                              ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/30'
                              : 'text-red-400 bg-red-950/60 border border-red-500/30'
                          }`}>
                            {drv.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1">
                  <div>EFI: {bootStatus.efiPath}</div>
                  <div>Kernel: {bootStatus.kernelPath}</div>
                  <div>Initrd: {bootStatus.initrdPath}</div>
                </div>

                <div className="pt-2 text-cyan-400 font-bold">MOUNTED POLYGLOT DISK IMAGES</div>
                <div className="grid grid-cols-1 gap-1.5">
                  {bootStatus.mountedImages.map((img) => (
                    <div key={img.filename} className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <div>
                        <span className="text-slate-200 font-bold">{img.filename}</span> ({img.format.toUpperCase()})
                        <span className="text-slate-500 ml-2">Mount: {img.mountPoint}</span>
                      </div>
                      <span className="text-purple-300">{img.partitionTable}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-cyan-500/20 bg-slate-900/80 px-6 py-3 flex justify-between items-center text-xs font-mono text-slate-400">
          <div>SOVEREIGN REGISTRY: HKLM / HKCU / HKCR / HKU / HKCC LINKED</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
