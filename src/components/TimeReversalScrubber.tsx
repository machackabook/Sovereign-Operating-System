import React from 'react';
import { History, Rewind } from 'lucide-react';

interface TimeReversalScrubberProps {
  totalIterations: number;
  currentIteration: number;
  onScrub: (iterationId: number) => void;
}

export const TimeReversalScrubber: React.FC<TimeReversalScrubberProps> = ({
  totalIterations,
  currentIteration,
  onScrub,
}) => {
  if (totalIterations <= 1) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-1 bg-black/80 border-t border-purple-500/30 text-purple-300 select-none">
      <Rewind className="w-4 h-4 text-purple-400" />
      <span className="text-[10px] font-mono font-bold whitespace-nowrap">TIME REVERSAL:</span>
      <input
        type="range"
        min={1}
        max={totalIterations}
        value={currentIteration}
        onChange={(e) => onScrub(Number(e.target.value))}
        className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
      />
      <span className="text-[10px] font-mono min-w-[50px] text-right">
        {currentIteration} / {totalIterations}
      </span>
      <History className="w-4 h-4 text-purple-400" />
    </div>
  );
};
