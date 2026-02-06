import type { CSSProperties } from 'react';
import { CreativeGridVariant } from './CreativeSurfaceConfig';

export type CreativeGridDefinition = {
  containerClass: string;
  containerStyle?: CSSProperties;
};

// Extension point: AI/user overrides may supply custom grid parameters here.
// Guardrails: never reorder children; container-level only.
export const resolveCreativeGrid = (variant: CreativeGridVariant): CreativeGridDefinition => {
  switch (variant) {
    case 'asymmetric_flow':
      return {
        containerClass: 'jam-grid-asymmetric',
        containerStyle: {
          '--jam-grid-columns': '12',
          '--jam-grid-gutter': '1.5rem'
        } as CSSProperties
      };
    case 'modular_blocks':
      return {
        containerClass: 'jam-grid-modular',
        containerStyle: {
          '--jam-grid-columns': '12',
          '--jam-grid-gutter': '1.5rem'
        } as CSSProperties
      };
    case 'freeform_canvas':
      return {
        containerClass: 'jam-grid-freeform',
        containerStyle: {
          '--jam-grid-columns': '12',
          '--jam-grid-gutter': '1.5rem'
        } as CSSProperties
      };
    case 'brutalist_stack':
      return {
        containerClass: 'jam-grid-brutalist',
        containerStyle: {
          '--jam-grid-columns': '12',
          '--jam-grid-gutter': '1.5rem'
        } as CSSProperties
      };
    case 'editorial_column':
    default:
      return {
        containerClass: 'jam-grid-editorial',
        containerStyle: {
          '--jam-grid-columns': '12',
          '--jam-grid-gutter': '1.5rem'
        } as CSSProperties
      };
  }
};
