import { JamCanvasPlan } from './JamCanvasPlan';

export type JamDesignProvenance = {
  designedBy: 'ai' | 'human' | 'hybrid';
  model?: 'gemini-3-flash';
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
