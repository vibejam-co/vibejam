export type JamCanvasRegionId = 'hero' | 'narrative' | 'proof' | 'identity';
export type JamCanvasMode = 'editorial' | 'poster' | 'gallery' | 'manifesto';
export type JamCanvasPlacement = 'top' | 'center' | 'side' | 'overlay' | 'bottom';
export type JamCanvasWidth = 'full' | 'medium' | 'narrow';
export type JamCanvasEmphasis = 'dominant' | 'standard' | 'minor';
export type JamCanvasStacking = 'normal' | 'overlay';
export type JamCanvasAlignment = 'centered' | 'asymmetric';
export type JamCanvasOverlap = 'allowed' | 'none';
export type JamCanvasDensity = 'airy' | 'balanced' | 'compressed';
export type JamCanvasBreathing = 'tight' | 'normal' | 'wide';

export type JamCanvasRegion = {
  id: JamCanvasRegionId;
  placement: JamCanvasPlacement;
  width: JamCanvasWidth;
  emphasis: JamCanvasEmphasis;
  stacking: JamCanvasStacking;
};

export type JamCanvasPlan = {
  id: string;
  label: string;
  canvasMode: JamCanvasMode;
  order: JamCanvasRegionId[];
  regions: Record<JamCanvasRegionId, JamCanvasRegion>;
  spatialRules: {
    alignment: JamCanvasAlignment;
    overlap: JamCanvasOverlap;
    density: JamCanvasDensity;
    breathingRoom: JamCanvasBreathing;
  };
};
