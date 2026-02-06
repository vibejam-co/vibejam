import { JamNarrativeMode } from '../narrative/JamNarrative';
import { SilenceState } from '../silence/deriveSilenceState';
import { DensityProfile } from './ActivityDensity';

export const deriveDensityProfile = (
  narrativeMode: JamNarrativeMode,
  silenceState: SilenceState
): DensityProfile => {
  if (narrativeMode === 'dossier') return 'balanced';
  if (narrativeMode === 'stream') return 'compressed';
  if (narrativeMode === 'chronicle' && (silenceState === 'pure' || silenceState === 'pause')) return 'airy';
  return 'balanced';
};
