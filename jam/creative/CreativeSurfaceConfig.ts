export type CreativeGridVariant =
  | 'editorial_column'
  | 'asymmetric_flow'
  | 'modular_blocks'
  | 'freeform_canvas'
  | 'brutalist_stack';

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
  templateId: 'default' | 'black_label' | 'deep_focus' | 'neon_brutal';
  gridVariant: CreativeGridVariant;
  colorSlots: CreativeColorSlots;
  typographySlots: CreativeTypographySlots;
  rhythmScale: number;
  moodDescriptor: string;
};

export const DEFAULT_CREATIVE_SURFACE_CONFIG: CreativeSurfaceConfig = {
  templateId: 'default',
  gridVariant: 'editorial_column',
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
