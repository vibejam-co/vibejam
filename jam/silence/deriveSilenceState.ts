export type SilenceState = 'pure' | 'pause' | 'quiet_verified';

export type SilenceStateInput = {
  proofUrl?: string | null;
  milestones?: { date?: string | null }[] | null;
  updateRecencyDays?: number | null;
};

export const deriveSilenceState = (input: SilenceStateInput): SilenceState => {
  const activityCount = input.milestones?.length || 0;
  const hasProof = !!input.proofUrl;
  const isDormant = typeof input.updateRecencyDays === 'number'
    ? input.updateRecencyDays > 14
    : activityCount === 0;

  if (!hasProof && activityCount === 0) return 'pure';
  if (hasProof && isDormant) return 'quiet_verified';
  if (activityCount > 0 && isDormant) return 'pause';
  return hasProof ? 'quiet_verified' : 'pause';
};
