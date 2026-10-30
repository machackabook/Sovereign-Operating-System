import { useEffect } from 'react';
import { EnvironmentState, SentimentType } from '../types';

export function useSentimentAnalysis(
  inputVal: string,
  envState: EnvironmentState,
  setEnvState: React.Dispatch<React.SetStateAction<EnvironmentState>>
) {
  useEffect(() => {
    const analyzeSentiment = (input: string): SentimentType => {
      const lower = input.toLowerCase();
      if (['fast', 'run', 'go', 'speed', 'hyper', 'power', 'go'].some(k => lower.includes(k))) return 'energetic';
      if (['error', 'danger', 'fail', 'alert', 'panic', 'critical'].some(k => lower.includes(k))) return 'alarm';
      if (['calm', 'relax', 'quiet', 'breathe', 'peace', 'stasis'].some(k => lower.includes(k))) return 'tranquil';
      if (['space', 'galaxy', 'stars', 'void', 'universe', 'relativity'].some(k => lower.includes(k))) return 'cosmic';
      if (['random', 'chaos', 'mess', 'entropy', 'shatter', 'flux'].some(k => lower.includes(k))) return 'chaos';
      if (['create', 'draw', 'make', 'art', 'design', 'imagine'].some(k => lower.includes(k))) return 'creative';
      return 'analytical';
    };

    if (inputVal.length > 3) { // Trigger after short input
      const newSentiment = analyzeSentiment(inputVal);
      if (newSentiment !== envState.sentiment) {
        setEnvState((prev) => ({ ...prev, sentiment: newSentiment }));
      }
    }
  }, [inputVal, envState.sentiment, setEnvState]);
}
