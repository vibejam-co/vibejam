import { ThemeConfigV1 } from './ThemeConfig';

export type ThemeClasses = {
  page: string;
  surface: string;
  card: string;
  title: string;
  body: string;
  accent: string;
};

export const resolveThemeClasses = (theme: ThemeConfigV1): ThemeClasses => {
  const page = theme.palette === 'dark'
    ? 'min-h-screen bg-gray-950 text-white'
    : 'min-h-screen bg-white text-gray-900';

  const surface = theme.surfaceStyle === 'glass'
    ? 'bg-white/60 backdrop-blur-xl'
    : theme.surfaceStyle === 'soft'
      ? 'bg-white/95'
      : theme.surfaceStyle === 'raw'
        ? 'bg-transparent border border-gray-200'
        : 'bg-white';

  const card = theme.surfaceStyle === 'raw'
    ? 'border border-gray-200 rounded-none'
    : theme.surfaceStyle === 'glass'
      ? 'rounded-2xl border border-white/60'
      : theme.surfaceStyle === 'soft'
        ? 'rounded-2xl border border-gray-100'
        : 'rounded-2xl border border-gray-100';

  const title = theme.typographyStyle === 'editorial'
    ? 'font-serif tracking-tight'
    : theme.typographyStyle === 'playful'
      ? 'font-sans tracking-wide'
      : 'font-sans';

  const body = theme.typographyStyle === 'editorial'
    ? 'font-serif'
    : theme.typographyStyle === 'playful'
      ? 'font-sans'
      : 'font-sans';

  const accent = theme.accentIntensity === 'high'
    ? 'text-emerald-600'
    : theme.accentIntensity === 'medium'
      ? 'text-emerald-500'
      : 'text-emerald-400';

  return { page, surface, card, title, body, accent };
};
