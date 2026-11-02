import React, { useState, useEffect } from 'react';
import { X, HardDrive, FileCode, Layers, Cpu, Eye, Code, Download, Plus, CheckCircle2, ShieldCheck, Sparkles, Image, Zap, RefreshCw } from 'lucide-react';
import { vgsFileExplorerService, VGSGiFileRecord } from '../services/vgsFileExplorerService';
import { polyglotEncodingEngine, PolyglotContainerType } from '../services/polyglotEncodingEngine';

interface VGSGiFileExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VGSGiFileExplorerModal: React.FC<VGSGiFileExplorerModalProps> = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState<VGSGiFileRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<VGSGiFileRecord | null>(null);

  // Polyglot Encoder Form State
  const [showEncoder, setShowEncoder] = useState<boolean>(false);
  const [encodeTitle, setEncodeTitle] = useState<string>('sovereign_quine');
  const [encodeType, setEncodeType] = useState<PolyglotContainerType>('PNG_HTML');
  const [encodePayload, setEncodePayload] = useState<string>(
    `// Sovereign Polyglot Quine Payload\nconsole.log("⚡ Executing Polyglot Container OK");\nconst PRIME = "137451921129154222";`
  );
  const [encoderMessage, setEncoderMessage] = useState<string>('');

  useEffect(() => {
    const list = vgsFileExplorerService.getGiFiles();
    setFiles(list);
    if (list.length > 0 && !selectedFile) {
      setSelectedFile(list[0]);
    }

    const unsub = vgsFileExplorerService.subscribe(() => {
      const updated = vgsFileExplorerService.getGiFiles();
      setFiles(updated);
    });

    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEncodeNewPolyglot = () => {
    if (!encodePayload.trim()) return;

    const artifact = polyglotEncodingEngine.encodePolyglot(encodePayload, encodeType, {
      title: encodeTitle,
      solfeggioHz: 963,
    });

    setEncoderMessage(`Encoded Polyglot Artifact: ${artifact.filename} (${artifact.validFormats.join(', ')})`);
    vgsFileExplorerService.notify();

    const updatedList = vgsFileExplorerService.getGiFiles();
    const newRecord = updatedList.find((f) => f.name === artifact.filename);
    if (newRecord) {
      setSelectedFile(newRecord);
    }

    setShowEncoder(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-5xl h-[88vh] flex flex-col rounded-xl border border-purple-500/40 bg-slate-950 text-purple-50 shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/30 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-purple-400 animate-pulse" />
            <div>
              <h2 className="text-lg font-bold tracking-wide text-purple-300 font-mono">
                VGS GIFILE EXPLORER & POLYGLOT ENCODING ENGINE
              </h2>
              <p className="text-xs text-slate-400">
                Virtual Graphics System • Multi-Format Polyglot Containers (.png.html, .gif.js, .gifile, .vgs)
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
        <div className="flex items-center justify-between border-b border-purple-500/20 bg-slate-900/40 px-6 py-2.5 text-xs font-mono">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEncoder(!showEncoder)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-purple-500/40 bg-purple-950/60 text-purple-200 hover:bg-purple-900/60 font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              CREATE POLYGLOT CONTAINER
            </button>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">FILES LOADED: <strong className="text-purple-300">{files.length}</strong></span>
          </div>

          {encoderMessage && (
            <div className="text-emerald-400 font-bold text-xs truncate max-w-md">
              {encoderMessage}
            </div>
          )}
        </div>

        {/* Encoder Overlay Form */}
        {showEncoder && (
          <div className="border-b border-purple-500/30 bg-slate-900/95 p-4 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center text-purple-300 font-bold">
              <span>POLYGLOT CONTAINER GENERATOR</span>
              <button onClick={() => setShowEncoder(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Title / Base Name</label>
                <input
                  type="text"
                  value={encodeTitle}
                  onChange={(e) => setEncodeTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Container Format Type</label>
                <select
                  value={encodeType}
                  onChange={(e) => setEncodeType(e.target.value as PolyglotContainerType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="PNG_HTML">PNG Image / HTML Execution (.png.html)</option>
                  <option value="GIF_JS">GIF89a / JavaScript Source (.gif.js)</option>
                  <option value="PDF_POSTSCRIPT_JS">PDF Vector / Embedded JS (.pdf.js)</option>
                  <option value="ZIP_ELF">ELF Executable / ZIP Archive (.elf.zip)</option>
                  <option value="PRIME_SOLITON_ENCODED">Prime Soliton Solfeggio 963Hz (.prm.polyglot)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleEncodeNewPolyglot}
                  className="w-full py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                >
                  GENERATE POLYGLOT ARTIFACT
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Code / Payload Source</label>
              <textarea
                rows={3}
                value={encodePayload}
                onChange={(e) => setEncodePayload(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Grid */}
          <div className="w-1/2 border-r border-purple-500/20 bg-slate-950/80 p-4 overflow-y-auto space-y-2">
            <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800 flex justify-between">
              <span>VGS & POLYGLOT GIFILE CATALOG</span>
              <span className="text-purple-400">VFS ROOT</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {files.map((file) => {
                const isSelected = selectedFile?.id === file.id;
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex justify-between items-start font-mono text-xs ${
                      isSelected
                        ? 'bg-purple-950/60 border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.2)] text-purple-100'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {file.isPolyglot ? (
                          <Sparkles className="w-4 h-4 text-purple-400" />
                        ) : (
                          <FileCode className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-bold text-slate-200">{file.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{file.path}</div>
                      
                      {/* Format Badges */}
                      {file.polyglotFormats && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {file.polyglotFormats.map((fmt, idx) => (
                            <span key={idx} className="px-1.5 py-0.2 rounded bg-purple-950 border border-purple-500/30 text-[9px] text-purple-300 font-bold">
                              {fmt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right space-y-1 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase">
                        .{file.extension}
                      </span>
                      <div className="text-slate-500">{(file.sizeBytes / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inspector Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-xs">
            {selectedFile ? (
              <>
                <div className="rounded-lg border border-purple-500/30 bg-slate-900/80 p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div>
                      <h3 className="text-sm font-bold text-purple-300">{selectedFile.name}</h3>
                      <p className="text-[10px] text-slate-400">{selectedFile.path}</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-bold">
                      {selectedFile.isPolyglot ? 'POLYGLOT ARTIFACT' : 'VGS GRAPHIC FILE'}
                    </span>
                  </div>

                  {/* SVG Vector Preview if available */}
                  {selectedFile.previewType === 'VECTOR_GRAPHICS' && selectedFile.previewData && (
                    <div className="p-4 rounded border border-slate-800 bg-slate-950 flex justify-center items-center">
                      <div dangerouslySetInnerHTML={{ __html: selectedFile.previewData }} className="w-32 h-32" />
                    </div>
                  )}

                  {/* Hex Stream Preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold">BINARY HEX STREAM PREVIEW (FIRST 32 BYTES)</span>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-purple-300 font-mono tracking-widest text-[11px]">
                      {selectedFile.hexPreview}
                    </div>
                  </div>

                  {/* Payload Code View */}
                  {selectedFile.previewData && selectedFile.previewType !== 'VECTOR_GRAPHICS' && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold">PAYLOAD CODE / MANIFEST DATA</span>
                      <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto text-[11px] whitespace-pre-wrap">
                        {selectedFile.previewData}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500 italic">Select a GiFile from the catalog to inspect.</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-purple-500/20 bg-slate-900/80 px-6 py-3 flex justify-between items-center text-xs font-mono text-slate-400">
          <div>VGS GRAPHICS SUBSTRATE • POLYGLOT ENCODING ENGINE ACTIVE</div>
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
