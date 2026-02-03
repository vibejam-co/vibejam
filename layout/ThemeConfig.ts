export const THEME_CONFIG_VERSION = 1 as const;

export type ThemeConfigV1 = {
  version: 1;
  palette: 'light' | 'dark';
  surfaceStyle: 'flat' | 'glass' | 'soft' | 'raw';
  typographyStyle: 'system' | 'editorial' | 'playful';
  mood: 'calm' | 'serious' | 'joyful' | 'brutal' | 'atmospheric';
  accentIntensity: 'low' | 'medium' | 'high';
  backgroundTreatment: 'plain' | 'gradient' | 'texture';
};

export const DEFAULT_THEME_CONFIG: ThemeConfigV1 = {
  version: THEME_CONFIG_VERSION,
  palette: 'light',
  surfaceStyle: 'flat',
  typographyStyle: 'system',
  mood: 'calm',
  accentIntensity: 'low',
  backgroundTreatment: 'plain'
};

export const THEME_PRESETS: Record<string, ThemeConfigV1> = {
  frosted: {
    ...DEFAULT_THEME_CONFIG,
    surfaceStyle: 'glass',
    mood: 'atmospheric'
  },
  midnight: {
    ...DEFAULT_THEME_CONFIG,
    palette: 'dark',
    surfaceStyle: 'raw',
    mood: 'serious'
  },
  brutalist: {
    ...DEFAULT_THEME_CONFIG,
    surfaceStyle: 'raw',
    typographyStyle: 'editorial',
    mood: 'brutal'
  },
  playful: {
    ...DEFAULT_THEME_CONFIG,
    typographyStyle: 'playful',
    mood: 'joyful'
  },
  experimental: {
    ...DEFAULT_THEME_CONFIG,
    surfaceStyle: 'soft',
    mood: 'atmospheric',
    accentIntensity: 'medium'
  }
};

export function validateThemeConfig(
  input: Partial<ThemeConfigV1> | null | undefined
): ThemeConfigV1 {
  if (!input || input.version !== THEME_CONFIG_VERSION) {
    const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
    if (showDevWarning) {
      console.warn('Invalid theme config. Falling back to DEFAULT_THEME_CONFIG.');
    }
    return DEFAULT_THEME_CONFIG;
  }

  const merged: ThemeConfigV1 = {
    ...DEFAULT_THEME_CONFIG,
    ...input
  };

  return merged;
}
