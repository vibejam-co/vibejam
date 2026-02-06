import { CreativeSurfaceConfig, DEFAULT_CREATIVE_SURFACE_CONFIG } from './CreativeSurfaceConfig';
import { enforceCreativeSafety } from './CreativeSafety';

// Extension point: AI-generated art direction should only mutate the CreativeSurfaceConfig.
// Locked: proof visibility, narrative structure, silence semantics.
export const resolveCreativeSurface = (): CreativeSurfaceConfig => {
  // Extension point: AI/user controls may select gridVariant and other slots.
  return enforceCreativeSafety(DEFAULT_CREATIVE_SURFACE_CONFIG);
};
