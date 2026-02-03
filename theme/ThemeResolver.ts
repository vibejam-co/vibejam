import { ThemeConfigV1, DEFAULT_THEME_CONFIG, validateThemeConfig } from './ThemeConfig';
import { getThemeById } from './ThemeRegistry';

export type ThemeResolutionInput = {
  urlTheme?: string | null;
  jamTheme?: string | null;
  userTheme?: string | null;
};

const resolveById = (id?: string | null): ThemeConfigV1 | null => {
  const theme = getThemeById(id);
  return theme ? validateThemeConfig(theme) : null;
};

export const resolveTheme = (input: ThemeResolutionInput): ThemeConfigV1 => {
  const urlTheme = resolveById(input.urlTheme);
  if (urlTheme) return urlTheme;

  const jamTheme = resolveById(input.jamTheme);
  if (jamTheme) return jamTheme;

  const userTheme = resolveById(input.userTheme);
  if (userTheme) return userTheme;

  return DEFAULT_THEME_CONFIG;
};
