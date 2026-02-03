import { ThemeConfigV1, DEFAULT_THEME_CONFIG, validateThemeConfig } from './ThemeConfig';
import { getThemeById } from './ThemeRegistry';

export type ThemeResolutionInput = {
  urlTheme?: string | null;
  jamTheme?: string | null;
  jamThemeConfig?: Partial<ThemeConfigV1> | null;
  userTheme?: string | null;
  userThemeConfig?: Partial<ThemeConfigV1> | null;
};

const resolveById = (id?: string | null): ThemeConfigV1 | null => {
  const theme = getThemeById(id);
  return theme ? validateThemeConfig(theme) : null;
};

const resolveByConfig = (config?: Partial<ThemeConfigV1> | null): ThemeConfigV1 | null => {
  if (!config || config.version !== DEFAULT_THEME_CONFIG.version) return null;
  return validateThemeConfig(config as ThemeConfigV1);
};

export const resolveTheme = (input: ThemeResolutionInput): ThemeConfigV1 => {
  const urlTheme = resolveById(input.urlTheme);
  if (urlTheme) return urlTheme;

  const jamTheme = resolveById(input.jamTheme) || resolveByConfig(input.jamThemeConfig);
  if (jamTheme) return jamTheme;

  const userTheme = resolveById(input.userTheme) || resolveByConfig(input.userThemeConfig);
  if (userTheme) return userTheme;

  return DEFAULT_THEME_CONFIG;
};
