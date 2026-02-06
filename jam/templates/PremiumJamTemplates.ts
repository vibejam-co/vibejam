import { CreativeSurfaceConfig } from '../creative/CreativeSurfaceConfig';

export type PremiumJamTemplateId = 'default' | 'black_label' | 'deep_focus' | 'neon_brutal';

export type PremiumJamTemplate = {
  id: PremiumJamTemplateId;
  label: string;
  tier: 'standard' | 'premium';
  description: string;
  creativeOverrides: Partial<CreativeSurfaceConfig>;
};

export const PREMIUM_JAM_TEMPLATES: Record<PremiumJamTemplateId, PremiumJamTemplate> = {
  default: {
    id: 'default',
    label: 'Standard',
    tier: 'standard',
    description: 'Neutral, balanced baseline.',
    creativeOverrides: {
      templateId: 'default',
      gridVariant: 'editorial_column',
      rhythmScale: 1,
      moodDescriptor: 'neutral'
    }
  },
  black_label: {
    id: 'black_label',
    label: 'Black Label',
    tier: 'premium',
    description: 'Institutional, severe, exclusive.',
    creativeOverrides: {
      templateId: 'black_label',
      gridVariant: 'editorial_column',
      rhythmScale: 0.95,
      moodDescriptor: 'institutional'
    }
  },
  deep_focus: {
    id: 'deep_focus',
    label: 'Deep Focus',
    tier: 'premium',
    description: 'Cinematic, patient, narrative.',
    creativeOverrides: {
      templateId: 'deep_focus',
      gridVariant: 'editorial_column',
      rhythmScale: 1.05,
      moodDescriptor: 'cinematic'
    }
  },
  neon_brutal: {
    id: 'neon_brutal',
    label: 'Neon Brutal',
    tier: 'premium',
    description: 'Aggressive, experimental, high energy.',
    creativeOverrides: {
      templateId: 'neon_brutal',
      gridVariant: 'freeform_canvas',
      rhythmScale: 0.9,
      moodDescriptor: 'volatile'
    }
  }
};
