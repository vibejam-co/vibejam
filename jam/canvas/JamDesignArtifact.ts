import { JamCanvasPlan } from './JamCanvasPlan';

export type JamDesignArtifact = {
  id: string;
  canvasPlan: JamCanvasPlan;
  intent: string;
  createdAt: number;
  forkedFrom?: string;
};
