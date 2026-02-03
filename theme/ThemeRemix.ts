import { ThemeConfigV1, validateThemeConfig } from './ThemeConfig';
import { ThemeClasses } from './ThemeClasses';

/**
 * AI Theme Remix Contract
 */
export type ThemeRemixResult = {
    config: ThemeConfigV1;
    classes: ThemeClasses;
    explanation?: string;
};

// Whitelist of safe Tailwind utility patterns for AI Remix
const SAFE_CLASS_PATTERNS = [
    /^bg-(white|black|zinc|slate|gray|blue|indigo|emerald|purple|pink|rose|amber|orange)-(\d+|current|transparent|none)(\/\d+)?$/,
    /^text-(white|black|zinc|slate|gray|blue|indigo|emerald|purple|pink|rose|amber|orange)-(\d+|current|transparent)(\/\d+)?$/,
    /^border-(white|black|zinc|slate|gray|blue|indigo|emerald|purple|pink|rose|amber|orange)-(\d+|current|transparent)(\/\d+)?$/,
    /^shadow-(sm|md|lg|xl|2xl|inner|none)$/,
    /^rounded-(none|sm|md|lg|xl|2xl|3xl|full)$/,
    /^backdrop-blur-(sm|md|lg|xl|2xl|3xl|none)$/,
    /^font-(sans|serif|mono|black|bold|medium|light|thin)$/,
    /^italic$/,
    /^uppercase|lowercase|capitalize|normal-case$/,
    /^tracking-(tighter|tight|normal|wide|wider|widest)$/,
    /^leading-(none|tight|snug|normal|relaxed|loose)$/,
    /^opacity-\d+$/,
    /^underline|no-underline$/,
    /^decoration-(current|white|black|zinc|slate|gray|blue|indigo|emerald|purple|pink|rose|amber|orange)-(\d+)$/,
    /^underline-offset-\d+$/,
    /^selection:bg-(\w+)-(\d+)$/,
    /^bg-gradient-to-(t|b|l|r|tl|tr|bl|br)$/,
    /^from-(\w+)-(\d+)$/,
    /^via-(\w+)-(\d+)$/,
    /^to-(\w+)-(\d+)$/,
    /^bg-\[radial-gradient\([^\]]+\)\]$/, // Controlled custom gradients
    /^bg-\[background-size:[^\]]+\]$/,
];

/**
 * Sanitizes a list of tailwind classes against the safety whitelist.
 */
function sanitizeClasses(classString: string): string {
    return classString
        .split(/\s+/)
        .filter(cls => {
            // Allow transparent/none/current shorthands
            if (['bg-transparent', 'bg-none', 'border-none', 'text-current'].includes(cls)) return true;
            return SAFE_CLASS_PATTERNS.some(regex => regex.test(cls));
        })
        .join(' ');
}

/**
 * Validates and sanitizes a complete ThemeRemixResult.
 */
export function validateRemix(input: any): ThemeRemixResult {
    const config = validateThemeConfig(input.config);

    const rawClasses = input.classes || {};
    const classes: ThemeClasses = {
        page: sanitizeClasses(rawClasses.page || ''),
        surface: sanitizeClasses(rawClasses.surface || ''),
        card: sanitizeClasses(rawClasses.card || ''),
        title: sanitizeClasses(rawClasses.title || ''),
        body: sanitizeClasses(rawClasses.body || ''),
        accent: sanitizeClasses(rawClasses.accent || ''),
    };

    return {
        config,
        classes,
        explanation: input.explanation || 'Theme remixed by AI.'
    };
}
