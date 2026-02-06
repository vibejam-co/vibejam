import { JamNarrativeMode } from './JamNarrative';

export type JamNarrativeEmphasis = 'temporal' | 'proof' | 'recent';
export type JamNarrativeReadingPace = 'slow' | 'neutral' | 'fast';
export type JamNarrativeDensityBias = 'sparse' | 'balanced' | 'dense';

export type JamNarrativeConfig = {
  emphasis: JamNarrativeEmphasis;
  readingPace: JamNarrativeReadingPace;
  densityBias: JamNarrativeDensityBias;
};

export const JAM_NARRATIVE_CONFIG: Record<JamNarrativeMode, JamNarrativeConfig> = {
  chronicle: {
    emphasis: 'temporal',
    readingPace: 'slow',
    densityBias: 'sparse'
  },
  dossier: {
    emphasis: 'proof',
    readingPace: 'neutral',
    densityBias: 'balanced'
  },
  stream: {
    emphasis: 'recent',
    readingPace: 'fast',
    densityBias: 'dense'
  }
};
