import { ThemeConfigV1 } from './ThemeConfig';
import { THEME_REGISTRY } from './ThemeRegistry';

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

  // 1. Page & Background Treatment (Aggressive differentiation)
  const pageBase = isDark
    ? 'min-h-screen bg-black text-zinc-100'
    : 'min-h-screen bg-white text-slate-950';

  const moodBg = (() => {
    if (theme.backgroundTreatment === 'gradient') {
      if (theme.mood === 'joyful') {
        return isDark
          ? 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-fuchsia-950 via-gray-950 to-black'
          : 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-50 via-rose-50 to-white';
      }
      if (theme.mood === 'brutal') {
        // Brutalist gradient is stark, almost error-like or industrial
        return isDark
          ? 'bg-[linear-gradient(45deg,transparent,transparent)] bg-zinc-950'
          : 'bg-slate-50';
      }
      if (theme.mood === 'atmospheric') {
        return isDark
          ? 'bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-black'
          : 'bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-white to-blue-50';
      }
      // Calm/Frosted Default
      return isDark
        ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black'
        : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50 via-white to-slate-50';
    }

    if (theme.backgroundTreatment === 'texture') {
      if (theme.mood === 'atmospheric') {
        // Starfield / Noise
        return isDark
          ? 'bg-black bg-[radial-gradient(white,transparent_2px)] [background-size:30px_30px] opacity-100'
          : 'bg-slate-100 bg-[radial-gradient(#e2e8f0,transparent_2px)] [background-size:24px_24px]';
      }
      if (theme.mood === 'serious') {
        // Editorial Grid
        return isDark
          ? 'bg-zinc-950 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] [background-size:40px_40px]'
          : 'bg-stone-50 bg-[linear-gradient(to_right,#e7e5e4_1px,transparent_1px),linear-gradient(to_bottom,#e7e5e4_1px,transparent_1px)] [background-size:40px_40px]';
      }
      // Subtle dot matrix
      return isDark
        ? 'bg-zinc-950 bg-[radial-gradient(zinc-800_1px,transparent_1px)] [background-size:16px_16px]'
        : 'bg-white bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]';
    }

    // fallback plain
    return '';
  })();

  const typoSmoothing = theme.mood === 'brutal' ? 'antialiased' : 'antialiased subpixel-antialiased';
  const selectionStyle = theme.mood === 'joyful'
    ? (isDark ? 'selection:bg-fuchsia-900 selection:text-fuchsia-100' : 'selection:bg-yellow-200 selection:text-yellow-900')
    : isDark ? 'selection:bg-zinc-700' : 'selection:bg-blue-100';

  const page = `${pageBase} ${moodBg} ${typoSmoothing} ${selectionStyle}`;

  // 2. Surface & Card Strategy (Materiality)
  let surface = '';
  let card = '';

  if (theme.surfaceStyle === 'glass') {
    // Apple-grade frosted glass
    surface = isDark
      ? 'bg-zinc-900/60 backdrop-blur-2xl border-b border-white/10'
      : 'bg-white/80 backdrop-blur-2xl border-b border-white/60';
    card = isDark
      ? 'bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl'
      : 'bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.06)]';
  } else if (theme.surfaceStyle === 'soft') {
    // Pillowy, friendly
    surface = isDark
      ? 'bg-zinc-900 border-b border-zinc-800'
      : 'bg-white/90 backdrop-blur-sm border-b border-slate-100';
    card = isDark
      ? 'bg-zinc-800 rounded-[2.5rem] border border-white/5 shadow-xl'
      : 'bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] transition-shadow';
  } else if (theme.surfaceStyle === 'raw') {
    // Brutalist / Industrial
    surface = 'bg-transparent border-b-4 border-current';
    card = theme.mood === 'brutal'
      ? 'bg-white dark:bg-zinc-950 border-[3px] border-current rounded-none shadow-[8px_8px_0_0_currentColor]'
      : 'bg-transparent border-2 border-current rounded-sm';
  } else {
    // Flat / Editorial
    surface = isDark ? 'bg-black border-b border-zinc-800' : 'bg-white border-b border-stone-200';
    card = isDark
      ? 'bg-zinc-900 rounded-none border border-zinc-800'
      : 'bg-white rounded-none border border-stone-200 shadow-sm';
  }

  // 3. Typography Strategy (Voice)
  const titleFont = theme.typographyStyle === 'editorial'
    ? 'font-serif tracking-tight font-light italic'
    : theme.typographyStyle === 'playful'
      ? 'font-sans font-black tracking-[-0.02em]' // Tight and punchy
      : 'font-sans font-bold tracking-tight';

  const bodyFont = theme.typographyStyle === 'editorial'
    ? 'font-serif leading-loose'
    : theme.typographyStyle === 'playful'
      ? 'font-sans font-medium leading-relaxed'
      : 'font-sans leading-relaxed';

  const typographyContrast = theme.typographyStyle === 'editorial'
    ? 'high'
    : theme.typographyStyle === 'playful'
      ? 'inverted'
      : theme.backgroundTreatment === 'gradient'
        ? 'high'
        : 'muted';

  const titleColor = typographyContrast === 'high'
    ? (theme.mood === 'brutal' && !isDark ? 'text-black' : isDark ? 'text-white' : 'text-slate-950')
    : typographyContrast === 'inverted'
      ? (isDark ? 'text-rose-100' : 'text-indigo-950')
      : (isDark ? 'text-zinc-200' : 'text-slate-800');

  const bodyColor = typographyContrast === 'high'
    ? (isDark ? 'text-zinc-200' : 'text-slate-700')
    : typographyContrast === 'inverted'
      ? (isDark ? 'text-rose-200' : 'text-slate-700')
      : (isDark ? 'text-zinc-400' : 'text-slate-600');

  const bodyOpacity = theme.mood === 'brutal' ? 'opacity-100' : typographyContrast === 'muted' ? 'opacity-75' : 'opacity-90';

  const title = `${titleFont} ${titleColor} transition-colors duration-500`;
  const body = `${bodyFont} ${bodyColor} ${bodyOpacity}`;

  // 4. Accent Intensity (Action)
  const accentBase = 'transition-all duration-300';

  let accentStyle = '';

  if (theme.accentIntensity === 'high') {
    // Buttons/Badges
    if (theme.mood === 'brutal') {
      accentStyle = isDark
        ? 'bg-white text-black px-4 py-1.5 font-bold uppercase tracking-wider hover:bg-zinc-200'
        : 'bg-black text-white px-4 py-1.5 font-bold uppercase tracking-wider hover:bg-zinc-800 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]';
    } else if (theme.mood === 'joyful') {
      accentStyle = 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2 rounded-full font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105';
    } else {
      accentStyle = isDark
        ? 'bg-white text-black px-4 py-1 rounded-full font-medium'
        : 'bg-black text-white px-4 py-1 rounded-full font-medium';
    }
  } else if (theme.accentIntensity === 'medium') {
    // Underlines / text pops
    accentStyle = isDark
      ? 'text-indigo-300 border-b border-indigo-300/30 hover:border-indigo-300'
      : 'text-indigo-600 border-b border-indigo-600/20 hover:border-indigo-600';
  } else {
    // Low / Subtle
    accentStyle = isDark
      ? 'text-zinc-400 hover:text-white'
      : 'text-slate-400 hover:text-slate-900';
  }

  const accent = `${accentBase} ${accentStyle}`;

  return { page, surface, card, title, body, accent };
};

const classifyAxes = (theme: ThemeConfigV1) => {
  const backgroundMode = `${theme.palette}-${theme.backgroundTreatment}`;
  const surfaceMaterial = theme.surfaceStyle;
  const typographyContrast = theme.typographyStyle === 'editorial'
    ? 'high'
    : theme.typographyStyle === 'playful'
      ? 'inverted'
      : theme.backgroundTreatment === 'gradient'
        ? 'high'
        : 'muted';
  const accentSaturation = theme.accentIntensity;
  return { backgroundMode, surfaceMaterial, typographyContrast, accentSaturation };
};

const warnThemeSimilarity = () => {
  const isProd = typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD;
  if (isProd) return;
  const entries = Object.entries(THEME_REGISTRY);
  for (let i = 0; i < entries.length; i += 1) {
    const [nameA, themeA] = entries[i];
    const axesA = classifyAxes(themeA);
    const classesA = resolveThemeClasses(themeA);
    for (let j = i + 1; j < entries.length; j += 1) {
      const [nameB, themeB] = entries[j];
      const axesB = classifyAxes(themeB);
      const axisDiffs = [
        axesA.backgroundMode !== axesB.backgroundMode,
        axesA.surfaceMaterial !== axesB.surfaceMaterial,
        axesA.typographyContrast !== axesB.typographyContrast,
        axesA.accentSaturation !== axesB.accentSaturation
      ].filter(Boolean).length;

      const classesB = resolveThemeClasses(themeB);
      const classesEqual = classesA.page === classesB.page
        && classesA.surface === classesB.surface
        && classesA.card === classesB.card
        && classesA.title === classesB.title
        && classesA.body === classesB.body
        && classesA.accent === classesB.accent;

      if (axisDiffs < 3 || classesEqual) {
        console.warn(`[ThemeClasses] Themes may be visually equivalent: "${nameA}" vs "${nameB}".`);
      }
    }
  }
};

warnThemeSimilarity();
