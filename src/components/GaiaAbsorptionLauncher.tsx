import React from 'react';
import { ExternalLink, ArchiveRestore } from 'lucide-react';

/**
 * Opens the self-contained GAIA Quine Forge as an isolated, static artifact.
 * The editor stores only user-supplied inert data inside the downloaded HTML.
 */
export function GaiaAbsorptionLauncher() {
  const href = import.meta.env.BASE_URL + 'gaia-absorption-quine.html';
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      title="Open the standalone, offline-capable Absorption Quine Forge"
      className="pointer-events-auto fixed bottom-11 left-[272px] z-30 hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/50 bg-slate-950/85 px-2.5 py-1 text-[11px] font-mono font-medium text-cyan-200 shadow-md backdrop-blur-md hover:bg-slate-800 transition">
      <ArchiveRestore size={14}/> QUINE FORGE <ExternalLink size={11}/>
    </a>
  );
}
