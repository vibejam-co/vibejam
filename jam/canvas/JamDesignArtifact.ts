import { JamCanvasPlan } from './JamCanvasPlan';

export type JamDesignProvenance = {
  designedBy: 'ai' | 'human' | 'hybrid';
  model?: 'gemini-3-flash' | 'gemini-3-pro' | 'gemini-3-flash-preview' | 'gemini-3-pro-preview';
  createdAt: number;
  forkDepth?: number;
  forkedFrom?: string;
};

export type JamDesignArtifact = {
  id: string;
  canvasPlan: JamCanvasPlan;
  intent: string;
  createdAt: number;
  forkedFrom?: string;
  provenance: JamDesignProvenance;
};
