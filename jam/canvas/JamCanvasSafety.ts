import {
  JamCanvasAlignment,
  JamCanvasDensity,
  JamCanvasEmphasis,
  JamCanvasMode,
  JamCanvasOverlap,
  JamCanvasPlacement,
  JamCanvasPlan,
  JamCanvasRegion,
  JamCanvasRegionId,
  JamCanvasStacking,
  JamCanvasWidth
} from './JamCanvasPlan';

const REGION_IDS: JamCanvasRegionId[] = ['hero', 'narrative', 'proof', 'identity'];
const MODES: JamCanvasMode[] = ['editorial', 'poster', 'gallery', 'manifesto'];
const PLACEMENTS: JamCanvasPlacement[] = ['top', 'center', 'side', 'overlay', 'bottom'];
const EMPHASES: JamCanvasEmphasis[] = ['dominant', 'standard', 'minor'];
const WIDTHS: JamCanvasWidth[] = ['full', 'medium', 'narrow'];
const STACKING: JamCanvasStacking[] = ['normal', 'overlay'];
const ALIGNMENTS: JamCanvasAlignment[] = ['centered', 'asymmetric'];
const OVERLAPS: JamCanvasOverlap[] = ['allowed', 'none'];
const DENSITIES: JamCanvasDensity[] = ['airy', 'balanced', 'compressed'];

const isAllowed = <T extends string>(value: unknown, allowed: readonly T[]): value is T => {
  return typeof value === 'string' && allowed.includes(value as T);
};

const isValidRegion = (region: unknown): region is JamCanvasRegion => {
  if (!region || typeof region !== 'object') return false;
  const value = region as JamCanvasRegion;
  return isAllowed(value.id, REGION_IDS)
    && isAllowed(value.placement, PLACEMENTS)
    && isAllowed(value.width, WIDTHS)
    && isAllowed(value.emphasis, EMPHASES)
    && isAllowed(value.stacking, STACKING);
};

export const isValidJamCanvasPlan = (plan: unknown): plan is JamCanvasPlan => {
  if (!plan || typeof plan !== 'object') return false;
  const value = plan as JamCanvasPlan;
  if (typeof value.id !== 'string' || !value.id) return false;
  if (typeof value.label !== 'string' || !value.label) return false;
  if (!isAllowed(value.canvasMode, MODES)) return false;
  if (!Array.isArray(value.order) || value.order.length !== 4) return false;
  if (!value.order.every((region) => isAllowed(region, REGION_IDS))) return false;
  if (!value.regions || typeof value.regions !== 'object') return false;
  if (!REGION_IDS.every((region) => isValidRegion(value.regions[region]))) return false;
  if (!value.spatialRules || typeof value.spatialRules !== 'object') return false;
  if (!isAllowed(value.spatialRules.alignment, ALIGNMENTS)) return false;
  if (!isAllowed(value.spatialRules.overlap, OVERLAPS)) return false;
  if (!isAllowed(value.spatialRules.density, DENSITIES)) return false;
  return value.spatialRules.breathingRoom === 'tight'
    || value.spatialRules.breathingRoom === 'normal'
    || value.spatialRules.breathingRoom === 'wide';
};

export const enforceJamCanvasSafety = (plan: JamCanvasPlan): JamCanvasPlan => {
  const safe = JSON.parse(JSON.stringify(plan)) as JamCanvasPlan;
  if (safe.regions.proof.emphasis === 'minor') safe.regions.proof.emphasis = 'standard';
  if (safe.regions.proof.width === 'narrow') safe.regions.proof.width = 'medium';
  if (safe.regions.proof.placement === 'side') safe.regions.proof.placement = 'center';
  if (safe.regions.narrative.emphasis === 'minor') safe.regions.narrative.emphasis = 'standard';
  return safe;
};
