// ============================================================================
// CREDIBILITY STATE CONTRACT
// ============================================================================
// Derived, read-only. No user input. Uses signals, timestamps, and proof.
// ============================================================================

import { registerGovernanceTouchpoint } from '../lib/ChangeTypes';

// Governance guardrail: credibility logic is trust-affecting and requires review.
registerGovernanceTouchpoint('credibility-state');

export type MomentumLevel = 'dormant' | 'active' | 'compounding';
export type ConsistencyWindow = '7d' | '30d' | '90d';
export type ProofFreshness = 'stale' | 'recent' | 'current';

export interface CredibilityState {
  momentumLevel: MomentumLevel;
  consistencyWindow: ConsistencyWindow;
  proofFreshness: ProofFreshness;
  silencePenalty: boolean;
  silenceDays: number;
}

type CredibilityInput = {
  milestones?: { date: string; label: string }[];
  proofUrl?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  proofFirst?: boolean;
  heroFirst?: boolean;
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const deriveCredibilityState = (input: CredibilityInput): CredibilityState => {
  const now = new Date();
  const milestoneDates = (input.milestones || [])
    .map((m) => parseDate(m.date))
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime());

  const lastMilestone = milestoneDates[0] || null;
  const updatedAt = parseDate(input.updatedAt);
  const publishedAt = parseDate(input.publishedAt);
  const createdAt = parseDate(input.createdAt);
  const lastUpdate = lastMilestone || updatedAt || publishedAt || createdAt || now;

  const silenceDays = Math.max(0, Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)));

  const withinDays = (d: number) => milestoneDates.filter((m) => (now.getTime() - m.getTime()) <= d * 24 * 60 * 60 * 1000).length;
  const count7 = withinDays(7);
  const count30 = withinDays(30);
  const count90 = withinDays(90);

  const momentumLevel: MomentumLevel =
    count30 >= 3 ? 'compounding' :
      count30 >= 1 ? 'active' : 'dormant';

  const consistencyWindow: ConsistencyWindow =
    count7 >= 2 ? '7d' : count30 >= 3 ? '30d' : '90d';

  const hasProof = !!input.proofUrl;
  const proofFreshness: ProofFreshness =
    hasProof && silenceDays <= 7 ? 'current' :
      hasProof && silenceDays <= 30 ? 'recent' : 'stale';

  const silencePenalty = silenceDays > 30 || (input.proofFirst && proofFreshness === 'stale') || (input.heroFirst && silenceDays > 14);

  return {
    momentumLevel,
    consistencyWindow,
    proofFreshness,
    silencePenalty,
    silenceDays
  };
};
