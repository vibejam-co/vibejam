// ============================================================================
// THEME IDENTITY CONTRACT
// ============================================================================
// Tracks how permanent or authored a theme feels. Deterministic, reversible,
// and debuggable. No persistence here.
// ============================================================================

export const THEME_IDENTITY_VERSION = 1 as const;

export type IdentityWeight = 'light' | 'committed' | 'locked';
export type AuthoredBy = 'system' | 'creator' | 'remix';
export type Stability = 'fluid' | 'semi-stable' | 'stable';

export interface ThemeIdentityV1 {
  version: 1;
  identityWeight: IdentityWeight;
  authoredBy: AuthoredBy;
  stability: Stability;
  narrativeLock: boolean;
}

export const DEFAULT_THEME_IDENTITY: ThemeIdentityV1 = {
  version: THEME_IDENTITY_VERSION,
  identityWeight: 'light',
  authoredBy: 'system',
  stability: 'fluid',
  narrativeLock: false
};

// ============================================================================
// VALIDATOR (dev warnings only, never throws)
// ============================================================================
export function validateThemeIdentity(
  input: Partial<ThemeIdentityV1> | null | undefined
): ThemeIdentityV1 {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;

  if (!input || input.version !== THEME_IDENTITY_VERSION) {
    if (showDevWarning) {
      console.warn('[ThemeIdentity] Invalid identity config. Falling back to DEFAULT_THEME_IDENTITY.');
    }
    return DEFAULT_THEME_IDENTITY;
  }

  return {
    ...DEFAULT_THEME_IDENTITY,
    ...input
  };
}
