export type ThemeConfigV1 = {
  version: 1;
  palette: 'light' | 'dark' | 'auto';
  surfaceStyle: 'flat' | 'soft' | 'glass' | 'ink';
  typographyStyle: 'neutral' | 'editorial' | 'brutal' | 'playful';
  mood: 'calm' | 'bold' | 'experimental';
  accentIntensity: 'low' | 'medium' | 'high';
  backgroundTreatment: 'none' | 'gradient' | 'texture';
};

export const DEFAULT_THEME_CONFIG: ThemeConfigV1 = {
  version: 1,
  palette: 'light',
  surfaceStyle: 'flat',
  typographyStyle: 'neutral',
  mood: 'calm',
  accentIntensity: 'low',
  backgroundTreatment: 'none'
};

export const THEME_PRESETS: Record<string, ThemeConfigV1> = {
  experimental: {
    ...DEFAULT_THEME_CONFIG,
    mood: 'experimental',
    surfaceStyle: 'soft',
    accentIntensity: 'medium'
  }
};

export function validateThemeConfig(
  input: Partial<ThemeConfigV1> | null | undefined
): ThemeConfigV1 {
  if (!input || input.version !== 1) return DEFAULT_THEME_CONFIG;
  return {
    ...DEFAULT_THEME_CONFIG,
    ...input
  };
}
