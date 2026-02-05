// ============================================================================
// THEME DOMINANCE CONTRACT
// ============================================================================
// Controls editorial imbalance: which regions overpower others, and how
// aggressively hierarchy is enforced. Composition only.
// ============================================================================

export const THEME_DOMINANCE_VERSION = 1 as const;

export type HeroDominance = 'overpowering' | 'primary' | 'subdued';
export type ContentGravity = 'hero' | 'timeline' | 'proof';
export type VisualSilence = 'none' | 'partial' | 'extreme';
export type HierarchyBreaks = 'allowed' | 'discouraged' | 'forbidden';

export interface ThemeDominanceV1 {
  version: 1;
  heroDominance: HeroDominance;
  contentGravity: ContentGravity;
  visualSilence: VisualSilence;
  hierarchyBreaks: HierarchyBreaks;
}

export interface ThemeDominanceProfile extends ThemeDominanceV1 {
  displayLabel: string; // Used in Control Center, e.g., "Hero-Led · Silent Proof · Extreme Focus"
}

export const DEFAULT_THEME_DOMINANCE: ThemeDominanceV1 = {
  version: THEME_DOMINANCE_VERSION,
  heroDominance: 'primary',
  contentGravity: 'hero',
  visualSilence: 'none',
  hierarchyBreaks: 'discouraged'
};

// ============================================================================
// VALIDATOR (dev warnings only, never throws)
// ============================================================================
export function validateThemeDominance(
  input: Partial<ThemeDominanceV1> | null | undefined
): ThemeDominanceV1 {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;

  if (!input || input.version !== THEME_DOMINANCE_VERSION) {
    if (showDevWarning) {
      console.warn('[ThemeDominance] Invalid dominance config. Falling back to DEFAULT_THEME_DOMINANCE.');
    }
    return DEFAULT_THEME_DOMINANCE;
  }

  return {
    ...DEFAULT_THEME_DOMINANCE,
    ...input
  };
}
