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
const CARD_EXPRESSIONS: Record<string, { light: string; dark: string }> = {
  // GLASS: Frosted, floating, Apple-grade
  glass_rounded: {
    light: 'bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-xl shadow-slate-200/30',
    dark: 'bg-zinc-800/60 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl'
  },
  // GLOSSY: Playful, bouncy, candy-like
  glossy_rounded: {
    light: 'bg-white rounded-[2.5rem] border-2 border-violet-200/50 shadow-[0_20px_60px_-15px_rgba(139,92,246,0.3)] hover:shadow-[0_30px_80px_-15px_rgba(139,92,246,0.4)] hover:-translate-y-1 transition-all duration-300',
    dark: 'bg-zinc-800 rounded-[2.5rem] border-2 border-fuchsia-500/20 shadow-[0_20px_60px_-15px_rgba(217,70,239,0.3)] hover:scale-[1.02] transition-all duration-300'
  },
  // MATTE: Editorial, sharp, luxurious
  matte_sharp: {
    light: 'bg-white border border-stone-200 rounded-sm shadow-sm',
    dark: 'bg-zinc-900 border border-zinc-700 rounded-none'
  },
  // RAW: Brutalist, confrontational
  raw_sharp: {
    light: 'bg-white border-2 border-black rounded-none shadow-[6px_6px_0_0_#000]',
    dark: 'bg-black border-2 border-white rounded-none shadow-[6px_6px_0_0_#fff]'
  },
  // UNSTABLE: Glitchy, experimental
  unstable_mixed: {
    light: 'bg-gradient-to-br from-white to-slate-50 border border-indigo-200/50 rounded-lg shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]',
    dark: 'bg-gradient-to-br from-zinc-900 to-black border border-violet-500/20 rounded-lg shadow-[0_0_40px_-5px_rgba(139,92,246,0.4)]'
  }
};

// --- TYPOGRAPHY CLASSES ---
const TYPOGRAPHY_EXPRESSIONS: Record<TypographyMood, { title: { light: string; dark: string }; body: { light: string; dark: string } }> = {
  quiet: {
    title: {
      light: 'font-sans font-light tracking-wide text-slate-700',
      dark: 'font-sans font-light tracking-wide text-zinc-300'
    },
    body: {
      light: 'font-sans text-slate-500 leading-relaxed',
      dark: 'font-sans text-zinc-400 leading-relaxed'
    }
  },
  editorial: {
    title: {
      light: 'font-serif font-normal tracking-tight text-stone-900 italic',
      dark: 'font-serif font-normal tracking-tight text-white italic'
    },
    body: {
      light: 'font-serif text-stone-600 leading-loose text-lg',
      dark: 'font-serif text-zinc-400 leading-loose text-lg'
    }
  },
  playful: {
    title: {
      light: 'font-sans font-black tracking-tighter text-slate-900 uppercase',
      dark: 'font-sans font-black tracking-tighter text-white uppercase'
    },
    body: {
      light: 'font-sans font-medium text-slate-600 leading-relaxed',
      dark: 'font-sans font-medium text-zinc-300 leading-relaxed'
    }
  },
  industrial: {
    title: {
      light: 'font-mono font-bold tracking-tight text-black uppercase',
      dark: 'font-mono font-bold tracking-tight text-white uppercase'
    },
    body: {
      light: 'font-mono text-sm text-zinc-700 leading-tight',
      dark: 'font-mono text-sm text-zinc-300 leading-tight'
    }
  },
  experimental: {
    title: {
      light: 'font-serif font-extralight tracking-widest text-indigo-900',
      dark: 'font-serif font-extralight tracking-widest text-violet-200'
    },
    body: {
      light: 'font-sans text-slate-500 leading-loose tracking-wide',
      dark: 'font-sans text-zinc-500 leading-loose tracking-wide'
    }
  }
};

// --- ACCENT EXPRESSIONS ---
const ACCENT_EXPRESSIONS: Record<ContrastProfile, { light: string; dark: string }> = {
  low: {
    light: 'text-slate-500 hover:text-slate-900 px-4 py-2 rounded-full hover:bg-slate-100 transition-all duration-300',
    dark: 'text-zinc-400 hover:text-white px-4 py-2 rounded-full hover:bg-white/5 transition-all duration-300'
  },
  extreme: {
    light: 'bg-black text-white px-6 py-2.5 font-bold uppercase tracking-wider hover:bg-zinc-800 transition-all duration-200',
    dark: 'bg-white text-black px-6 py-2.5 font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all duration-200'
  },
  electric: {
    light: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all duration-300',
    dark: 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 hover:scale-105 transition-all duration-300'
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
