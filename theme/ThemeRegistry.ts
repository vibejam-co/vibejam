import { ThemeConfigV1, DEFAULT_THEME_CONFIG, validateThemeConfig } from './ThemeConfig';

export const THEME_REGISTRY: Readonly<Record<string, ThemeConfigV1>> = {
  default: DEFAULT_THEME_CONFIG,
  frosted: validateThemeConfig({
    version: 1,
    palette: 'light',
    surfaceStyle: 'glass',
    typographyStyle: 'system',
    mood: 'atmospheric',
    accentIntensity: 'low',
    backgroundTreatment: 'plain'
  }),
  midnight: validateThemeConfig({
    version: 1,
    palette: 'dark',
    surfaceStyle: 'raw',
    typographyStyle: 'system',
    mood: 'serious',
    accentIntensity: 'low',
    backgroundTreatment: 'plain'
  }),
  playful: validateThemeConfig({
    version: 1,
    palette: 'light',
    surfaceStyle: 'soft',
    typographyStyle: 'playful',
    mood: 'joyful',
    accentIntensity: 'medium',
    backgroundTreatment: 'plain'
  }),
  brutalist: validateThemeConfig({
    version: 1,
    palette: 'light',
    surfaceStyle: 'raw',
    typographyStyle: 'editorial',
    mood: 'brutal',
    accentIntensity: 'medium',
    backgroundTreatment: 'plain'
  }),
  experimental: validateThemeConfig({
    version: 1,
    palette: 'light',
    surfaceStyle: 'soft',
    typographyStyle: 'system',
    mood: 'atmospheric',
    accentIntensity: 'medium',
    backgroundTreatment: 'plain'
  })
};

export const getThemeById = (id?: string | null): ThemeConfigV1 | null => {
  if (!id) return null;
  return THEME_REGISTRY[id] || null;
};
