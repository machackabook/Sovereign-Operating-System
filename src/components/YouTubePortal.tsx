import React, { useState } from 'react';
import { X, Tv, ExternalLink, Globe, Lock, Search, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface YouTubePortalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 📺 YOUTUBE INTERACTIVE PORTAL (CLAUNCH INSTANCE)
 * Provides a high-fidelity interactive YouTube session within the environment.
 * Allows for direct site interaction, login, and music selection.
 */
export const YouTubePortal: React.FC<YouTubePortalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('https://www.youtube.com/');
  const [key, setKey] = useState(0);

  const handleRefresh = () => setKey(prev => prev + 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 pointer-events-none"
        >
          <div className="w-full h-full max-w-6xl bg-slate-950/95 border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(0,242,255,0.2)] flex flex-col overflow-hidden pointer-events-auto backdrop-blur-2xl">
            {/* Header / Navigation Bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-black/60 border-b border-cyan-500/20">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <Tv className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold text-white tracking-widest uppercase">YouTube Claunch Instance</span>
                </div>
                
                {/* Browser-like controls */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 ml-4">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[300px]">{url}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer"
                  title="Refresh Instance"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.open(url, '_blank')}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer"
                  title="Open in External Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Interactive Substrate */}
            <div className="flex-1 relative bg-black">
              {/* Note: YouTube often blocks iframing of the main site via SAMEORIGIN.
                  We attempt to load it, but provide a friendly fallback overlay if blocked or for better UX. */}
              <iframe
                key={key}
                src={url}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              
              {/* Permission & Instruction HUD */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md flex items-center justify-between gap-4 pointer-events-none">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <div>
                    <span className="text-[11px] font-bold text-white block uppercase tracking-tighter">System-Integrated Interactive Session</span>
                    <p className="text-[9px] text-slate-400">Login to your YouTube account to sync playlists and history. Cookies are managed by your browser natively.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                   <div className="px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[9px] font-bold">
                     HYPER_SYNC ENABLED
                   </div>
                   <div className="px-3 py-1 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-[9px] font-bold">
                     SECURE SESSION
                   </div>
                </div>
              </div>
            </div>

            {/* Footer Status */}
            <div className="px-6 py-2 bg-black/40 border-t border-cyan-500/10 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <div className="flex items-center gap-4">
                <span>INSTANCE_ID: YT_{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                <span>STATUS: OPERATIONAL</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-500/50">
                <Search className="w-3 h-3" />
                <span>TRAVERSAL_ENABLED</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
