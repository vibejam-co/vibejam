import { ThemeConfigV1 } from './ThemeConfig';

// 1. EXPRESSION MAPS
// Maps abstract intents (mood/surface) to concrete tailwind implementations

// --- BACKGROUNDS ---
const BACKGROUND_EXPRESSIONS: Record<string, { light: string; dark: string }> = {
  // JOYFUL: Living, breathing gradients
  joyful_gradient: {
    light: 'bg-indigo-50/50 bg-[radial-gradient(at_80%_0%,_var(--tw-gradient-stops))] from-amber-200/20 via-rose-100/20 to-indigo-50/0',
    dark: 'bg-slate-950 bg-[radial-gradient(at_top_right,_var(--tw-gradient-stops))] from-fuchsia-900/40 via-slate-950 to-slate-950'
  },
  // BRUTAL: Construction zones, stripes, raw noise
  brutal_plain: {
    light: 'bg-[#f0f0f0] bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:20px_20px]',
    dark: 'bg-zinc-950 bg-[linear-gradient(135deg,#18181b_25%,#000000_25%,#000000_50%,#18181b_50%,#18181b_75%,#000000_75%,#000000_100%)] [background-size:20px_20px]'
  },
  brutal_texture: {
    light: 'bg-[#f0f0f0] bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:20px_20px]',
    dark: 'bg-zinc-950 bg-[linear-gradient(135deg,#18181b_25%,#000000_25%,#000000_50%,#18181b_50%,#18181b_75%,#000000_75%,#000000_100%)] [background-size:20px_20px]'
  },
  // ATMOSPHERIC: The Void, Conic gradients, Deep space
  atmospheric_gradient: {
    light: 'bg-zinc-100 bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-stone-200 via-white to-stone-50',
    dark: 'bg-black bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-zinc-800/50 via-black to-black'
  },
  atmospheric_texture: {
    light: 'bg-slate-100 bg-[radial-gradient(#94a3b8,transparent_2px)] [background-size:24px_24px]',
    dark: 'bg-black bg-[radial-gradient(white,transparent_2px)] [background-size:30px_30px]'
  },
  // SERIOUS: Editorial paper, slight grain
  serious_texture: {
    light: 'bg-[#fbfbf9]',
    dark: 'bg-[#111111] bg-[url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")]'
  },
  // CALM: Default airs
  calm_gradient: {
    light: 'bg-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50/40 via-white to-white',
    dark: 'bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/30 via-zinc-950 to-zinc-950'
  }
};

// --- SURFACE PHYSICS ---
const SURFACE_EXPRESSIONS: Record<string, { light: string; dark: string }> = {
  glass: {
    light: 'bg-white/70 backdrop-blur-2xl border-b border-white/60 shadow-sm supports-[backdrop-filter]:bg-white/50',
    dark: 'bg-zinc-900/70 backdrop-blur-2xl border-b border-white/5 shadow-2xl shadow-black/20'
  },
  soft: {
    light: 'bg-white/95 border-b border-slate-100 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.05)]',
    dark: 'bg-zinc-900/95 border-b border-zinc-800/50'
  },
  raw: {
    light: 'bg-white border-b-2 border-black',
    dark: 'bg-black border-b border-zinc-700'
  },
  flat: {
    light: 'bg-[#fbfbf9] border-b border-black/5',
    dark: 'bg-[#111111] border-b border-white/10'
  }
};

const CARD_EXPRESSIONS: Record<string, { light: string; dark: string }> = {
  glass: {
    light: 'bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl shadow-xl shadow-slate-200/40',
    dark: 'bg-zinc-800/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl inset-ring inset-ring-white/5'
  },
  soft: {
    light: 'bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300',
    dark: 'bg-zinc-800 rounded-[2rem] border border-white/5 shadow-lg shadow-zinc-950/20 hover:scale-[1.01] transition-transform duration-300'
  },
  raw: {
    // Brutalist hard shadow vs Experimental minimal
    light: 'bg-white border-2 border-black rounded-none shadow-[6px_6px_0_0_#000]',
    dark: 'bg-zinc-900 border-2 border-zinc-200 rounded-none shadow-[6px_6px_0_0_#e4e4e7]'
  },
  raw_minimal: {
    light: 'bg-transparent border border-zinc-300 rounded-sm',
    dark: 'bg-black border border-zinc-800 rounded-sm'
  },
  flat: {
    light: 'bg-white border border-stone-200 rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
    dark: 'bg-zinc-900/30 border border-white/10 rounded-sm'
  }
};

// 2. RESOLVER LOGIC
export const resolveThemeExpression = (theme: ThemeConfigV1, isDark: boolean) => {
  // BACKGROUND
  // Try precise match (mood_treatment) -> fallback to mood -> fallback to calm
  const bgKey = `${theme.mood}_${theme.backgroundTreatment}`;
  const bg = BACKGROUND_EXPRESSIONS[bgKey] || BACKGROUND_EXPRESSIONS[`${theme.mood}_plain`] || BACKGROUND_EXPRESSIONS.calm_gradient;
  
  // SURFACE
  const surface = SURFACE_EXPRESSIONS[theme.surfaceStyle] || SURFACE_EXPRESSIONS.soft;
  
  // CARD
  // Special case: Raw + Brutal = Hard Shadow. Raw + Atmosphere = Minimal.
  let cardKey = theme.surfaceStyle;
  if (theme.surfaceStyle === 'raw') {
    cardKey = theme.mood === 'brutal' ? 'raw' : 'raw_minimal';
  }
  const card = CARD_EXPRESSIONS[cardKey] || CARD_EXPRESSIONS.soft;

  // TYPOGRAPHY TEXTURE (Smoothing)
  const smoothing = theme.mood === 'brutal' ? 'antialiased' : 'antialiased subpixel-antialiased';

  return {
    backgroundClass: isDark ? bg.dark : bg.light,
    surfaceClass: isDark ? surface.dark : surface.light,
    cardClass: isDark ? card.dark : card.light,
    smoothingClass: smoothing
  };
};
