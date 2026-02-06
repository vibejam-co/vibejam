import { CreativeSurfaceConfig, DEFAULT_CREATIVE_SURFACE_CONFIG } from '../creative/CreativeSurfaceConfig';
import { PremiumJamTemplateId, PREMIUM_JAM_TEMPLATES } from './PremiumJamTemplates';

export const resolvePremiumTemplate = (
  base: CreativeSurfaceConfig,
  templateId: PremiumJamTemplateId
): CreativeSurfaceConfig => {
  const template = PREMIUM_JAM_TEMPLATES[templateId] || PREMIUM_JAM_TEMPLATES.default;
  return {
    ...DEFAULT_CREATIVE_SURFACE_CONFIG,
    ...template.creativeOverrides,
    ...base,
    colorSlots: {
      ...DEFAULT_CREATIVE_SURFACE_CONFIG.colorSlots,
      ...(base.colorSlots || {})
    },
    typographySlots: {
      ...DEFAULT_CREATIVE_SURFACE_CONFIG.typographySlots,
      ...(base.typographySlots || {})
    }
  };
};
