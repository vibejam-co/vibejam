import { ThemeConfigV1, DEFAULT_THEME_CONFIG, validateThemeConfig } from './ThemeConfig';

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
    typographyStyle: 'system',
    mood: 'serious',
    accentIntensity: 'high',
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
    accentIntensity: 'low',
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

export const getThemeById = (id?: string | null): ThemeConfigV1 | null => {
  if (!id) return null;
  return THEME_REGISTRY[id] || null;
};
