import { ThemeConfigV1, DEFAULT_THEME_CONFIG, validateThemeConfig } from './ThemeConfig';
import { DEFAULT_THEME_BEHAVIOR, ThemeBehaviorProfile, validateThemeBehavior } from './ThemeBehavior';
import { DEFAULT_THEME_DOMINANCE, ThemeDominanceProfile, validateThemeDominance } from './ThemeDominance';
import { resolveThemeClasses } from './ThemeClasses';
import { validateExpressionDivergence } from './ThemeExpression';

export const THEME_REGISTRY: Readonly<Record<string, ThemeConfigV1>> = {
  default: DEFAULT_THEME_CONFIG,

  // FROSTED: Ethereal, clean, airy
  frosted: validateThemeConfig({
    version: 1,
    palette: 'light',
    surfaceStyle: 'glass',
    typographyStyle: 'system', // Falling back to expression default 'quiet'
    mood: 'calm',
    accentIntensity: 'low',
    backgroundTreatment: 'gradient'
  }),

  // MIDNIGHT: Dark, cinematic, editorial
  midnight: validateThemeConfig({
    version: 1,
    palette: 'dark',
    surfaceStyle: 'flat', // Matte look
    typographyStyle: 'editorial',
    mood: 'serious',
    accentIntensity: 'high',
    backgroundTreatment: 'plain'
  }),

  // PLAYFUL: Dopamine, chaotic, colorful
  playful: validateThemeConfig({
    version: 1,
    palette: 'light',
    surfaceStyle: 'glass', // Glossy look via expression
    typographyStyle: 'playful',
    mood: 'joyful',
    accentIntensity: 'medium',
    backgroundTreatment: 'gradient'
  }),

  // BRUTALIST: Raw, utilitarian, harsh
  brutalist: validateThemeConfig({
    version: 1,
    palette: 'light',
    surfaceStyle: 'raw',
    typographyStyle: 'system',
    mood: 'brutal',
    accentIntensity: 'high',
    backgroundTreatment: 'plain'
  }),

  // EXPERIMENTAL: Glitchy, dark, weird
  experimental: validateThemeConfig({
    version: 1,
    palette: 'dark',
    surfaceStyle: 'raw', // Unstable look via expression
    typographyStyle: 'editorial',
    mood: 'atmospheric',
    accentIntensity: 'medium',
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
    displayLabel: 'Stockholm · Quiet · Airy'
  },

  // MIDNIGHT: Fashion editorial — bold hero, controlled pacing
  midnight: {
    version: 1,
    heroWeight: 'dominant',
    contentDensity: 'editorial',
    proofProminence: 'featured',
    narrativeFlow: 'linear',
    whitespaceBias: 'neutral',
    displayLabel: 'Cinematic · Editorial · Bold'
  },

  // PLAYFUL: Noisy zine — confrontational, chopped rhythm
  playful: {
    version: 1,
    heroWeight: 'dominant',
    contentDensity: 'dense', // More chaotic
    proofProminence: 'confrontational',
    narrativeFlow: 'fragmented',
    whitespaceBias: 'compressed',
    displayLabel: 'Kinetic · Loud · Chaotic'
  },

  // BRUTALIST: Utility sheet — dense, blunt, fragmented
  brutalist: {
    version: 1,
    heroWeight: 'balanced',
    contentDensity: 'dense',
    proofProminence: 'confrontational',
    narrativeFlow: 'fragmented',
    whitespaceBias: 'neutral',
    displayLabel: 'Raw · Utilitarian · Blunt'
  },

  // EXPERIMENTAL: Immersive manifesto — slow, confrontational
  experimental: {
    version: 1,
    heroWeight: 'restrained', // Mysterious
    contentDensity: 'editorial',
    proofProminence: 'quiet',
    narrativeFlow: 'immersive',
    whitespaceBias: 'generous',
    displayLabel: 'Glitch · Unstable · Void'
  },

  // DEFAULT: Balanced editorial
  default: {
    ...DEFAULT_THEME_BEHAVIOR,
    displayLabel: 'Standard · Balanced · Clean'
  }
};

export const THEME_DOMINANCE_REGISTRY: Readonly<Record<string, ThemeDominanceProfile>> = {
  // FROSTED: Soft presence, clear but quiet hierarchy
  frosted: {
    version: 1,
    heroDominance: 'subdued',
    contentGravity: 'hero',
    visualSilence: 'none',
    hierarchyBreaks: 'allowed',
    displayLabel: 'Hero-Led · Open Hierarchy · Clear'
  },

  // MIDNIGHT: Cinematic command, deep focus
  midnight: {
    version: 1,
    heroDominance: 'overpowering',
    contentGravity: 'hero',
    visualSilence: 'extreme',
    hierarchyBreaks: 'discouraged',
    displayLabel: 'Hero-Led · Extreme Focus · Commanding'
  },

  // PLAYFUL: Loud hero, chopped structure
  playful: {
    version: 1,
    heroDominance: 'primary',
    contentGravity: 'hero',
    visualSilence: 'partial',
    hierarchyBreaks: 'forbidden',
    displayLabel: 'Hero-Led · Partial Silence · Structured'
  },

  // BRUTALIST: Timeline gravity, utilitarian dominance
  brutalist: {
    version: 1,
    heroDominance: 'subdued',
    contentGravity: 'timeline',
    visualSilence: 'partial',
    hierarchyBreaks: 'discouraged',
    displayLabel: 'Timeline-Led · Partial Silence · Utilitarian'
  },

  // EXPERIMENTAL: Proof-led with heavy silence
  experimental: {
    version: 1,
    heroDominance: 'subdued',
    contentGravity: 'proof',
    visualSilence: 'extreme',
    hierarchyBreaks: 'forbidden',
    displayLabel: 'Proof-Led · Extreme Silence · Severe'
  },

  // DEFAULT: Balanced editorial
  default: {
    ...DEFAULT_THEME_DOMINANCE,
    displayLabel: 'Hero-Led · Balanced · Controlled'
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

export const getThemeDominanceById = (id?: string | null): ThemeDominanceProfile => {
  const dominance = (id && THEME_DOMINANCE_REGISTRY[id]) || THEME_DOMINANCE_REGISTRY.default;
  const validated = validateThemeDominance(dominance);
  return {
    ...validated,
    displayLabel: dominance.displayLabel || THEME_DOMINANCE_REGISTRY.default.displayLabel
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

const validateThemeClassDivergence = (): void => {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
  if (!showDevWarning) return;

  const themeEntries = Object.entries(THEME_REGISTRY).filter(([id]) => id !== 'default');
  const classEntries = themeEntries.map(([id, config]) => [id, resolveThemeClasses(config)] as const);

  const tokens = (value: string) => new Set(value.split(/\s+/).filter(Boolean));
  const jaccard = (a: Set<string>, b: Set<string>) => {
    const intersection = new Set([...a].filter((v) => b.has(v)));
    const union = new Set([...a, ...b]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  };

  for (let i = 0; i < classEntries.length; i += 1) {
    const [nameA, classesA] = classEntries[i];
    for (let j = i + 1; j < classEntries.length; j += 1) {
      const [nameB, classesB] = classEntries[j];

      const sections: Array<[keyof typeof classesA, number]> = [
        ['page', jaccard(tokens(classesA.page), tokens(classesB.page))],
        ['surface', jaccard(tokens(classesA.surface), tokens(classesB.surface))],
        ['card', jaccard(tokens(classesA.card), tokens(classesB.card))],
        ['title', jaccard(tokens(classesA.title), tokens(classesB.title))],
        ['body', jaccard(tokens(classesA.body), tokens(classesB.body))],
        ['accent', jaccard(tokens(classesA.accent), tokens(classesB.accent))]
      ];

      const average = sections.reduce((sum, [, score]) => sum + score, 0) / sections.length;
      const high = sections.filter(([, score]) => score >= 0.8);

      if (average >= 0.75 || high.length >= 4) {
        const highList = high.map(([key]) => key).join(', ');
        console.warn(
          `[ThemeClasses] SIMILARITY WARNING: "${nameA}" and "${nameB}" share high class overlap (avg=${average.toFixed(2)}). ` +
          `High-overlap sections: ${highList || 'none'}.`
        );
      }
    }
  }
};

validateBehaviorCoverageAndDivergence();
validateExpressionDivergence(Object.keys(THEME_REGISTRY));
validateThemeClassDivergence();

const validateDominanceCoverageAndDivergence = (): void => {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
  if (!showDevWarning) return;

  const themeIds = Object.keys(THEME_REGISTRY);
  const dominanceIds = Object.keys(THEME_DOMINANCE_REGISTRY);

  for (const id of themeIds) {
    if (!dominanceIds.includes(id)) {
      console.warn(`[ThemeDominance] Missing dominance profile for theme "${id}".`);
    }
  }

  const entries = Object.entries(THEME_DOMINANCE_REGISTRY).filter(([id]) => id !== 'default');

  for (let i = 0; i < entries.length; i += 1) {
    const [nameA, domA] = entries[i];
    for (let j = i + 1; j < entries.length; j += 1) {
      const [nameB, domB] = entries[j];

      const matches = [
        domA.heroDominance === domB.heroDominance,
        domA.contentGravity === domB.contentGravity,
        domA.visualSilence === domB.visualSilence,
        domA.hierarchyBreaks === domB.hierarchyBreaks
      ].filter(Boolean).length;

      if (matches > 1) {
        console.warn(
          `[ThemeDominance] DIVERGENCE VIOLATION: "${nameA}" and "${nameB}" share ${matches} dominance values.`
        );
      }
    }
  }
};

validateDominanceCoverageAndDivergence();
