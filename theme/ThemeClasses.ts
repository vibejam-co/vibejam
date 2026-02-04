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

// ============================================================================
// DOPAMINE PASS: Theme switches must produce INSTANT perceptual change
// User must FEEL the switch before reading anything
// ============================================================================

export const resolveThemeClasses = (theme: ThemeConfigV1): ThemeClasses => {
  const isDark = theme.palette === 'dark';

  // Resolve ALL expression layers
  const expr = resolveThemeExpression(theme, isDark);

  // --- PAGE ---
  // DOPAMINE: Background, text, and filter transitions happen instantly
  // Using transition-all on backgrounds creates immediate visual impact
  const textBase = isDark ? 'text-zinc-100' : 'text-slate-900';
  const page = [
    'min-h-screen',
    // INSTANT TRANSITIONS — CSS only, no JS
    'transition-[background-color,background-image,color,filter] duration-700 ease-out',
    // Slight filter shift on dark themes for depth perception
    isDark ? 'brightness-100' : 'brightness-105 saturate-105',
    textBase,
    expr.backgroundClass,
    expr.selectionClass,
    expr.smoothingClass
  ].join(' ');

  // --- SURFACE ---
  // DOPAMINE: Surface blur/opacity shifts are highly perceptible
  const surface = [
    expr.surfaceClass,
    'transition-[background-color,backdrop-filter,border-color,box-shadow] duration-500 ease-out'
  ].join(' ');

  // --- CARD ---
  // DOPAMINE: Card transforms (radius, shadow, border) create "wow" moments
  const card = [
    expr.cardClass,
    'transition-[background-color,border-radius,border-color,box-shadow,transform] duration-500 ease-out'
  ].join(' ');

  // --- TYPOGRAPHY ---
  // DOPAMINE: Font weight and color shifts are immediately noticeable
  const title = [
    expr.titleClass,
    'transition-[color,font-weight,letter-spacing] duration-500 ease-out'
  ].join(' ');

  const body = [
    expr.bodyClass,
    'transition-[color,opacity] duration-500 ease-out'
  ].join(' ');

  // --- ACCENT ---
  // DOPAMINE: Button style flips (gradient vs solid, round vs sharp) are dramatic
  const accent = [
    'inline-flex items-center justify-center',
    expr.accentClass,
    'transition-[background,border-radius,box-shadow,transform,color] duration-300 ease-out'
  ].join(' ');

  return { page, surface, card, title, body, accent };
};
