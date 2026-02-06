export type ProofLevel = 'none' | 'linked' | 'verified';

export type ProofLevelInput = {
  proofUrl?: string | null;
  proofFreshness?: 'stale' | 'recent' | 'current' | null;
};

export const deriveProofLevel = (input: ProofLevelInput): ProofLevel => {
  if (!input.proofUrl) return 'none';
  if (input.proofFreshness === 'current') return 'verified';
  return 'linked';
};
