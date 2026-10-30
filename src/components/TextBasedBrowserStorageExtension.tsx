/**
 * TEXT-BASED OS FILE BROWSER & HARDWARE MOUNT MATRIX CONSOLE
 * Path: src/components/TextBasedBrowserStorageExtension.tsx
 */

import React, { useState, useEffect } from 'react';
import { VfsStorageAccessService, FileDirectoryNode, BlockDeviceVolume } from '../services/vfsStorageAccessService';

export const TextBasedBrowserStorageExtension: React.FC = () => {
  const [currentUri, setCurrentUri] = useState<string>("file:///root");
  const [activeDirectoryPath, setActiveDirectoryPath] = useState<string>("/root");
  const [directoryItems, setDirectoryContents] = useState<FileDirectoryNode[]>([]);
  const [selectedFileContents, setSelectedFileContents] = useState<string | null>(null);
  const [blockTopology, setBlockTopology] = useState<Record<string, BlockDeviceVolume>>({});

  useEffect(() => {
    setBlockTopology(VfsStorageAccessService.getBlockTopology());
    synchronizeFsView("/root");
  }, []);

  const synchronizeFsView = (pathStr: string) => {
    setActiveDirectoryPath(pathStr);
    const contents = VfsStorageAccessService.queryDirectoryContents(pathStr);
    setDirectoryContents(contents);
    setSelectedFileContents(null);
  };

  const handleNavigationTrigger = (targetNode: FileDirectoryNode) => {
    if (targetNode.type === "DIRECTORY") {
      setCurrentUri(`file://${targetNode.path}`);
      synchronizeFsView(targetNode.path);
    } else if (targetNode.type === "FILE") {
      setCurrentUri(`file://${targetNode.path}`);
      try {
        const payload = VfsStorageAccessService.readRawFileBuffer(targetNode.path);
        setSelectedFileContents(typeof payload === "string" ? payload : new TextDecoder().decode(payload));
      } catch {
        setSelectedFileContents("[FS_READ_ERROR] Unable to extract raw string buffer from device.");
      }
    }
  };

  const traverseToParentDirectory = () => {
    if (activeDirectoryPath === "/") return;
    const lastSlash = activeDirectoryPath.lastIndexOf("/");
    const parentPath = lastSlash === 0 ? "/" : activeDirectoryPath.substring(0, lastSlash);
    setCurrentUri(`file://${parentPath}`);
    synchronizeFsView(parentPath);
  };

  return (
    <div className="bg-slate-950 text-cyan-400 p-4 font-mono rounded-xl border border-cyan-900 shadow-2xl max-w-4xl mx-auto my-4">
      {/* Top Header Deck */}
      <div className="flex items-center justify-between border-b border-cyan-900 pb-2 mb-4 text-xs">
        <div className="flex items-center space-x-2">
          <span className="animate-ping inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
          <span className="font-bold tracking-wider">GAIA VERIFY // TEXT-BASED BROWSER (v2.25)</span>
        </div>
        <div className="text-slate-500">Operative Tier: Sovereign Operator (Architect_01)</div>
      </div>

      {/* Address Bar Navigation Deck */}
      <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-cyan-950 mb-4">
        <button 
          onClick={traverseToParentDirectory} 
          disabled={activeDirectoryPath === "/"}
          className="px-3 py-1 bg-slate-800 text-cyan-500 rounded disabled:opacity-30 hover:bg-slate-700 transition-all text-sm"
        >
          ↰ PARENT
        </button>
        <span className="text-slate-600 text-sm">URL:</span>
        <input 
          type="text" 
          value={currentUri} 
          readOnly
          className="bg-slate-950 border border-cyan-900/50 rounded px-2 py-1 text-sm flex-1 text-cyan-300 select-all font-mono"
        />
        <span className="text-emerald-500 text-xs px-2 bg-emerald-950/40 rounded border border-emerald-900/40 py-1">✓ VALID_FS</span>
      </div>

      {/* Main Framework Grid Splits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hardware Devices & Block Matrix Mount Maps */}
        <div className="bg-slate-900/60 p-3 rounded-lg border border-cyan-950/60">
          <h4 className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-2 border-b border-cyan-950 pb-1">
            📟 Hard Storage Volumes
          </h4>
          <div className="space-y-2">
            {Object.values(blockTopology).map((vol, idx) => (
              <div key={idx} className="p-2 bg-slate-950 rounded border border-slate-900 text-xs">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>{vol.deviceNode}</span>
                  <span className="text-cyan-500">{vol.filesystemType}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Mount: <span className="text-cyan-600">{vol.mountPoint}</span></div>
                <div className="text-[10px] text-slate-500">Cap: {(vol.totalBlockAllocationSizeKb / 1024).toFixed(2)} MB</div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full w-[14.5%]"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Directory Structure Browser Tree */}
        <div className="bg-slate-900/60 p-3 rounded-lg border border-cyan-950/60 md:col-span-2">
          <h4 className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-2 border-b border-cyan-950 pb-1 flex justify-between">
            <span>Directory: {activeDirectoryPath}</span>
            <span className="text-slate-500 text-[10px]">{directoryItems.length} Nodes Loaded</span>
          </h4>
          
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {directoryItems.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => handleNavigationTrigger(item)}
                className="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-900/40 hover:border-cyan-800/60 hover:bg-slate-900 cursor-pointer transition-all text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className={item.type === "DIRECTORY" ? "text-amber-500" : "text-cyan-400"}>
                    {item.type === "DIRECTORY" ? "📁" : "📄"}
                  </span>
                  <span className={item.type === "DIRECTORY" ? "text-amber-400 font-bold" : "text-slate-200"}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center space-x-4 font-mono text-[10px]">
                  <span className="text-slate-500">{item.permissions}</span>
                  <span className="text-slate-400 w-16 text-right">{item.sizeBytes} B</span>
                </div>
              </div>
            ))}
          </div>

          {/* Inspect File Contents Stream Terminal */}
          {selectedFileContents !== null && (
            <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-cyan-950 text-xs">
              <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest border-b border-slate-900 pb-1 flex justify-between">
                <span>📄 Sealed Context View Stream Buffer</span>
                <span className="text-emerald-500 font-normal">RO_CHANNEL_STREAM_OK</span>
              </div>
              <pre className="text-cyan-300 font-mono overflow-x-auto whitespace-pre-wrap selection:bg-cyan-900 select-all p-1 bg-slate-900/40 rounded border border-slate-900/20 max-h-40 overflow-y-auto">
                {selectedFileContents}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
