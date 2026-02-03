export const LAYOUT_CONFIG_VERSION = 1 as const;

export type LayoutArchetype = 'chronicle' | 'gallery' | 'minimal' | 'narrative' | 'experimental';

export type LayoutConfigV1 = {
  version: 1;
  archetype: LayoutArchetype;
  grid: 'balanced' | 'asymmetric';
  heroPlacement: 'top' | 'center' | 'offset';
  timelinePlacement: 'left' | 'center' | 'right';
  typographyScale: 'standard' | 'large' | 'oversized';
  spacingDensity: 'compact' | 'comfortable' | 'loose';
  emphasis: {
    hero: boolean;
    title: boolean;
    proof: boolean;
  };
  motion: 'none' | 'subtle';
};

export const DEFAULT_LAYOUT_CONFIG: LayoutConfigV1 = {
  version: LAYOUT_CONFIG_VERSION,
  archetype: 'chronicle',
  grid: 'balanced',
  heroPlacement: 'top',
  timelinePlacement: 'left',
  typographyScale: 'large',
  spacingDensity: 'comfortable',
  emphasis: {
    hero: true,
    title: true,
    proof: true
  },
  motion: 'subtle'
};

export const ChronicleLayoutConfig: LayoutConfigV1 = {
  ...DEFAULT_LAYOUT_CONFIG,
  archetype: 'chronicle'
};

export const GalleryLayoutConfig: LayoutConfigV1 = {
  ...DEFAULT_LAYOUT_CONFIG,
  archetype: 'gallery',
  timelinePlacement: 'center'
};

export const MinimalLayoutConfig: LayoutConfigV1 = {
  ...DEFAULT_LAYOUT_CONFIG,
  archetype: 'minimal',
  emphasis: {
    hero: false,
    title: true,
    proof: false
  }
};

export const NarrativeLayoutConfig: LayoutConfigV1 = {
  ...DEFAULT_LAYOUT_CONFIG,
  archetype: 'narrative',
  timelinePlacement: 'center'
};

export const ExperimentalLayoutConfig: LayoutConfigV1 = {
  ...DEFAULT_LAYOUT_CONFIG,
  archetype: 'experimental',
  grid: 'asymmetric',
  heroPlacement: 'offset',
  timelinePlacement: 'left',
  typographyScale: 'oversized',
  spacingDensity: 'loose',
  emphasis: {
    hero: true,
    title: true,
    proof: true
  }
};

export const LAYOUT_PRESETS: Record<LayoutArchetype, LayoutConfigV1> = {
  chronicle: ChronicleLayoutConfig,
  gallery: GalleryLayoutConfig,
  minimal: MinimalLayoutConfig,
  narrative: NarrativeLayoutConfig,
  experimental: ExperimentalLayoutConfig
};

export function validateLayoutConfig(
  input: Partial<LayoutConfigV1> | null | undefined
): LayoutConfigV1 {
  if (!input || input.version !== LAYOUT_CONFIG_VERSION) return DEFAULT_LAYOUT_CONFIG;

  const merged: LayoutConfigV1 = {
    ...DEFAULT_LAYOUT_CONFIG,
    ...input,
    emphasis: {
      ...DEFAULT_LAYOUT_CONFIG.emphasis,
      ...input.emphasis
    }
  };

  return merged;
}
