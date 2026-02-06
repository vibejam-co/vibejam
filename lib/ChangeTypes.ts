export type ChangeType = 'cosmetic' | 'behavioral' | 'narrative' | 'trust-affecting';

export const CHANGE_TYPE_GUIDANCE: Record<ChangeType, string> = {
  cosmetic: 'Safe and reversible. No change to meaning or behavior.',
  behavioral: 'Requires review. May change user expectations or flow.',
  narrative: 'Rare. High impact on identity and trust.',
  'trust-affecting': 'Requires explicit approval. Must be observable and reversible.'
};

export const LAUNCH_DATE_ISO = '2026-02-05';
export const OBSERVE_ONLY_DAYS = 30;

export const getObserveWindowEndsAt = () => {
  const start = new Date(LAUNCH_DATE_ISO);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + OBSERVE_ONLY_DAYS * 24 * 60 * 60 * 1000);
  return end;
};

export const isObserveOnlyWindow = () => {
  const end = getObserveWindowEndsAt();
  if (!end) return false;
  const now = new Date();
  return now <= end;
};

const isDev = () => typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;

export const registerGovernanceTouchpoint = (label: string) => {
  if (!isDev()) return;
  console.warn(`[Governance] Touchpoint: ${label}. Changes here require review and explicit intent.`);
};

export const warnIfRankingOrHype = (flags: { leaderboard?: boolean; hype?: boolean }) => {
  if (!isDev()) return;
  if (flags.leaderboard) {
    console.warn('[Governance] Ranking surface enabled (leaderboard). Ensure this is intentional and reviewed.');
  }
  if (flags.hype) {
    console.warn('[Governance] Hype mechanics enabled. Avoid urgency or growth promises.');
  }
};

export const warnIfObserveOnlyWindow = () => {
  if (!isDev()) return;
  if (isObserveOnlyWindow()) {
    const end = getObserveWindowEndsAt();
    console.warn(`[Governance] Observe-only window active until ${end?.toISOString().slice(0, 10)}. Log insights; avoid shipping fixes.`);
  }
};
