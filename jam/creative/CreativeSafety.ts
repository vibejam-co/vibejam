import { CreativeSurfaceConfig, DEFAULT_CREATIVE_SURFACE_CONFIG } from './CreativeSurfaceConfig';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isDev = () => typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;

const warn = (message: string) => {
  if (isDev()) {
    console.warn(`[CreativeSafety] ${message}`);
  }
};

export const CREATIVE_SIGNAL_CONSTRAINTS = {
  proofVisibility: 'always_visible',
  narrativeOrder: 'fixed',
  silenceSemantics: 'preserved',
  minimumLegibility: 'enforced'
} as const;

export const enforceCreativeSafety = (
  input: Partial<CreativeSurfaceConfig>
): CreativeSurfaceConfig => {
  const safe: CreativeSurfaceConfig = {
    ...DEFAULT_CREATIVE_SURFACE_CONFIG,
    ...input,
    colorSlots: {
      ...DEFAULT_CREATIVE_SURFACE_CONFIG.colorSlots,
      ...(input.colorSlots || {})
    },
    typographySlots: {
      ...DEFAULT_CREATIVE_SURFACE_CONFIG.typographySlots,
      ...(input.typographySlots || {})
    }
  };

  if (!safe.gridVariant) {
    warn('Missing gridVariant; falling back to default.');
    safe.gridVariant = DEFAULT_CREATIVE_SURFACE_CONFIG.gridVariant;
  }

  const rhythm = Number.isFinite(safe.rhythmScale) ? safe.rhythmScale : DEFAULT_CREATIVE_SURFACE_CONFIG.rhythmScale;
  const clampedRhythm = clamp(rhythm, 0.8, 1.2);
  if (clampedRhythm !== rhythm) {
    warn(`rhythmScale clamped from ${rhythm} to ${clampedRhythm}.`);
  }
  safe.rhythmScale = clampedRhythm;

  const sanitizeColor = (value: string, fallback: string, allowTransparent = false) => {
    if (!value) return fallback;
    if (!allowTransparent && value === 'transparent') return fallback;
    return value;
  };

  safe.colorSlots.primary = sanitizeColor(safe.colorSlots.primary, 'current');
  safe.colorSlots.secondary = sanitizeColor(safe.colorSlots.secondary, 'current');
  safe.colorSlots.accent = sanitizeColor(safe.colorSlots.accent, 'current');
  safe.colorSlots.background = sanitizeColor(safe.colorSlots.background, 'transparent', true);
  safe.colorSlots.contrast = sanitizeColor(safe.colorSlots.contrast, 'current');

  const sanitizeType = (value: string, fallback: string) => (value ? value : fallback);
  safe.typographySlots.display = sanitizeType(safe.typographySlots.display, 'inherit');
  safe.typographySlots.body = sanitizeType(safe.typographySlots.body, 'inherit');
  safe.typographySlots.meta = sanitizeType(safe.typographySlots.meta, 'inherit');

  // Guardrails: creative surface can never override proof/narrative/silence logic.
  return safe;
};
