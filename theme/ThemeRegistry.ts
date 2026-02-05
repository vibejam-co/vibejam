import { ThemeConfigV1, DEFAULT_THEME_CONFIG, validateThemeConfig } from './ThemeConfig';
import { DEFAULT_THEME_BEHAVIOR, ThemeBehaviorProfile, validateThemeBehavior } from './ThemeBehavior';

export const THEME_REGISTRY: Readonly<Record<string, ThemeConfigV1>> = {
  default: DEFAULT_THEME_CONFIG,
  frosted: validateThemeConfig({
    version: 1,
    palette: 'light',
    surfaceStyle: 'glass',
    typographyStyle: 'system',
    mood: 'calm',
    accentIntensity: 'low',
    backgroundTreatment: 'texture'
  }),
  midnight: validateThemeConfig({
    version: 1,
    palette: 'dark',
    surfaceStyle: 'flat',
    typographyStyle: 'editorial',
    mood: 'serious',
    accentIntensity: 'medium',
    backgroundTreatment: 'texture'
  }),
  playful: validateThemeConfig({
    version: 1,
    palette: 'light',
    surfaceStyle: 'glass',
    typographyStyle: 'playful',
    mood: 'joyful',
    accentIntensity: 'medium',
    backgroundTreatment: 'gradient'
  }),
  brutalist: validateThemeConfig({
    version: 1,
    palette: 'light',
    surfaceStyle: 'raw',
    typographyStyle: 'system',
    mood: 'brutal',
    accentIntensity: 'medium',
    backgroundTreatment: 'plain'
  }),
  experimental: validateThemeConfig({
    version: 1,
    palette: 'dark',
    surfaceStyle: 'raw',
    typographyStyle: 'editorial',
    mood: 'atmospheric',
    accentIntensity: 'high',
    backgroundTreatment: 'gradient'
  })
};

export const THEME_BEHAVIOR_REGISTRY: Readonly<Record<string, ThemeBehaviorProfile>> = {
  // FROSTED: Quiet journal — restrained, airy, linear
  frosted: {
    version: 1,
    heroWeight: 'restrained',
    contentDensity: 'sparse',
    proofProminence: 'quiet',
    narrativeFlow: 'linear',
    whitespaceBias: 'generous',
    displayLabel: 'Sparse · Linear · Restrained Hero'
  },
  // MIDNIGHT: Fashion editorial — bold hero, controlled pacing
  midnight: {
    version: 1,
    heroWeight: 'dominant',
    contentDensity: 'editorial',
    proofProminence: 'featured',
    narrativeFlow: 'linear',
    whitespaceBias: 'neutral',
    displayLabel: 'Editorial · Linear · Dominant Hero'
  },
  // PLAYFUL: Noisy zine — confrontational, chopped rhythm
  playful: {
    version: 1,
    heroWeight: 'dominant',
    contentDensity: 'sparse',
    proofProminence: 'confrontational',
    narrativeFlow: 'fragmented',
    whitespaceBias: 'compressed',
    displayLabel: 'Fragmented · Confrontational · Dominant Hero'
  },
  // BRUTALIST: Utility sheet — dense, blunt, fragmented
  brutalist: {
    version: 1,
    heroWeight: 'balanced',
    contentDensity: 'dense',
    proofProminence: 'quiet',
    narrativeFlow: 'fragmented',
    whitespaceBias: 'neutral',
    displayLabel: 'Dense · Fragmented · Quiet Proof'
  },
  // EXPERIMENTAL: Immersive manifesto — slow, confrontational
  experimental: {
    version: 1,
    heroWeight: 'balanced',
    contentDensity: 'editorial',
    proofProminence: 'confrontational',
    narrativeFlow: 'immersive',
    whitespaceBias: 'generous',
    displayLabel: 'Immersive · Confrontational · Balanced Hero'
  },
  // DEFAULT: Balanced editorial
  default: {
    ...DEFAULT_THEME_BEHAVIOR,
    displayLabel: 'Editorial · Linear · Balanced Hero'
  }
};

export const getThemeById = (id?: string | null): ThemeConfigV1 | null => {
  if (!id) return null;
  return THEME_REGISTRY[id] || null;
};

export const getThemeBehaviorById = (id?: string | null): ThemeBehaviorProfile => {
  const behavior = (id && THEME_BEHAVIOR_REGISTRY[id]) || THEME_BEHAVIOR_REGISTRY.default;
  const validated = validateThemeBehavior(behavior);
  return {
    ...validated,
    displayLabel: behavior.displayLabel || THEME_BEHAVIOR_REGISTRY.default.displayLabel
  };
};

// ============================================================================
// VALIDATION (DEV ONLY)
// ============================================================================
const validateBehaviorCoverageAndDivergence = (): void => {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
  if (!showDevWarning) return;

  const themeIds = Object.keys(THEME_REGISTRY);
  const behaviorIds = Object.keys(THEME_BEHAVIOR_REGISTRY);

  for (const id of themeIds) {
    if (!behaviorIds.includes(id)) {
      console.warn(`[ThemeBehavior] Missing behavior profile for theme "${id}".`);
    }
  }

  const entries = Object.entries(THEME_BEHAVIOR_REGISTRY).filter(([id]) => id !== 'default');

  for (let i = 0; i < entries.length; i += 1) {
    const [nameA, behaviorA] = entries[i];
    for (let j = i + 1; j < entries.length; j += 1) {
      const [nameB, behaviorB] = entries[j];

      const matches = [
        behaviorA.heroWeight === behaviorB.heroWeight,
        behaviorA.contentDensity === behaviorB.contentDensity,
        behaviorA.proofProminence === behaviorB.proofProminence,
        behaviorA.narrativeFlow === behaviorB.narrativeFlow,
        behaviorA.whitespaceBias === behaviorB.whitespaceBias
      ].filter(Boolean).length;

      if (matches > 1) {
        console.warn(
          `[ThemeBehavior] DIVERGENCE VIOLATION: "${nameA}" and "${nameB}" share ${matches} identical behavior fields.`
        );
      }
    }
  }
};

validateBehaviorCoverageAndDivergence();
