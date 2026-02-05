export const ONE_SENTENCE_TRUTH = 'VibeJam is a place to watch products grow in public.';

export const BUILDER_EXPECTATIONS = [
  'Progress is visible.',
  'Silence is visible.',
  'Proof matters.',
  'Momentum compounds.'
];

export const ANTI_FEATURES = [
  'No launch day hype.',
  'No trending races.',
  'No vanity metrics.',
  'No fake urgency.'
];

const HYPE_TERMS = [
  'hype',
  'viral',
  'explode',
  'rocket',
  'guaranteed',
  'exposure',
  'discoverability',
  'growth',
  'trending',
  'featured',
  'breakthrough',
  'boost',
  'scale fast',
  'audience',
  'followers'
];

export const warnIfCopyDrifts = (label: string, lines: string[]) => {
  const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
  if (!showDevWarning) return;

  const violations: string[] = [];
  lines.forEach((line) => {
    const normalized = line.toLowerCase();
    HYPE_TERMS.forEach((term) => {
      if (normalized.includes(term)) {
        violations.push(`${term} → "${line}"`);
      }
    });
  });

  if (violations.length) {
    console.warn(`[LaunchNarrative] Copy drift detected in ${label}. Avoid hype, growth promises, or discoverability language.`, violations);
  }
};
