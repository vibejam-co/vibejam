export type DensityProfile = 'airy' | 'balanced' | 'compressed';

export type ActivityDensityIntent = {
  verticalGapBias: 'wide' | 'normal' | 'tight';
  groupingStrength: 'loose' | 'medium' | 'strong';
  typographyProximity: 'relaxed' | 'compact';
};

export const ACTIVITY_DENSITY_MAP: Record<DensityProfile, ActivityDensityIntent> = {
  airy: {
    verticalGapBias: 'wide',
    groupingStrength: 'loose',
    typographyProximity: 'relaxed'
  },
  balanced: {
    verticalGapBias: 'normal',
    groupingStrength: 'medium',
    typographyProximity: 'relaxed'
  },
  compressed: {
    verticalGapBias: 'tight',
    groupingStrength: 'strong',
    typographyProximity: 'compact'
  }
};
