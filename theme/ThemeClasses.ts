import { ThemeConfigV1 } from './ThemeConfig';
import { resolveThemeExpression } from './ThemeExpression';

export type ThemeClasses = {
  page: string;
  surface: string;
  card: string;
  title: string;
  body: string;
  accent: string;
};

export const resolveThemeClasses = (theme: ThemeConfigV1): ThemeClasses => {
  const isDark = theme.palette === 'dark';

  // Resolve ALL expression layers
  const expr = resolveThemeExpression(theme, isDark);

  // --- PAGE ---
  const textBase = isDark ? 'text-zinc-100' : 'text-slate-900';
  const page = `min-h-screen transition-colors duration-500 ease-out ${textBase} ${expr.backgroundClass} ${expr.selectionClass} ${expr.smoothingClass}`;

  // --- SURFACE ---
  const surface = `${expr.surfaceClass} transition-all duration-500`;

  // --- CARD ---
  const card = `${expr.cardClass} transition-all duration-500`;

  // --- TYPOGRAPHY ---
  const title = `${expr.titleClass} transition-colors duration-500`;
  const body = `${expr.bodyClass} transition-colors duration-500`;

  // --- ACCENT ---
  const accent = `inline-flex items-center justify-center ${expr.accentClass}`;

  return { page, surface, card, title, body, accent };
};
