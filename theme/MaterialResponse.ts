// ============================================================================
// MATERIAL RESPONSE CONTRACT
// ============================================================================
// Subtle, near-invisible physical feedback. No overt animation.
// ============================================================================

export const MATERIAL_RESPONSE_VERSION = 1 as const;

export type SurfaceWeight = 'light' | 'medium' | 'heavy';
export type InteractionTension = 'soft' | 'firm' | 'rigid';
export type SettleBehavior = 'float' | 'snap' | 'sink';
export type FeedbackVisibility = 'subtle' | 'present' | 'assertive';

export interface MaterialResponseV1 {
  version: 1;
  surfaceWeight: SurfaceWeight;
  interactionTension: InteractionTension;
  settleBehavior: SettleBehavior;
  feedbackVisibility: FeedbackVisibility;
}

export interface MaterialResponseProfile extends MaterialResponseV1 {
  displayLabel: string; // Used in Control Center, e.g., "Soft · Floating"
}

export const DEFAULT_MATERIAL_RESPONSE: MaterialResponseV1 = {
  version: MATERIAL_RESPONSE_VERSION,
  surfaceWeight: 'medium',
  interactionTension: 'firm',
  settleBehavior: 'snap',
  feedbackVisibility: 'subtle'
};

export function validateMaterialResponse(
  input: Partial<MaterialResponseV1> | null | undefined
): MaterialResponseV1 {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;

  if (!input || input.version !== MATERIAL_RESPONSE_VERSION) {
    if (showDevWarning) {
      console.warn('[MaterialResponse] Invalid response config. Falling back to DEFAULT_MATERIAL_RESPONSE.');
    }
    return DEFAULT_MATERIAL_RESPONSE;
  }

  return {
    ...DEFAULT_MATERIAL_RESPONSE,
    ...input
  };
}
