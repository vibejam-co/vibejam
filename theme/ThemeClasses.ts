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

// HELPER: Generates high-impact background classes based on calculated axes
const getBackgroundClass = (theme: ThemeConfigV1, isDark: boolean): string => {
  // 1. JOYFUL / PLAYFUL STUDIO -> "Living Gradient"
  if (theme.mood === 'joyful') {
    return isDark
      ? 'bg-slate-950 bg-[radial-gradient(at_top_right,_var(--tw-gradient-stops))] from-fuchsia-900/40 via-slate-950 to-slate-950'
      : 'bg-indigo-50/50 bg-[radial-gradient(at_80%_0%,_var(--tw-gradient-stops))] from-amber-200/20 via-rose-100/20 to-indigo-50/0';
  }

  // 2. BRUTAL / SIGNAL -> "Construction Zone"
  if (theme.mood === 'brutal') {
    // High contrast diagonal stripes or solid blasts
    return isDark
      ? 'bg-zinc-950 bg-[linear-gradient(135deg,#18181b_25%,#000000_25%,#000000_50%,#18181b_50%,#18181b_75%,#000000_75%,#000000_100%)] [background-size:20px_20px]'
      : 'bg-[#f0f0f0] bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:20px_20px]';
  }

  // 3. ATMOSPHERIC / EXPERIMENTAL -> "The Void / Gallery"
  if (theme.mood === 'atmospheric') {
    // Conic or deep spotlights
    return isDark
      ? 'bg-black bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-zinc-800/50 via-black to-black'
      : 'bg-zinc-100 bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-stone-200 via-white to-stone-50';
  }

  // 4. SERIOUS / EDITORIAL -> "Paper & Ink"
  if (theme.mood === 'serious') {
    // Subtle noise or grain
    return isDark
      ? 'bg-[#111111] bg-[url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")]'
      : 'bg-[#fbfbf9]'; // Warm paper
  }

  // 5. CALM / FROSTED -> "Air"
  // Clean, breathable, barely there
  return isDark
    ? 'bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/30 via-zinc-950 to-zinc-950'
    : 'bg-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50/40 via-white to-white';
};

export const resolveThemeClasses = (theme: ThemeConfigV1): ThemeClasses => {
  const isDark = theme.palette === 'dark';

  // --- 1. PAGE & LAYOUT ATMOSPHERE ---
  // Base text colors and layout resets
  const textBase = isDark ? 'text-zinc-100' : 'text-slate-900';
  const selectionStyle = theme.mood === 'joyful'
    ? 'selection:bg-fuchsia-300 selection:text-fuchsia-950'
    : theme.mood === 'brutal'
      ? 'selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black'
      : 'selection:bg-indigo-500/20';

  const backgroundField = getBackgroundClass(theme, isDark);

  // Font smoothing: Brutalist prefers crisp pixels, others smooth
  const smoothing = theme.mood === 'brutal' ? 'antialiased' : 'antialiased subpixel-antialiased';

  const page = `min-h-screen transition-colors duration-700 ease-in-out ${textBase} ${backgroundField} ${selectionStyle} ${smoothing}`;


  // --- 2. SURFACE & CARD PHYSICS ---
  let surface = '';
  let card = '';

  // STRATEGY: GLASS (Frosted Calm)
  if (theme.surfaceStyle === 'glass') {
    surface = isDark
      ? 'bg-zinc-900/70 backdrop-blur-2xl border-b border-white/5 shadow-2xl shadow-black/20'
      : 'bg-white/70 backdrop-blur-2xl border-b border-white/60 shadow-sm supports-[backdrop-filter]:bg-white/50';

    card = isDark
      ? 'bg-zinc-800/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl inset-ring inset-ring-white/5'
      : 'bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl shadow-xl shadow-slate-200/40';
  }

  // STRATEGY: SOFT (Playful Studio)
  else if (theme.surfaceStyle === 'soft') {
    // Pillowy, tactile, high radius
    surface = isDark
      ? 'bg-zinc-900/95 border-b border-zinc-800/50'
      : 'bg-white/95 border-b border-slate-100 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.05)]';

    card = isDark
      ? 'bg-zinc-800 rounded-[2rem] border border-white/5 shadow-lg shadow-zinc-950/20 hover:scale-[1.01] transition-transform duration-300'
      : 'bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300';
  }

  // STRATEGY: RAW (Brutalist / Experimental)
  else if (theme.surfaceStyle === 'raw') {
    // No blur, hard lines, visible structure
    surface = isDark
      ? 'bg-black border-b border-zinc-700'
      : 'bg-white border-b-2 border-black';

    card = theme.mood === 'brutal'
      // Brutalist Hard Shadow
      ? (isDark
        ? 'bg-zinc-900 border-2 border-zinc-200 rounded-none shadow-[6px_6px_0_0_#e4e4e7]'
        : 'bg-white border-2 border-black rounded-none shadow-[6px_6px_0_0_#000]')
      // Experimental Minimal
      : (isDark
        ? 'bg-black border border-zinc-800 rounded-sm'
        : 'bg-transparent border border-zinc-300 rounded-sm');
  }

  // STRATEGY: FLAT (Midnight Editorial)
  else {
    // Print-like, minimal decoration
    surface = isDark
      ? 'bg-[#111111] border-b border-white/10'
      : 'bg-[#fbfbf9] border-b border-black/5';

    card = isDark
      ? 'bg-zinc-900/30 border border-white/10 rounded-sm'
      : 'bg-white border border-stone-200 rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
  }


  // --- 3. TYPOGRAPHY VOICE ---
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

  // --- 4. ACCENT & INTERACTION ---
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
    surface: `${surface} transition-all duration-500`,
    card: `${card} transition-all duration-500`,
    title: `${title} transition-colors duration-500`,
    body: `${body} transition-colors duration-500`,
    accent: `${accentBase} ${accent}`
  };
};

// --- SIMILARITY WARNING SYSTEM ---
const classifyAxes = (theme: ThemeConfigV1) => {
  const backgroundMode = `${theme.palette}-${theme.backgroundTreatment}`;
  const surfaceMaterial = theme.surfaceStyle;
  const typographyContrast = theme.typographyStyle;
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
      // We only care if they are visually indistinguishable
      const axisDiffs = [
        axesA.backgroundMode !== axesB.backgroundMode,
        axesA.surfaceMaterial !== axesB.surfaceMaterial,
        axesA.typographyContrast !== axesB.typographyContrast,
        axesA.accentSaturation !== axesB.accentSaturation
      ].filter(Boolean).length;


      if (axisDiffs < 2) {
        // Strict check: if axes are too similar, potential conflict
        console.warn(`[ThemeClasses] Themes "${nameA}" and "${nameB}" may be too similar.`);
      }
    }
  }
};

warnThemeSimilarity();
