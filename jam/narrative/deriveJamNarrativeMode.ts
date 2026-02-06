import { JamNarrativeMode } from './JamNarrative';

export type JamNarrativeInput = {
  proofUrl?: string | null;
  milestones?: { date?: string | null }[] | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const daysSince = (value?: string | null): number | null => {
  const parsed = parseDate(value);
  if (!parsed) return null;
  const diff = Date.now() - parsed.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const resolveLastActivityDate = (input: JamNarrativeInput): Date | null => {
  const milestoneDates = (input.milestones || [])
    .map((m) => parseDate(m.date || null))
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime());

  return milestoneDates[0]
    || parseDate(input.updatedAt)
    || parseDate(input.publishedAt)
    || parseDate(input.createdAt)
    || null;
};

const hasRecentActivity = (input: JamNarrativeInput, windowDays: number): boolean => {
  const lastActivity = resolveLastActivityDate(input);
  if (!lastActivity) return false;
  const diffDays = Math.max(0, Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)));
  const milestoneCount = input.milestones?.length || 0;
  return milestoneCount > 0 && diffDays <= windowDays;
};

export const deriveJamNarrativeMode = (input: JamNarrativeInput): JamNarrativeMode => {
  if (hasRecentActivity(input, 7)) return 'stream';
  if (input.proofUrl) return 'dossier';
  return 'chronicle';
};

export const deriveJamNarrativeReason = (input: JamNarrativeInput): string => {
  if (hasRecentActivity(input, 7)) return 'recent_activity';
  if (input.proofUrl) return 'proof_present';
  const days = daysSince(input.publishedAt) ?? daysSince(input.createdAt);
  if (typeof days === 'number' && days <= 14) return 'early_jam';
  return 'default';
};
