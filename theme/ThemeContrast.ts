// ============================================================================
// THEME CONTRAST CONTRACT
// ============================================================================
// Defines editorial POV: which sections are prioritized or suppressed.
// Read-only at runtime. No layout or data changes.
// ============================================================================

export const THEME_CONTRAST_VERSION = 1 as const;

export type ContrastSection = 'proof' | 'hero' | 'journey' | 'builder';
export type MoralTone = 'proud' | 'skeptical' | 'confrontational' | 'playful' | 'reverent';
export type TrustSignal = 'quiet' | 'loud' | 'institutional' | 'chaotic';

export interface ThemeContrastV1 {
  version: 1;
  emphasizes: ContrastSection;
  suppresses: ContrastSection;
  moralTone: MoralTone;
  trustSignal: TrustSignal;
}

export interface ThemeContrastProfile extends ThemeContrastV1 {
  displayLabel: string; // Used in Control Center, e.g., "Skeptical · Proof-First · Institutional"
}

export const DEFAULT_THEME_CONTRAST: ThemeContrastV1 = {
  version: THEME_CONTRAST_VERSION,
  emphasizes: 'hero',
  suppresses: 'proof',
  moralTone: 'reverent',
  trustSignal: 'quiet'
};

// ============================================================================
// VALIDATOR (dev warnings only, never throws)
// ============================================================================
export function validateThemeContrast(
  input: Partial<ThemeContrastV1> | null | undefined
): ThemeContrastV1 {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;

  if (!input || input.version !== THEME_CONTRAST_VERSION) {
    if (showDevWarning) {
      console.warn('[ThemeContrast] Invalid contrast config. Falling back to DEFAULT_THEME_CONTRAST.');
    }
    return DEFAULT_THEME_CONTRAST;
  }

  return {
    ...DEFAULT_THEME_CONTRAST,
    ...input
  };
}

// ============================================================================
// DEV VALIDATION (no crashes)
// ============================================================================
export function validateContrastRules(registry: Record<string, ThemeContrastProfile>): void {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
  if (!showDevWarning) return;

  const entries = Object.entries(registry).filter(([id]) => id !== 'default');
  const pairSet = new Set<string>();

  for (const [id, profile] of entries) {
    if (profile.emphasizes === profile.suppresses) {
      console.warn(
        `[ThemeContrast] INVALID: Theme "${id}" emphasizes and suppresses the same section ("${profile.emphasizes}").`
      );
    }

    const pairKey = `${profile.emphasizes}::${profile.moralTone}`;
    if (pairSet.has(pairKey)) {
      console.warn(
        `[ThemeContrast] COLLISION: Another theme already uses emphasizes+moralTone "${pairKey}".`
      );
    } else {
      pairSet.add(pairKey);
    }
  }

  // Detect direct circular contrasts (A emphasizes X suppresses Y, B emphasizes Y suppresses X)
  for (let i = 0; i < entries.length; i += 1) {
    const [nameA, a] = entries[i];
    for (let j = i + 1; j < entries.length; j += 1) {
      const [nameB, b] = entries[j];
      if (a.emphasizes === b.suppresses && a.suppresses === b.emphasizes) {
        console.warn(
          `[ThemeContrast] CIRCULAR: "${nameA}" and "${nameB}" are direct opposites (${a.emphasizes}↔${a.suppresses}).`
        );
      }
    }
  }

  // Neutral graph warning: all themes emphasize + suppress the same pair
  const uniqueEdges = new Set(entries.map(([, p]) => `${p.emphasizes}→${p.suppresses}`));
  if (uniqueEdges.size <= 1) {
    console.warn('[ThemeContrast] NEUTRAL: All themes share the same emphasis/suppression edge.');
  }

  // Switching validation: warn if any pair changes fewer than 2 section emphases
  const sections: ContrastSection[] = ['hero', 'journey', 'proof', 'builder'];
  for (let i = 0; i < entries.length; i += 1) {
    const [nameA, a] = entries[i];
    for (let j = i + 1; j < entries.length; j += 1) {
      const [nameB, b] = entries[j];

      const scores = (p: ThemeContrastProfile) => {
        const map: Record<ContrastSection, number> = { hero: 0, journey: 0, proof: 0, builder: 0 };
        map[p.emphasizes] = 1;
        map[p.suppresses] = -1;
        return map;
      };

      const aScore = scores(a);
      const bScore = scores(b);
      const diffCount = sections.filter((s) => aScore[s] !== bScore[s]).length;

      if (diffCount < 2) {
        console.warn(
          `[ThemeContrast] LOW DELTA: Switching "${nameA}" → "${nameB}" alters only ${diffCount} section emphases.`
        );
      }
    }
  }
}
