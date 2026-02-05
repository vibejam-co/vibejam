// ============================================================================
// COMMITMENT MOMENTS
// ============================================================================
// Captures soft identity thresholds that signal a creator "locking in".
// Deterministic, reversible, and debuggable. Persistence lives at the caller.
// ============================================================================

export const COMMITMENT_MOMENTS_VERSION = 1 as const;

export type CommitmentMomentKey =
  | 'firstPublicShare'
  | 'firstSignalPosted'
  | 'firstFollower'
  | 'firstThemeCommit';

export interface CommitmentMomentsV1 {
  version: 1;
  firstPublicShare: boolean;
  firstSignalPosted: boolean;
  firstFollower: boolean;
  firstThemeCommit: boolean;
}

export const DEFAULT_COMMITMENT_MOMENTS: CommitmentMomentsV1 = {
  version: COMMITMENT_MOMENTS_VERSION,
  firstPublicShare: false,
  firstSignalPosted: false,
  firstFollower: false,
  firstThemeCommit: false
};

export const hasAnyCommitmentMoment = (moments: CommitmentMomentsV1) => (
  moments.firstPublicShare ||
  moments.firstSignalPosted ||
  moments.firstFollower ||
  moments.firstThemeCommit
);

export const markCommitmentMoment = (moments: CommitmentMomentsV1, key: CommitmentMomentKey): CommitmentMomentsV1 => {
  if (moments[key]) return moments;
  return {
    ...moments,
    [key]: true
  };
};

export const readCommitmentMoments = (stored: string | null): CommitmentMomentsV1 => {
  if (!stored) return DEFAULT_COMMITMENT_MOMENTS;
  try {
    const parsed = JSON.parse(stored);
    if (!parsed || parsed.version !== COMMITMENT_MOMENTS_VERSION) return DEFAULT_COMMITMENT_MOMENTS;
    return {
      ...DEFAULT_COMMITMENT_MOMENTS,
      ...parsed
    };
  } catch (error) {
    console.warn('[CommitmentMoments] Failed to parse stored moments.', error);
    return DEFAULT_COMMITMENT_MOMENTS;
  }
};

export const serializeCommitmentMoments = (moments: CommitmentMomentsV1): string => {
  return JSON.stringify(moments);
};
