import { ThemeConfigV1 } from './ThemeConfig';

// ============================================================================
// THEME EXPRESSION CONTRACT
// ============================================================================
// This layer encodes EDITORIAL INTENT and VISUAL RISK per theme.
// Its sole purpose is to FORCE DIVERGENCE — not convenience.
// If removing theme names still leaves expressions distinguishable → SUCCESS
// ============================================================================

// --- EXPRESSION TYPES ---
export type SurfaceCharacter = 'glass' | 'matte' | 'raw' | 'glossy' | 'unstable';
export type EdgeLanguage = 'rounded' | 'sharp' | 'mixed';
export type ContrastProfile = 'low' | 'extreme' | 'electric';
export type TypographyMood = 'quiet' | 'editorial' | 'playful' | 'industrial' | 'experimental';
export type MaterialMetaphor = 'glass' | 'obsidian' | 'paper' | 'concrete' | 'glitch';

export interface ThemeExpressionProfile {
  surfaceCharacter: SurfaceCharacter;
  edgeLanguage: EdgeLanguage;
  contrastProfile: ContrastProfile;
  typographyMood: TypographyMood;
  materialMetaphor: MaterialMetaphor;
}

// --- PER-THEME EXPRESSION PROFILES ---
// Each theme MUST have clearly different values across at least 3 fields.
// Reusing the same profile across themes is FORBIDDEN.
// Neutral defaults are FORBIDDEN.

export const THEME_EXPRESSIONS: Record<string, ThemeExpressionProfile> = {
  // FROSTED: Minimalist design journal, vellum paper, quiet contemplation
  frosted: {
    surfaceCharacter: 'glass',
    edgeLanguage: 'rounded',
    contrastProfile: 'low',
    typographyMood: 'quiet',
    materialMetaphor: 'glass'
  },
  
  // MIDNIGHT: High-fashion avant-garde, matte black stock, spot varnish
  midnight: {
    surfaceCharacter: 'matte',
    edgeLanguage: 'sharp',
    contrastProfile: 'extreme',
    typographyMood: 'editorial',
    materialMetaphor: 'obsidian'
  },
  
  // PLAYFUL: Indie arts zine, glossy cutouts, stickers, transparencies
  playful: {
    surfaceCharacter: 'glossy',
    edgeLanguage: 'rounded',
    contrastProfile: 'electric',
    typographyMood: 'playful',
    materialMetaphor: 'glass' // gummy candy glass
  },
  
  // BRUTALIST: Underground architectural journal, raw newsprint, confrontational
  brutalist: {
    surfaceCharacter: 'raw',
    edgeLanguage: 'sharp',
    contrastProfile: 'extreme',
    typographyMood: 'industrial',
    materialMetaphor: 'concrete'
  },
  
  // EXPERIMENTAL: Speculative digital art, glitch aesthetics, beautiful errors
  experimental: {
    surfaceCharacter: 'unstable',
    edgeLanguage: 'mixed',
    contrastProfile: 'electric',
    typographyMood: 'experimental',
    materialMetaphor: 'glitch'
  },
  
  // DEFAULT: Falls back to frosted-like calm
  default: {
    surfaceCharacter: 'glass',
    edgeLanguage: 'rounded',
    contrastProfile: 'low',
    typographyMood: 'quiet',
    materialMetaphor: 'paper'
  }
};

// --- EXPRESSION RESOLVER ---
export const getThemeExpression = (themeId: string): ThemeExpressionProfile => {
  return THEME_EXPRESSIONS[themeId] || THEME_EXPRESSIONS.default;
};

// --- TAILWIND CLASS MAPPINGS ---
// Maps expression values to concrete Tailwind implementations

// BACKGROUND CLASSES (by mood + treatment)
const BACKGROUND_EXPRESSIONS: Record<string, { light: string; dark: string }> = {
  // FROSTED / CALM: Breathable, ethereal
  calm_gradient: {
    light: 'bg-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50/40 via-white to-white',
    dark: 'bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/30 via-zinc-950 to-zinc-950'
  },
  calm_texture: {
    light: 'bg-slate-50/80 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]',
    dark: 'bg-zinc-950 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px]'
  },
  
  // JOYFUL / PLAYFUL: Vibrant, living
  joyful_gradient: {
    light: 'bg-gradient-to-br from-amber-50 via-rose-50 to-violet-100',
    dark: 'bg-slate-950 bg-[radial-gradient(at_top_right,_var(--tw-gradient-stops))] from-fuchsia-900/40 via-slate-950 to-slate-950'
  },
  
  // SERIOUS / MIDNIGHT: Editorial, print-like
  serious_texture: {
    light: 'bg-[#faf9f7]',
    dark: 'bg-[#0a0a0a]'
  },
  serious_plain: {
    light: 'bg-stone-50',
    dark: 'bg-black'
  },
  
  // BRUTAL: Construction zone, utilitarian
  brutal_plain: {
    light: 'bg-[#f5f5f4] bg-[linear-gradient(to_right,#e7e5e4_1px,transparent_1px),linear-gradient(to_bottom,#e7e5e4_1px,transparent_1px)] [background-size:32px_32px]',
    dark: 'bg-zinc-950 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] [background-size:32px_32px]'
  },
  brutal_texture: {
    light: 'bg-[#f0f0f0] bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:16px_16px]',
    dark: 'bg-zinc-950 bg-[linear-gradient(135deg,#18181b_25%,#000000_25%,#000000_50%,#18181b_50%,#18181b_75%,#000000_75%,#000000_100%)] [background-size:20px_20px]'
  },
  
  // ATMOSPHERIC / EXPERIMENTAL: The void, glitch space
  atmospheric_gradient: {
    light: 'bg-zinc-100 bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-stone-200 via-white to-stone-50',
    dark: 'bg-black bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-violet-950/30 via-black to-black'
  },
  atmospheric_texture: {
    light: 'bg-slate-100 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:30px_30px]',
    dark: 'bg-black bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:40px_40px] opacity-90'
  }
};

// SURFACE PHYSICS (by surfaceStyle)
const SURFACE_EXPRESSIONS: Record<string, { light: string; dark: string }> = {
  glass: {
    light: 'bg-white/60 backdrop-blur-2xl border-b border-white/80 shadow-sm',
    dark: 'bg-zinc-900/60 backdrop-blur-2xl border-b border-white/5 shadow-2xl'
  },
  soft: {
    light: 'bg-white/95 border-b border-slate-100 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.05)]',
    dark: 'bg-zinc-900/95 border-b border-zinc-800/50'
  },
  raw: {
    light: 'bg-white border-b-2 border-black',
    dark: 'bg-black border-b-2 border-white'
  },
  flat: {
    light: 'bg-[#faf9f7] border-b border-stone-200',
    dark: 'bg-[#0a0a0a] border-b border-zinc-800'
  }
};

// CARD PHYSICS (by expression profile)
// AGGRESSIVE DIVERGENCE: Each must feel like a DIFFERENT PRODUCT
const CARD_EXPRESSIONS: Record<string, { light: string; dark: string }> = {
  // GLASS: Frosted, floating, Apple-grade — AIRY, TRANSLUCENT, HUGE RADIUS
  glass_rounded: {
    light: 'bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[2.5rem] shadow-2xl shadow-slate-300/20 p-8',
    dark: 'bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-2xl shadow-black/50 p-8'
  },
  // GLOSSY: Playful, bouncy, candy-like — SATURATED BORDERS, PLAYFUL SHADOWS
  glossy_rounded: {
    light: 'bg-white rounded-[3rem] border-4 border-violet-300/60 shadow-[0_30px_80px_-20px_rgba(139,92,246,0.4)] hover:shadow-[0_40px_100px_-20px_rgba(139,92,246,0.5)] hover:-translate-y-2 hover:rotate-1 transition-all duration-500 p-6',
    dark: 'bg-zinc-900 rounded-[3rem] border-4 border-fuchsia-500/30 shadow-[0_30px_80px_-20px_rgba(217,70,239,0.4)] hover:scale-[1.03] hover:-rotate-1 transition-all duration-500 p-6'
  },
  // MATTE: Editorial, sharp, luxurious — ZERO RADIUS, MINIMAL, DENSE
  matte_sharp: {
    light: 'bg-[#fdfcfa] border-l-4 border-stone-900 rounded-none shadow-none p-6',
    dark: 'bg-[#0c0c0c] border-l-4 border-zinc-200 rounded-none shadow-none p-6'
  },
  // RAW: Brutalist, confrontational — HARD SHADOWS, ZERO DECORATION
  raw_sharp: {
    light: 'bg-white border-[3px] border-black rounded-none shadow-[8px_8px_0_0_#000] p-4',
    dark: 'bg-black border-[3px] border-white rounded-none shadow-[8px_8px_0_0_#fff] p-4'
  },
  // UNSTABLE: Glitchy, experimental — IRIDESCENT, SHIFTING
  unstable_mixed: {
    light: 'bg-gradient-to-br from-white via-indigo-50 to-violet-50 border border-indigo-300/30 rounded-xl shadow-[0_0_60px_-10px_rgba(99,102,241,0.3),inset_0_1px_0_0_rgba(255,255,255,0.8)] p-6',
    dark: 'bg-gradient-to-br from-zinc-950 via-violet-950/20 to-zinc-950 border border-violet-500/20 rounded-xl shadow-[0_0_80px_-10px_rgba(139,92,246,0.4),inset_0_1px_0_0_rgba(255,255,255,0.05)] p-6'
  }
};

// --- TYPOGRAPHY CLASSES ---
// AGGRESSIVE DIVERGENCE: Each typography mood must be UNMISTAKABLY different
const TYPOGRAPHY_EXPRESSIONS: Record<TypographyMood, { title: { light: string; dark: string }; body: { light: string; dark: string } }> = {
  // QUIET: Whisper, ethereal, barely there
  quiet: {
    title: {
      light: 'font-sans font-extralight tracking-[0.2em] text-slate-500 text-4xl',
      dark: 'font-sans font-extralight tracking-[0.2em] text-zinc-400 text-4xl'
    },
    body: {
      light: 'font-sans font-light text-slate-400 leading-loose tracking-wide text-lg',
      dark: 'font-sans font-light text-zinc-500 leading-loose tracking-wide text-lg'
    }
  },
  // EDITORIAL: Magazine, dramatic, high-fashion
  editorial: {
    title: {
      light: 'font-serif font-normal tracking-tight text-stone-900 italic text-5xl leading-none',
      dark: 'font-serif font-normal tracking-tight text-white italic text-5xl leading-none'
    },
    body: {
      light: 'font-serif text-stone-600 leading-[2] text-xl',
      dark: 'font-serif text-zinc-400 leading-[2] text-xl'
    }
  },
  // PLAYFUL: Loud, bouncy, irreverent
  playful: {
    title: {
      light: 'font-sans font-black tracking-[-0.05em] text-slate-900 uppercase text-6xl',
      dark: 'font-sans font-black tracking-[-0.05em] text-white uppercase text-6xl'
    },
    body: {
      light: 'font-sans font-semibold text-slate-700 leading-relaxed text-lg',
      dark: 'font-sans font-semibold text-zinc-200 leading-relaxed text-lg'
    }
  },
  // INDUSTRIAL: Raw, mono, utilitarian
  industrial: {
    title: {
      light: 'font-mono font-bold tracking-tight text-black uppercase text-3xl',
      dark: 'font-mono font-bold tracking-tight text-white uppercase text-3xl'
    },
    body: {
      light: 'font-mono text-xs text-zinc-700 leading-tight tracking-wide uppercase',
      dark: 'font-mono text-xs text-zinc-400 leading-tight tracking-wide uppercase'
    }
  },
  // EXPERIMENTAL: Alien, stretched, otherworldly
  experimental: {
    title: {
      light: 'font-serif font-thin tracking-[0.3em] text-indigo-800 text-4xl',
      dark: 'font-serif font-thin tracking-[0.3em] text-violet-300 text-4xl'
    },
    body: {
      light: 'font-sans font-light text-slate-500 leading-loose tracking-widest text-base',
      dark: 'font-sans font-light text-zinc-600 leading-loose tracking-widest text-base'
    }
  }
};

// --- ACCENT EXPRESSIONS ---
// AGGRESSIVE DIVERGENCE: Buttons must feel like different product lines
const ACCENT_EXPRESSIONS: Record<ContrastProfile, { light: string; dark: string }> = {
  // LOW: Ghost, barely there
  low: {
    light: 'text-slate-400 hover:text-slate-700 px-6 py-3 rounded-full border border-transparent hover:border-slate-200 hover:bg-slate-50 font-light tracking-wide transition-all duration-500',
    dark: 'text-zinc-500 hover:text-zinc-200 px-6 py-3 rounded-full border border-transparent hover:border-zinc-700 hover:bg-zinc-800/50 font-light tracking-wide transition-all duration-500'
  },
  // EXTREME: Brutalist slabs
  extreme: {
    light: 'bg-black text-white px-8 py-3 font-bold uppercase tracking-widest text-sm border-2 border-black hover:bg-white hover:text-black transition-all duration-200',
    dark: 'bg-white text-black px-8 py-3 font-bold uppercase tracking-widest text-sm border-2 border-white hover:bg-black hover:text-white transition-all duration-200'
  },
  // ELECTRIC: Neon, dopamine
  electric: {
    light: 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 text-white px-8 py-3 rounded-full font-black uppercase tracking-wider text-sm shadow-[0_10px_40px_-10px_rgba(168,85,247,0.5)] hover:shadow-[0_15px_50px_-10px_rgba(168,85,247,0.7)] hover:scale-110 transition-all duration-300',
    dark: 'bg-gradient-to-r from-fuchsia-600 via-violet-500 to-indigo-500 text-white px-8 py-3 rounded-full font-black uppercase tracking-wider text-sm shadow-[0_10px_40px_-10px_rgba(192,38,211,0.5)] hover:shadow-[0_15px_50px_-10px_rgba(192,38,211,0.7)] hover:scale-110 transition-all duration-300'
  }
};

// ============================================================================
// MAIN RESOLVER
// ============================================================================
export const resolveThemeExpression = (theme: ThemeConfigV1, isDark: boolean) => {
  const expression = getThemeExpression(
    theme.mood === 'calm' ? 'frosted' :
    theme.mood === 'serious' ? 'midnight' :
    theme.mood === 'joyful' ? 'playful' :
    theme.mood === 'brutal' ? 'brutalist' :
    theme.mood === 'atmospheric' ? 'experimental' : 'default'
  );

  // BACKGROUND
  const bgKey = `${theme.mood}_${theme.backgroundTreatment}`;
  const bgFallbackKey = `${theme.mood}_plain`;
  const bg = BACKGROUND_EXPRESSIONS[bgKey] || BACKGROUND_EXPRESSIONS[bgFallbackKey] || BACKGROUND_EXPRESSIONS.calm_gradient;

  // SURFACE
  const surface = SURFACE_EXPRESSIONS[theme.surfaceStyle] || SURFACE_EXPRESSIONS.soft;

  // CARD (based on expression profile)
  const cardKey = `${expression.surfaceCharacter}_${expression.edgeLanguage}`;
  const card = CARD_EXPRESSIONS[cardKey] || CARD_EXPRESSIONS.glass_rounded;

  // TYPOGRAPHY
  const typography = TYPOGRAPHY_EXPRESSIONS[expression.typographyMood] || TYPOGRAPHY_EXPRESSIONS.quiet;

  // ACCENT
  const accent = ACCENT_EXPRESSIONS[expression.contrastProfile] || ACCENT_EXPRESSIONS.low;

  // SMOOTHING
  const smoothing = expression.typographyMood === 'industrial' ? 'antialiased' : 'antialiased subpixel-antialiased';

  // SELECTION
  const selection = expression.contrastProfile === 'electric'
    ? 'selection:bg-fuchsia-300 selection:text-fuchsia-950'
    : expression.contrastProfile === 'extreme'
      ? (isDark ? 'selection:bg-white selection:text-black' : 'selection:bg-black selection:text-white')
      : 'selection:bg-indigo-200/50';

  return {
    expression,
    backgroundClass: isDark ? bg.dark : bg.light,
    surfaceClass: isDark ? surface.dark : surface.light,
    cardClass: isDark ? card.dark : card.light,
    titleClass: isDark ? typography.title.dark : typography.title.light,
    bodyClass: isDark ? typography.body.dark : typography.body.light,
    accentClass: isDark ? accent.dark : accent.light,
    smoothingClass: smoothing,
    selectionClass: selection
  };
};
