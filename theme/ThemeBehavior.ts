// ============================================================================
// THEME BEHAVIOR CONTRACT
// ============================================================================
// Controls content rhythm, emphasis, and narrative pacing WITHOUT
// modifying layout logic or data structures. Themes feel like different
// editorial philosophies, not just visual skins.
// ============================================================================

export const THEME_BEHAVIOR_VERSION = 1 as const;

// Hero prominence affects how "loud" the hero section feels
export type HeroWeight = 'dominant' | 'balanced' | 'restrained';

// Content density controls information packing vs breathing room
export type ContentDensity = 'sparse' | 'editorial' | 'dense';

// Proof/social credibility visibility
export type ProofProminence = 'quiet' | 'featured' | 'confrontational';

// Narrative flow controls reading rhythm
export type NarrativeFlow = 'linear' | 'fragmented' | 'immersive';

// Whitespace philosophy
export type WhitespaceBias = 'generous' | 'neutral' | 'compressed';

export interface ThemeBehaviorV1 {
  version: 1;
  heroWeight: HeroWeight;
  contentDensity: ContentDensity;
  proofProminence: ProofProminence;
  narrativeFlow: NarrativeFlow;
  whitespaceBias: WhitespaceBias;
}

// Default: balanced, editorial, neutral
export const DEFAULT_THEME_BEHAVIOR: ThemeBehaviorV1 = {
  version: THEME_BEHAVIOR_VERSION,
  heroWeight: 'balanced',
  contentDensity: 'editorial',
  proofProminence: 'featured',
  narrativeFlow: 'linear',
  whitespaceBias: 'neutral'
};

// ============================================================================
// VALIDATOR (dev warnings only, never throws)
// ============================================================================
export function validateThemeBehavior(
  input: Partial<ThemeBehaviorV1> | null | undefined
): ThemeBehaviorV1 {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;

  if (!input || input.version !== THEME_BEHAVIOR_VERSION) {
    if (showDevWarning) {
      console.warn('[ThemeBehavior] Invalid behavior config. Falling back to DEFAULT_THEME_BEHAVIOR.');
    }
    return DEFAULT_THEME_BEHAVIOR;
  }

  // Merge with defaults for any missing fields
  const merged: ThemeBehaviorV1 = {
    ...DEFAULT_THEME_BEHAVIOR,
    ...input
  };

  return merged;
}

// ============================================================================
// BEHAVIOR DIVERGENCE ENFORCEMENT
// Per-theme behavior definitions — each theme reads like a different editor
// ============================================================================

export interface ThemeBehaviorProfile extends ThemeBehaviorV1 {
  displayLabel: string; // Used in Control Center, e.g., "Sparse · Immersive · Dominant Hero"
}
