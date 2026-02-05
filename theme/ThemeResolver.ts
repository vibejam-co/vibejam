import { ThemeConfigV1, DEFAULT_THEME_CONFIG, validateThemeConfig } from './ThemeConfig';
import { getThemeById, getThemeBehaviorById } from './ThemeRegistry';
import { ThemeBehaviorProfile } from './ThemeBehavior';

export type ThemeResolutionInput = {
  urlTheme?: string | null;
  jamTheme?: string | null;
  jamThemeConfig?: Partial<ThemeConfigV1> | null;
  userTheme?: string | null;
  userThemeConfig?: Partial<ThemeConfigV1> | null;
};

export interface ResolvedTheme {
  config: ThemeConfigV1;
  behavior: ThemeBehaviorProfile;
  source: 'url' | 'jam' | 'user' | 'default' | 'remix';
}

const resolveById = (id?: string | null): ThemeConfigV1 | null => {
  const theme = getThemeById(id);
  return theme ? validateThemeConfig(theme) : null;
};

const resolveByConfig = (config?: Partial<ThemeConfigV1> | null): ThemeConfigV1 | null => {
  if (!config || config.version !== DEFAULT_THEME_CONFIG.version) return null;
  return validateThemeConfig(config as ThemeConfigV1);
};

// Resolve both config AND behavior
export const resolveTheme = (input: ThemeResolutionInput): ResolvedTheme => {
  // URL theme takes highest priority
  const urlTheme = resolveById(input.urlTheme);
  if (urlTheme) {
    return {
      config: urlTheme,
      behavior: getThemeBehaviorById(input.urlTheme!),
      source: 'url'
    };
  }

  // Jam theme
  const jamTheme = resolveById(input.jamTheme) || resolveByConfig(input.jamThemeConfig);
  if (jamTheme) {
    return {
      config: jamTheme,
      behavior: getThemeBehaviorById(input.jamTheme || 'default'),
      source: 'jam'
    };
  }

  // User theme
  const userTheme = resolveById(input.userTheme) || resolveByConfig(input.userThemeConfig);
  if (userTheme) {
    return {
      config: userTheme,
      behavior: getThemeBehaviorById(input.userTheme || 'default'),
      source: 'user'
    };
  }

  // Default
  return {
    config: DEFAULT_THEME_CONFIG,
    behavior: getThemeBehaviorById('default'),
    source: 'default'
  };
};

// ============================================================================
// LEGACY: For backwards compatibility, keep the old function signature
// ============================================================================
export const resolveThemeConfig = (input: ThemeResolutionInput): ThemeConfigV1 => {
  return resolveTheme(input).config;
};
