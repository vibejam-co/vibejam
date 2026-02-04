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

  // 1. RESOLVE EXPRESSION LAYERS (Background, Surface, Physics)
  const expression = resolveThemeExpression(theme, isDark);

  // --- 1. PAGE & LAYOUT ATMOSPHERE ---
  const textBase = isDark ? 'text-zinc-100' : 'text-slate-900';
  const selectionStyle = theme.mood === 'joyful'
    ? 'selection:bg-fuchsia-300 selection:text-fuchsia-950'
    : theme.mood === 'brutal'
      ? 'selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black'
      : 'selection:bg-indigo-500/20';

  const page = `min-h-screen transition-colors duration-700 ease-in-out ${textBase} ${expression.backgroundClass} ${selectionStyle} ${expression.smoothingClass}`;

  // --- 2. TYPOGRAPHY VOICE ---
  let title = '';
  let body = '';

  // EDITORIAL (Midnight)
  if (theme.typographyStyle === 'editorial') {
    title = isDark
      ? 'font-serif text-zinc-100 tracking-tight font-light italic'
      : 'font-serif text-slate-900 tracking-tight font-light italic';

    body = isDark
      ? 'font-serif text-zinc-400 leading-loose text-lg'
      : 'font-serif text-stone-600 leading-loose text-lg';
  }

  // PLAYFUL (Studio)
  else if (theme.typographyStyle === 'playful') {
    title = isDark
      ? 'font-sans font-black text-white tracking-tighter uppercase drop-shadow-sm'
      : 'font-sans font-black text-slate-900 tracking-tighter uppercase';

    body = 'font-sans font-medium leading-relaxed tracking-wide';
  }

  // SYSTEM (Clean / Brutal)
  else {
    if (theme.mood === 'brutal') {
      title = 'font-mono font-bold tracking-tight uppercase';
      body = 'font-mono text-sm leading-relaxed';
    } else {
      // Normal / Calm
      title = 'font-sans font-semibold tracking-tight text-slate-900 dark:text-white';
      body = 'font-sans text-slate-600 dark:text-zinc-400 leading-relaxed';
    }
  }

  // --- 3. ACCENT & INTERACTION ---
  const accentBase = 'transition-all duration-300 inline-flex items-center justify-center';
  let accent = '';

  // INTENSITY: HIGH (Brutal / Joyful)
  if (theme.accentIntensity === 'high') {
    if (theme.mood === 'brutal') {
      accent = isDark
        ? 'bg-white text-black border-2 border-white px-6 py-2 font-bold uppercase hover:bg-black hover:text-white hover:border-white rounded-none'
        : 'bg-black text-white border-2 border-black px-6 py-2 font-bold uppercase hover:bg-white hover:text-black hover:shadow-[4px_4px_0_0_#000] rounded-none';
    } else {
      // Joyful / Pop
      accent = isDark
        ? 'bg-fuchsia-600 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-fuchsia-900/40 hover:scale-105 hover:bg-fuchsia-500'
        : 'bg-black text-white px-6 py-2 rounded-full font-bold shadow-xl shadow-slate-900/20 hover:scale-105 hover:bg-slate-800';
    }
  }

  // INTENSITY: MEDIUM (Editorial / Experimental)
  else if (theme.accentIntensity === 'medium') {
    // Sophisticated, muted
    accent = isDark
      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-4 py-1.5 rounded-md font-medium text-sm'
      : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 px-4 py-1.5 rounded-md font-medium text-sm';
  }

  // INTENSITY: LOW (Calm)
  else {
    // Ghost / Minimal
    accent = isDark
      ? 'text-zinc-400 hover:text-white px-3 py-1 rounded hover:bg-white/5 font-medium'
      : 'text-slate-500 hover:text-slate-900 px-3 py-1 rounded hover:bg-slate-100 font-medium';
  }

  // Combine
  return {
    page,
    surface: `${expression.surfaceClass} transition-all duration-500`,
    card: `${expression.cardClass} transition-all duration-500`,
    title: `${title} transition-colors duration-500`,
    body: `${body} transition-colors duration-500`,
    accent: `${accentBase} ${accent}`
  };
};
