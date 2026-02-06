export type CreativeGridVariant = 'default_grid';

export type CreativeColorSlots = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  contrast: string;
};

export type CreativeTypographySlots = {
  display: string;
  body: string;
  meta: string;
};

export type CreativeSurfaceConfig = {
  gridVariant: CreativeGridVariant;
  colorSlots: CreativeColorSlots;
  typographySlots: CreativeTypographySlots;
  rhythmScale: number;
  moodDescriptor: string;
};

export const DEFAULT_CREATIVE_SURFACE_CONFIG: CreativeSurfaceConfig = {
  gridVariant: 'default_grid',
  colorSlots: {
    primary: 'current',
    secondary: 'current',
    accent: 'current',
    background: 'transparent',
    contrast: 'current'
  },
  typographySlots: {
    display: 'inherit',
    body: 'inherit',
    meta: 'inherit'
  },
  rhythmScale: 1,
  moodDescriptor: 'neutral'
};
