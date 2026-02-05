// ============================================================================
// TRUST SIGNALS
// ============================================================================
// Read-only, derived trust signals that make progress legible to strangers.
// No persistence, no mutations, no runtime throws.
// ============================================================================

import { registerGovernanceTouchpoint } from '../lib/ChangeTypes';

export const TRUST_SIGNALS_VERSION = 1 as const;

// Governance guardrail: trust signals are high-impact and require review.
registerGovernanceTouchpoint('trust-signals');

export type TrustActivityPattern = 'steady' | 'bursty' | 'silent';

export interface TrustSignalsV1 {
  version: 1;
  buildAgeDays: number;
  buildAgeLabel: string;
  updateRecencyDays: number;
  updateRecencyLabel: string;
  proofPresence: boolean;
  activityPattern: TrustActivityPattern;
  silencePenalty: boolean;
  socialSignals?: string[];
}

export interface TrustSignalInput {
  proofUrl?: string | null;
  milestones?: { date: string }[] | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
}

const clampToZero = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0);

const daysBetween = (from: Date, to: Date) => {
  const diff = to.getTime() - from.getTime();
  return clampToZero(Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const humanizeDays = (days: number, context: 'live' | 'updated') => {
  if (days <= 0) return context === 'live' ? 'Live today' : 'Updated today';
  if (days === 1) return context === 'live' ? 'Live 1 day' : 'Updated 1 day ago';
  return context === 'live' ? `Live ${days} days` : `Updated ${days} days ago`;
};

const resolveActivityPattern = (milestones: { date: string }[] | null | undefined, buildAgeDays: number, updateRecencyDays: number): TrustActivityPattern => {
  if (updateRecencyDays >= 30) return 'silent';
  if (!milestones || milestones.length < 2) {
    if (buildAgeDays >= 30 && updateRecencyDays >= 14) return 'silent';
    return 'bursty';
  }

  const parsed = milestones
    .map((m) => parseDate(m.date))
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime());

  if (parsed.length < 2) return 'bursty';

  const spanDays = daysBetween(parsed[0], parsed[parsed.length - 1]);
  if (spanDays >= 30) return 'steady';
  return 'bursty';
};

export const deriveTrustSignals = (input: TrustSignalInput): TrustSignalsV1 => {
  const now = new Date();
  const createdAt = parseDate(input.createdAt);
  const publishedAt = parseDate(input.publishedAt);
  const updatedAt = parseDate(input.updatedAt);

  const origin = publishedAt || createdAt || now;
  const buildAgeDays = daysBetween(origin, now);

  const milestoneDates = input.milestones || [];
  const lastMilestone = milestoneDates
    .map((m) => parseDate(m.date))
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0] || null;

  const lastUpdate = updatedAt || lastMilestone || origin;
  const updateRecencyDays = daysBetween(lastUpdate, now);

  const activityPattern = resolveActivityPattern(milestoneDates, buildAgeDays, updateRecencyDays);
  const silencePenalty = activityPattern === 'silent';

  return {
    version: TRUST_SIGNALS_VERSION,
    buildAgeDays,
    buildAgeLabel: humanizeDays(buildAgeDays, 'live'),
    updateRecencyDays,
    updateRecencyLabel: humanizeDays(updateRecencyDays, 'updated'),
    proofPresence: !!input.proofUrl,
    activityPattern,
    silencePenalty
  };
};
