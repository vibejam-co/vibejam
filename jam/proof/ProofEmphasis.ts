import { ProofLevel } from './deriveProofLevel';

export type ProofEmphasisIntent = {
  weight: 'light' | 'medium' | 'heavy';
  interruptsFlow: boolean;
  proximityBias: 'inline' | 'near' | 'dominant';
};

export const PROOF_EMPHASIS_MAP: Record<ProofLevel, ProofEmphasisIntent> = {
  none: {
    weight: 'light',
    interruptsFlow: false,
    proximityBias: 'inline'
  },
  linked: {
    weight: 'medium',
    interruptsFlow: true,
    proximityBias: 'near'
  },
  verified: {
    weight: 'heavy',
    interruptsFlow: true,
    proximityBias: 'dominant'
  }
};
