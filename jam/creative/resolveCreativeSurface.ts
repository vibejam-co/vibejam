import { CreativeSurfaceConfig, DEFAULT_CREATIVE_SURFACE_CONFIG } from './CreativeSurfaceConfig';

// Extension point: AI-generated art direction should only mutate the CreativeSurfaceConfig.
// Locked: proof visibility, narrative structure, silence semantics.
export const resolveCreativeSurface = (): CreativeSurfaceConfig => {
  return DEFAULT_CREATIVE_SURFACE_CONFIG;
};
