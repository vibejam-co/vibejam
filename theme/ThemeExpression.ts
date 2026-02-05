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
export type EdgeLanguage = 'rounded' | 'sharp' | 'mixed' | 'soft';
export type ContrastProfile = 'low' | 'high' | 'extreme' | 'electric';
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
  // FROSTED: Stockholm design studio, museum guide, translucent layers
  frosted: {
    surfaceCharacter: 'glass',
    edgeLanguage: 'soft',
    contrastProfile: 'low',
    typographyMood: 'quiet',
    materialMetaphor: 'glass'
  },

  // MIDNIGHT: High-end fashion editorial, cinematic, spot lighting
  midnight: {
    surfaceCharacter: 'matte',
    edgeLanguage: 'sharp',
    contrastProfile: 'high',
    typographyMood: 'editorial',
    materialMetaphor: 'obsidian'
  },

  // PLAYFUL: Interactive art installation, stickers, kinetic energy
  playful: {
    surfaceCharacter: 'glossy',
    edgeLanguage: 'rounded',
    contrastProfile: 'electric',
    typographyMood: 'playful',
    materialMetaphor: 'paper'
  },

  // BRUTALIST: Code documentation, raw construction, caution tape
  brutalist: {
    surfaceCharacter: 'raw',
    edgeLanguage: 'sharp',
    contrastProfile: 'extreme',
    typographyMood: 'industrial',
    materialMetaphor: 'concrete'
  },

  // EXPERIMENTAL: Glitch art, system error, void space
  experimental: {
    surfaceCharacter: 'unstable',
    edgeLanguage: 'mixed',
    contrastProfile: 'electric',
    typographyMood: 'experimental',
    materialMetaphor: 'glitch'
  },

  // DEFAULT: Breathable editorial
  default: {
    surfaceCharacter: 'matte',
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

// ============================================================================
// DIVERGENCE VALIDATOR (DEV ONLY)
// Ensures expression profiles remain meaningfully distinct
// ============================================================================
export function validateExpressionDivergence(themeIds?: string[]): void {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
  if (!showDevWarning) return;

  const ids = themeIds && themeIds.length > 0
    ? themeIds
    : Object.keys(THEME_EXPRESSIONS);

  for (const id of ids) {
    if (!THEME_EXPRESSIONS[id]) {
      console.warn(`[ThemeExpression] Missing expression profile for theme "${id}".`);
    }
  }

  const entries = ids
    .filter((id) => THEME_EXPRESSIONS[id])
    .map((id) => [id, THEME_EXPRESSIONS[id]] as const)
    .filter(([id]) => id !== 'default');

  for (let i = 0; i < entries.length; i += 1) {
    const [nameA, exprA] = entries[i];
    for (let j = i + 1; j < entries.length; j += 1) {
      const [nameB, exprB] = entries[j];

      const matches = [
        exprA.surfaceCharacter === exprB.surfaceCharacter,
        exprA.edgeLanguage === exprB.edgeLanguage,
        exprA.contrastProfile === exprB.contrastProfile,
        exprA.typographyMood === exprB.typographyMood,
        exprA.materialMetaphor === exprB.materialMetaphor
      ].filter(Boolean).length;

      if (matches > 2) {
        console.warn(
          `[ThemeExpression] SIMILARITY VIOLATION: "${nameA}" and "${nameB}" share ${matches} expression fields. Expressions must differ across at least 3 fields.`
        );
      }
    }
  }
}

// --- TAILWIND CLASS MAPPINGS ---
// Maps expression values to concrete Tailwind implementations

// BACKGROUND CLASSES (by mood + treatment)
const BACKGROUND_EXPRESSIONS: Record<string, { light: string; dark: string }> = {
  // CALM / FROSTED: Ethereal vapour
  calm_gradient: {
    light: 'bg-slate-50 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100',
    dark: 'bg-zinc-950 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black'
  },
  calm_texture: {
    light: 'bg-white bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px]',
    dark: 'bg-zinc-950 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:32px_32px]'
  },

  // JOYFUL / PLAYFUL: Dopamine hits
  joyful_gradient: {
    light: 'bg-orange-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-200 via-orange-100 to-amber-50',
    dark: 'bg-zinc-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-fuchsia-900 via-zinc-900 to-zinc-950'
  },

  // SERIOUS / MIDNIGHT: Cinematic void
  serious_texture: {
    light: 'bg-[#f2f2f0]',
    dark: 'bg-[#050505]'
  },
  serious_plain: {
    light: 'bg-stone-100',
    dark: 'bg-black'
  },

  // BRUTAL: Raw construction
  brutal_plain: {
    light: 'bg-stone-200 bg-[linear-gradient(45deg,#d6d3d1_25%,transparent_25%,transparent_75%,#d6d3d1_75%,#d6d3d1),linear-gradient(45deg,#d6d3d1_25%,transparent_25%,transparent_75%,#d6d3d1_75%,#d6d3d1)] [background-size:60px_60px] [background-position:0_0,30px_30px]',
    dark: 'bg-zinc-950 bg-[linear-gradient(#27272a_1px,transparent_1px),linear-gradient(to_right,#27272a_1px,transparent_1px)] [background-size:40px_40px]'
  },
  brutal_texture: {
    light: 'bg-[#e5e5e5] bg-[linear-gradient(to_right,#525252_2px,transparent_2px),linear-gradient(to_bottom,#525252_2px,transparent_2px)] [background-size:4rem_4rem]',
    dark: 'bg-black bg-[linear-gradient(to_right,#3f3f46_1px,transparent_1px),linear-gradient(to_bottom,#3f3f46_1px,transparent_1px)] [background-size:2rem_2rem]'
  },

  // ATMOSPHERIC / EXPERIMENTAL: Glitch space
  atmospheric_gradient: {
    light: 'bg-slate-200 bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-slate-100 via-teal-50 to-emerald-50',
    dark: 'bg-black bg-[conic-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black'
  },
  atmospheric_texture: {
    light: 'bg-zinc-100 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]',
    dark: 'bg-zinc-950 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px]'
  }
};

// SURFACE PHYSICS (by surfaceStyle)
const SURFACE_EXPRESSIONS: Record<string, { light: string; dark: string }> = {
  glass: {
    light: 'bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm supports-[backdrop-filter]:bg-white/40',
    dark: 'bg-zinc-900/70 backdrop-blur-xl border-b border-white/5 shadow-2xl supports-[backdrop-filter]:bg-zinc-900/60'
  },
  soft: {
    light: 'bg-white/95 border-b border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]',
    dark: 'bg-zinc-900/95 border-b border-zinc-800'
  },
  raw: {
    light: 'bg-[#f0f0f0] border-b-4 border-black',
    dark: 'bg-black border-b-4 border-white'
  },
  flat: {
    light: 'bg-[#f4f4f5] border-b border-stone-300',
    dark: 'bg-[#09090b] border-b border-zinc-800'
  }
};

// CARD PHYSICS (by expression profile)
const CARD_EXPRESSIONS: Record<string, { light: string; dark: string }> = {
  // GLASS: Apple-grade, deep blur, soft shadows
  glass_soft: {
    light: 'bg-white/60 backdrop-blur-3xl border border-white/60 rounded-[2rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)] p-10',
    dark: 'bg-zinc-800/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5)] p-10'
  },

  // GLOSSY: Sticker-like, bouncy, distinct borders
  glossy_rounded: {
    light: 'bg-white rounded-[2.5rem] border-2 border-rose-100 shadow-[0_15px_30px_-5px_rgba(251,113,133,0.15)] hover:shadow-[0_25px_50px_-10px_rgba(251,113,133,0.25)] hover:-translate-y-1 transition-all duration-300 p-8',
    dark: 'bg-zinc-900 rounded-[2.5rem] border-2 border-fuchsia-900/50 shadow-[0_15px_30px_-5px_rgba(232,121,249,0.1)] hover:shadow-[0_25px_50px_-10px_rgba(232,121,249,0.2)] hover:-translate-y-1 transition-all duration-300 p-8'
  },

  // MATTE: Editorial, sharp corners (or slight), muted
  matte_sharp: {
    light: 'bg-stone-50 border border-stone-200 rounded-sm shadow-none p-8',
    dark: 'bg-[#111] border border-zinc-800 rounded-sm shadow-none p-8'
  },

  // RAW: Brutalist, hard outlines, zero radius
  raw_sharp: {
    light: 'bg-white border-[3px] border-black rounded-none shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] transition-all p-6',
    dark: 'bg-black border-[3px] border-zinc-400 rounded-none shadow-[6px_6px_0_0_#a1a1aa] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#a1a1aa] transition-all p-6'
  },

  // UNSTABLE: Experimental, glitchy, thin borders
  unstable_mixed: {
    light: 'bg-slate-50/50 backdrop-blur-sm border border-indigo-200/50 rounded-tl-3xl rounded-br-3xl shadow-[0_0_40px_-10px_rgba(99,102,241,0.2)] p-8',
    dark: 'bg-black/80 backdrop-blur-md border border-indigo-500/30 rounded-tl-3xl rounded-br-3xl shadow-[0_0_60px_-20px_rgba(99,102,241,0.3)] p-8'
  }
};

// --- TYPOGRAPHY CLASSES ---
const TYPOGRAPHY_EXPRESSIONS: Record<TypographyMood, { title: { light: string; dark: string }; body: { light: string; dark: string } }> = {
  // QUIET: Intellectual, sparse, airy
  quiet: {
    title: {
      light: 'font-sans font-light tracking-[0.05em] text-slate-600 text-4xl',
      dark: 'font-sans font-light tracking-[0.05em] text-zinc-400 text-4xl'
    },
    body: {
      light: 'font-sans font-light text-slate-500 leading-[2] tracking-wide text-lg',
      dark: 'font-sans font-light text-zinc-500 leading-[2] tracking-wide text-lg'
    }
  },

  // EDITORIAL: High-fashion, serif headers, precise grid
  editorial: {
    title: {
      light: 'font-serif font-normal tracking-tight text-stone-950 text-6xl italic',
      dark: 'font-serif font-normal tracking-tight text-stone-200 text-6xl italic'
    },
    body: {
      light: 'font-serif text-stone-600 leading-relaxed text-xl',
      dark: 'font-serif text-zinc-400 leading-relaxed text-xl'
    }
  },

  // PLAYFUL: Loud, thick, uppercase
  playful: {
    title: {
      light: 'font-sans font-black tracking-[-0.04em] text-violet-600 text-7xl drop-shadow-sm',
      dark: 'font-sans font-black tracking-[-0.04em] text-fuchsia-400 text-7xl drop-shadow-lg'
    },
    body: {
      light: 'font-sans font-medium text-slate-800 leading-snug text-lg',
      dark: 'font-sans font-medium text-white leading-snug text-lg'
    }
  },

  // INDUSTRIAL: Mono, technical, small caps
  industrial: {
    title: {
      light: 'font-mono font-bold tracking-tighter text-black uppercase text-5xl',
      dark: 'font-mono font-bold tracking-tighter text-white uppercase text-5xl'
    },
    body: {
      light: 'font-mono text-sm text-black leading-tight tracking-tight uppercase',
      dark: 'font-mono text-sm text-zinc-300 leading-tight tracking-tight uppercase'
    }
  },

  // EXPERIMENTAL: Distorted, thin vs thick contrast
  experimental: {
    title: {
      light: 'font-sans font-thin tracking-[0.5em] text-slate-900 text-3xl uppercase',
      dark: 'font-sans font-thin tracking-[0.5em] text-white text-3xl uppercase'
    },
    body: {
      light: 'font-mono font-light text-slate-600 leading-loose tracking-widest text-sm',
      dark: 'font-mono font-light text-zinc-500 leading-loose tracking-widest text-sm'
    }
  }
};

// --- ACCENT EXPRESSIONS ---
const ACCENT_EXPRESSIONS: Record<ContrastProfile, { light: string; dark: string }> = {
  // LOW: Subtle, text-based or ghost buttons
  low: {
    light: 'text-slate-600 bg-slate-100 hover:bg-slate-200 px-6 py-2 rounded-full text-sm font-medium transition-colors',
    dark: 'text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 px-6 py-2 rounded-full text-sm font-medium transition-colors'
  },

  // HIGH: Solid blacks/whites, clear definition
  high: {
    light: 'bg-stone-900 text-white px-8 py-3 rounded-sm font-serif italic text-lg hover:bg-black transition-colors',
    dark: 'bg-white text-black px-8 py-3 rounded-sm font-serif italic text-lg hover:bg-stone-200 transition-colors'
  },

  // EXTREME: Brutalist boxes
  extreme: {
    light: 'bg-black text-white px-6 py-3 font-bold uppercase tracking-widest text-xs border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-all',
    dark: 'bg-white text-black px-6 py-3 font-bold uppercase tracking-widest text-xs border-2 border-transparent hover:bg-black hover:text-white hover:border-white transition-all'
  },

  // ELECTRIC: Gradients, glows, aggressive rounding
  electric: {
    light: 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-8 py-3 rounded-full font-black uppercase tracking-wide shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-fuchsia-500/40 hover:scale-105 transition-all',
    dark: 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white px-8 py-3 rounded-full font-black uppercase tracking-wide shadow-lg shadow-fuchsia-900/50 hover:shadow-xl hover:shadow-purple-900/60 hover:scale-105 transition-all'
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
  // Mapping strategy: Character + Edge
  const cardKey = `${expression.surfaceCharacter}_${expression.edgeLanguage}`;
  // Fallback map if exact key doesn't exist
  const cardFallback =
    expression.surfaceCharacter === 'glass' ? CARD_EXPRESSIONS.glass_soft :
      expression.surfaceCharacter === 'glossy' ? CARD_EXPRESSIONS.glossy_rounded :
        expression.surfaceCharacter === 'matte' ? CARD_EXPRESSIONS.matte_sharp :
          expression.surfaceCharacter === 'raw' ? CARD_EXPRESSIONS.raw_sharp :
            expression.surfaceCharacter === 'unstable' ? CARD_EXPRESSIONS.unstable_mixed :
              CARD_EXPRESSIONS.glass_soft;

  const card = CARD_EXPRESSIONS[cardKey] || cardFallback;

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
      : 'selection:bg-slate-200 selection:text-slate-900';

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
