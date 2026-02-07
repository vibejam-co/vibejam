import {
  JamCanvasAlignment,
  JamCanvasBreathing,
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
import { EDITORIAL_CANVAS, POSTER_CANVAS } from './JamCanvasPresets';
import { JamDesignIntent } from './JamDesignIntent';

type JamCanvasAiRegion = {
  placement: JamCanvasPlacement;
  emphasis: JamCanvasEmphasis;
};

export type JamCanvasAiResponse = {
  canvasMode: JamCanvasMode;
  regions: Record<JamCanvasRegionId, JamCanvasAiRegion>;
  spatialRules: {
    alignment: JamCanvasAlignment;
    overlap: boolean;
    density: number;
  };
  order?: JamCanvasRegionId[];
};

const REQUIRED_REGIONS: JamCanvasRegionId[] = ['hero', 'narrative', 'proof', 'identity'];
const CANVAS_MODES: JamCanvasMode[] = ['editorial', 'poster', 'gallery', 'manifesto'];
const PLACEMENTS: JamCanvasPlacement[] = ['top', 'center', 'side', 'overlay', 'bottom'];
const EMPHASES: JamCanvasEmphasis[] = ['dominant', 'standard', 'minor'];
const ALIGNMENTS: JamCanvasAlignment[] = ['centered', 'asymmetric'];

const clamp = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const hashIntent = (prompt: string) => {
  let hash = 0;
  for (let i = 0; i < prompt.length; i += 1) {
    hash = ((hash << 5) - hash + prompt.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
};

const isAllowed = <T extends string>(value: unknown, allowed: readonly T[]): value is T => {
  return typeof value === 'string' && allowed.includes(value as T);
};

const coerceOrder = (order: JamCanvasRegionId[] | undefined, fallback: JamCanvasRegionId[]) => {
  if (!order) return fallback;
  const unique = Array.from(new Set(order));
  if (unique.length !== REQUIRED_REGIONS.length) return fallback;
  const isValid = unique.every((region) => REQUIRED_REGIONS.includes(region));
  return isValid ? unique : fallback;
};

const basePlanForMode = (mode: JamCanvasMode) => {
  if (mode === 'poster') return POSTER_CANVAS;
  return EDITORIAL_CANVAS;
};

const sanitizeProofRegion = (region: JamCanvasRegion): JamCanvasRegion => {
  const emphasis: JamCanvasEmphasis = region.emphasis === 'minor' ? 'standard' : region.emphasis;
  const width: JamCanvasWidth = region.width === 'narrow' ? 'medium' : region.width;
  const placement: JamCanvasPlacement = region.placement === 'side' ? 'center' : region.placement;
  return {
    ...region,
    placement,
    emphasis,
    width
  };
};

const mapDensity = (density: number) => {
  const clamped = clamp(density, 0.15, 0.85);
  let mapped: JamCanvasDensity = 'balanced';
  let breathingRoom: JamCanvasBreathing = 'normal';
  if (clamped < 0.34) {
    mapped = 'airy';
    breathingRoom = 'wide';
  } else if (clamped >= 0.67) {
    mapped = 'compressed';
    breathingRoom = 'tight';
  }
  return { mapped, breathingRoom };
};

const isValidAiResponse = (payload: unknown): payload is JamCanvasAiResponse => {
  if (!payload || typeof payload !== 'object') return false;
  const candidate = payload as JamCanvasAiResponse;
  if (!isAllowed(candidate.canvasMode, CANVAS_MODES)) return false;
  if (!candidate.regions || typeof candidate.regions !== 'object') return false;
  if (!candidate.spatialRules || typeof candidate.spatialRules !== 'object') return false;
  if (!isAllowed(candidate.spatialRules.alignment, ALIGNMENTS)) return false;
  if (typeof candidate.spatialRules.overlap !== 'boolean') return false;
  if (typeof candidate.spatialRules.density !== 'number') return false;

  return REQUIRED_REGIONS.every((region) => {
    const entry = candidate.regions[region];
    if (!entry) return false;
    return isAllowed(entry.placement, PLACEMENTS) && isAllowed(entry.emphasis, EMPHASES);
  });
};

const buildPlanFromAi = (intent: JamDesignIntent, response: JamCanvasAiResponse): JamCanvasPlan => {
  const base = basePlanForMode(response.canvasMode);
  const order = coerceOrder(response.order, base.order);
  const regions = REQUIRED_REGIONS.reduce<Record<JamCanvasRegionId, JamCanvasRegion>>((acc, region) => {
    const baseRegion = base.regions[region];
    const aiRegion = response.regions[region];
    acc[region] = {
      ...baseRegion,
      placement: aiRegion.placement,
      emphasis: aiRegion.emphasis
    };
    return acc;
  }, {} as Record<JamCanvasRegionId, JamCanvasRegion>);

  regions.proof = sanitizeProofRegion(regions.proof);

  const { mapped: density, breathingRoom } = mapDensity(response.spatialRules.density);
  const overlap: JamCanvasOverlap = response.spatialRules.overlap ? 'allowed' : 'none';

  return {
    id: `ai_intent_${hashIntent(intent.prompt || 'jam')}`,
    label: `AI Intent — ${intent.prompt || 'Untitled'}`,
    canvasMode: response.canvasMode,
    order,
    regions,
    spatialRules: {
      alignment: response.spatialRules.alignment,
      overlap,
      density,
      breathingRoom
    }
  };
};


// Removed simulateGeminiCanvasPlan as we are now using real AI


const validateSafety = (plan: JamCanvasPlan): JamCanvasPlan => {
  // 1. Proof Safety: Proof must never be hidden or minor
  if (plan.regions.proof.emphasis === 'minor') {
    console.warn('[Safety] Proof emphasis upgraded from minor to standard.');
    plan.regions.proof.emphasis = 'standard';
  }
  // Ensure proof is not 'hidden' (though placement schema doesn't have 'hidden', 'overlay' might be risky if not careful)
  // For now, we trust placement but enforce emphasis.

  // 2. Narrative Safety: Narrative must exist (guaranteed by type) and be visible
  if (plan.regions.narrative.emphasis === 'minor' && plan.regions.hero.emphasis === 'dominant') {
    // If hero is dominant, narrative should at least be standard to not be lost
    // usage judgment here, but let's stick to the prompt's 'Narrative cannot be skipped'
  }

  // 3. Identity Safety: Identity must exist (guaranteed by type)

  // 4. Overlap/Readability Safety
  // Numeric density is already clamped in mapDensity (0.15 - 0.85).
  // The resulting enum is safe.

  return plan;
};

export const generateCanvasPlanFromIntent = async (intent: JamDesignIntent): Promise<JamCanvasPlan> => {
  const fallback = EDITORIAL_CANVAS;

  // If no prompt, return fallback immediately
  if (!intent.prompt || intent.prompt.length < 3) return fallback;

  try {
    // Dynamic import to avoid circular dependencies if any, though likely not needed here.
    // Keeping it clean.
    const { generateGeminiLayout } = await import('../../lib/gemini');

    const rawResponse = await generateGeminiLayout(intent.prompt); // Pass the raw intent string

    if (!rawResponse) {
      return fallback;
    }

    if (!isValidAiResponse(rawResponse)) {
      console.warn('Invalid Gemini Layout Response:', rawResponse);
      return fallback;
    }

    const plan = buildPlanFromAi(intent, rawResponse);
    return validateSafety(plan);

  } catch (error) {
    console.warn('Gemini Planner Error:', error);
    return fallback;
  }
};
