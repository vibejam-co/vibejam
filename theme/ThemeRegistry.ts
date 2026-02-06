import { ThemeConfigV1, DEFAULT_THEME_CONFIG, validateThemeConfig } from './ThemeConfig';
import { DEFAULT_THEME_BEHAVIOR, ThemeBehaviorProfile, validateThemeBehavior } from './ThemeBehavior';
import { DEFAULT_THEME_DOMINANCE, ThemeDominanceProfile, validateThemeDominance } from './ThemeDominance';
import { DEFAULT_THEME_CONTRAST, ThemeContrastProfile, validateThemeContrast, validateContrastRules } from './ThemeContrast';
import { DEFAULT_MATERIAL_RESPONSE, MaterialResponseProfile, validateMaterialResponse } from './MaterialResponse';
import { resolveThemeClasses } from './ThemeClasses';
import { validateExpressionDivergence } from './ThemeExpression';
import { warnIfJamRuntimeInactive } from '../lib/jamRuntime';

const buildThemeRegistry = (): Readonly<Record<string, ThemeConfigV1>> => ({
  default: DEFAULT_THEME_CONFIG,

  // FROSTED: Ethereal, clean, airy
  frosted: {
    version: 1,
    palette: 'light',
    surfaceStyle: 'glass',
    typographyStyle: 'system', // Falling back to expression default 'quiet'
    mood: 'calm',
    accentIntensity: 'low',
    backgroundTreatment: 'gradient'
  },

  // MIDNIGHT: Dark, cinematic, editorial
  midnight: {
    version: 1,
    palette: 'dark',
    surfaceStyle: 'flat', // Matte look
    typographyStyle: 'editorial',
    mood: 'serious',
    accentIntensity: 'high',
    backgroundTreatment: 'plain'
  },

  // PLAYFUL: Dopamine, chaotic, colorful
  playful: {
    version: 1,
    palette: 'light',
    surfaceStyle: 'glass', // Glossy look via expression
    typographyStyle: 'playful',
    mood: 'joyful',
    accentIntensity: 'medium',
    backgroundTreatment: 'gradient'
  },

  // BRUTALIST: Audit, raw, utilitarian, harsh
  brutalist: {
    version: 1,
    palette: 'light',
    surfaceStyle: 'raw',
    typographyStyle: 'system',
    mood: 'brutal',
    accentIntensity: 'high',
    backgroundTreatment: 'plain'
  },

  // EXPERIMENTAL: Glitchy, dark, weird
  experimental: {
    version: 1,
    palette: 'dark',
    surfaceStyle: 'raw', // Unstable look via expression
    typographyStyle: 'editorial',
    mood: 'atmospheric',
    accentIntensity: 'medium',
    backgroundTreatment: 'gradient'
  }
});

const buildThemeBehaviorRegistry = (): Readonly<Record<string, ThemeBehaviorProfile>> => ({
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
});

const buildThemeDominanceRegistry = (): Readonly<Record<string, ThemeDominanceProfile>> => ({
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
});

const buildThemeContrastRegistry = (): Readonly<Record<string, ThemeContrastProfile>> => ({
  // FROSTED: Reverent, journey-first, quiet trust
  frosted: {
    version: 1,
    emphasizes: 'journey',
    suppresses: 'hero',
    moralTone: 'reverent',
    trustSignal: 'quiet',
    displayLabel: 'Reverent · Journey-First · Quiet'
  },

  // MIDNIGHT: Proud, hero-first, institutional trust
  midnight: {
    version: 1,
    emphasizes: 'hero',
    suppresses: 'builder',
    moralTone: 'proud',
    trustSignal: 'institutional',
    displayLabel: 'Proud · Hero-Led · Institutional'
  },

  // PLAYFUL: Playful POV, builder-first, chaotic trust
  playful: {
    version: 1,
    emphasizes: 'builder',
    suppresses: 'proof',
    moralTone: 'playful',
    trustSignal: 'chaotic',
    displayLabel: 'Playful · Builder-Led · Chaotic'
  },

  // BRUTALIST: Skeptical, proof-first, institutional trust
  brutalist: {
    version: 1,
    emphasizes: 'proof',
    suppresses: 'journey',
    moralTone: 'skeptical',
    trustSignal: 'institutional',
    displayLabel: 'Skeptical · Proof-First · Institutional'
  },

  // EXPERIMENTAL: Confrontational, proof-first, loud trust
  experimental: {
    version: 1,
    emphasizes: 'proof',
    suppresses: 'hero',
    moralTone: 'confrontational',
    trustSignal: 'loud',
    displayLabel: 'Confrontational · Proof-First · Loud'
  },

  // DEFAULT: Balanced editorial
  default: {
    ...DEFAULT_THEME_CONTRAST,
    displayLabel: 'Reverent · Hero-Led · Quiet'
  }
});

const buildThemeMaterialRegistry = (): Readonly<Record<string, MaterialResponseProfile>> => ({
  frosted: {
    version: 1,
    surfaceWeight: 'light',
    interactionTension: 'soft',
    settleBehavior: 'float',
    feedbackVisibility: 'subtle',
    displayLabel: 'Soft · Floating'
  },
  midnight: {
    version: 1,
    surfaceWeight: 'heavy',
    interactionTension: 'rigid',
    settleBehavior: 'sink',
    feedbackVisibility: 'present',
    displayLabel: 'Rigid · Sinking'
  },
  playful: {
    version: 1,
    surfaceWeight: 'light',
    interactionTension: 'firm',
    settleBehavior: 'snap',
    feedbackVisibility: 'assertive',
    displayLabel: 'Firm · Snapped'
  },
  brutalist: {
    version: 1,
    surfaceWeight: 'heavy',
    interactionTension: 'rigid',
    settleBehavior: 'snap',
    feedbackVisibility: 'subtle',
    displayLabel: 'Rigid · Snapped'
  },
  experimental: {
    version: 1,
    surfaceWeight: 'medium',
    interactionTension: 'soft',
    settleBehavior: 'sink',
    feedbackVisibility: 'assertive',
    displayLabel: 'Soft · Sinking'
  },
  default: {
    ...DEFAULT_MATERIAL_RESPONSE,
    displayLabel: 'Firm · Snapped'
  }
});

let cachedThemeRegistry: Readonly<Record<string, ThemeConfigV1>> | null = null;
let cachedBehaviorRegistry: Readonly<Record<string, ThemeBehaviorProfile>> | null = null;
let cachedDominanceRegistry: Readonly<Record<string, ThemeDominanceProfile>> | null = null;
let cachedContrastRegistry: Readonly<Record<string, ThemeContrastProfile>> | null = null;
let cachedMaterialRegistry: Readonly<Record<string, MaterialResponseProfile>> | null = null;

export const getThemeRegistry = (): Readonly<Record<string, ThemeConfigV1>> => {
  warnIfJamRuntimeInactive('ThemeRegistry');
  if (!cachedThemeRegistry) cachedThemeRegistry = buildThemeRegistry();
  return cachedThemeRegistry;
};

export const getThemeBehaviorRegistry = (): Readonly<Record<string, ThemeBehaviorProfile>> => {
  warnIfJamRuntimeInactive('ThemeBehaviorRegistry');
  if (!cachedBehaviorRegistry) cachedBehaviorRegistry = buildThemeBehaviorRegistry();
  return cachedBehaviorRegistry;
};

export const getThemeDominanceRegistry = (): Readonly<Record<string, ThemeDominanceProfile>> => {
  warnIfJamRuntimeInactive('ThemeDominanceRegistry');
  if (!cachedDominanceRegistry) cachedDominanceRegistry = buildThemeDominanceRegistry();
  return cachedDominanceRegistry;
};

export const getThemeContrastRegistry = (): Readonly<Record<string, ThemeContrastProfile>> => {
  warnIfJamRuntimeInactive('ThemeContrastRegistry');
  if (!cachedContrastRegistry) cachedContrastRegistry = buildThemeContrastRegistry();
  return cachedContrastRegistry;
};

export const getThemeMaterialRegistry = (): Readonly<Record<string, MaterialResponseProfile>> => {
  warnIfJamRuntimeInactive('ThemeMaterialRegistry');
  if (!cachedMaterialRegistry) cachedMaterialRegistry = buildThemeMaterialRegistry();
  return cachedMaterialRegistry;
};

export const getThemeById = (id?: string | null): ThemeConfigV1 | null => {
  if (!id) return null;
  const theme = getThemeRegistry()[id] || null;
  return theme ? validateThemeConfig(theme) : null;
};

export const getThemeBehaviorById = (id?: string | null): ThemeBehaviorProfile => {
  const registry = getThemeBehaviorRegistry();
  const behavior = (id && registry[id]) || registry.default;
  const validated = validateThemeBehavior(behavior);
  return {
    ...validated,
    displayLabel: behavior.displayLabel || registry.default.displayLabel
  };
};

export const getThemeDominanceById = (id?: string | null): ThemeDominanceProfile => {
  const registry = getThemeDominanceRegistry();
  const dominance = (id && registry[id]) || registry.default;
  const validated = validateThemeDominance(dominance);
  return {
    ...validated,
    displayLabel: dominance.displayLabel || registry.default.displayLabel
  };
};

export const getThemeContrastById = (id?: string | null): ThemeContrastProfile => {
  const registry = getThemeContrastRegistry();
  const contrast = (id && registry[id]) || registry.default;
  const validated = validateThemeContrast(contrast);
  return {
    ...validated,
    displayLabel: contrast.displayLabel || registry.default.displayLabel
  };
};

export const getThemeMaterialById = (id?: string | null): MaterialResponseProfile => {
  const registry = getThemeMaterialRegistry();
  const material = (id && registry[id]) || registry.default;
  const validated = validateMaterialResponse(material);
  return {
    ...validated,
    displayLabel: material.displayLabel || registry.default.displayLabel
  };
};

// ============================================================================
// VALIDATION (DEV ONLY)
// ============================================================================
const validateBehaviorCoverageAndDivergence = (): void => {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
  if (!showDevWarning) return;

  const themeIds = Object.keys(getThemeRegistry());
  const behaviorIds = Object.keys(getThemeBehaviorRegistry());

  for (const id of themeIds) {
    if (!behaviorIds.includes(id)) {
      console.warn(`[ThemeBehavior] Missing behavior profile for theme "${id}".`);
    }
  }

  const entries = Object.entries(getThemeBehaviorRegistry()).filter(([id]) => id !== 'default');

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

  const themeEntries = Object.entries(getThemeRegistry()).filter(([id]) => id !== 'default');
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

const validateDominanceCoverageAndDivergence = (): void => {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
  if (!showDevWarning) return;

  const themeIds = Object.keys(getThemeRegistry());
  const dominanceIds = Object.keys(getThemeDominanceRegistry());

  for (const id of themeIds) {
    if (!dominanceIds.includes(id)) {
      console.warn(`[ThemeDominance] Missing dominance profile for theme "${id}".`);
    }
  }

  const entries = Object.entries(getThemeDominanceRegistry()).filter(([id]) => id !== 'default');

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

const validateContrastCoverage = (): void => {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
  if (!showDevWarning) return;

  const themeIds = Object.keys(getThemeRegistry());
  const contrastIds = Object.keys(getThemeContrastRegistry());

  for (const id of themeIds) {
    if (!contrastIds.includes(id)) {
      console.warn(`[ThemeContrast] Missing contrast profile for theme "${id}".`);
    }
  }
};


const validateMaterialCoverageAndDivergence = (): void => {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
  if (!showDevWarning) return;

  const themeIds = Object.keys(getThemeRegistry());
  const materialIds = Object.keys(getThemeMaterialRegistry());

  for (const id of themeIds) {
    if (!materialIds.includes(id)) {
      console.warn(`[MaterialResponse] Missing material profile for theme "${id}".`);
    }
  }

  const entries = Object.entries(getThemeMaterialRegistry()).filter(([id]) => id !== 'default');
  const profileSet = new Set<string>();

  for (const [name, profile] of entries) {
    const key = `${profile.surfaceWeight}:${profile.interactionTension}:${profile.settleBehavior}:${profile.feedbackVisibility}`;
    if (profileSet.has(key)) {
      console.warn(
        `[MaterialResponse] DUPLICATE PROFILE: "${name}" shares an identical material profile.`
      );
    }
    profileSet.add(key);
  }
};

let hasRunDevChecks = false;

export const runThemeRegistryDevChecks = (): void => {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
  if (!showDevWarning || hasRunDevChecks) return;
  hasRunDevChecks = true;

  validateBehaviorCoverageAndDivergence();
  validateExpressionDivergence(Object.keys(getThemeRegistry()));
  validateThemeClassDivergence();
  validateDominanceCoverageAndDivergence();
  validateContrastCoverage();
  validateContrastRules(getThemeContrastRegistry());
  validateMaterialCoverageAndDivergence();
};
