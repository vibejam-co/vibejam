import { ThemeConfigV1, DEFAULT_THEME_CONFIG, validateThemeConfig } from './ThemeConfig';

export const THEME_REGISTRY: Readonly<Record<string, ThemeConfigV1>> = {
  default: DEFAULT_THEME_CONFIG,
  frosted: validateThemeConfig({
    version: 1,
    palette: 'light',
    surfaceStyle: 'glass',
    typographyStyle: 'system',
    mood: 'calm',
    accentIntensity: 'medium', // Bumped for better usability
    backgroundTreatment: 'gradient'
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
    surfaceStyle: 'soft',
    typographyStyle: 'playful',
    mood: 'joyful',
    accentIntensity: 'high',
    backgroundTreatment: 'gradient'
  }),
  brutalist: validateThemeConfig({
    version: 1,
    palette: 'light',
    surfaceStyle: 'raw',
    typographyStyle: 'system',
    mood: 'brutal',
    accentIntensity: 'high',
    backgroundTreatment: 'plain'
  }),
  experimental: validateThemeConfig({
    version: 1,
    palette: 'dark',
    surfaceStyle: 'glass',
    typographyStyle: 'editorial',
    mood: 'atmospheric',
    accentIntensity: 'high', // High intensity specifically for experimental
    backgroundTreatment: 'texture'
  })
};

export const getThemeById = (id?: string | null): ThemeConfigV1 | null => {
  if (!id) return null;
  return THEME_REGISTRY[id] || null;
};
