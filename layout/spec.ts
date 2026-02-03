export type LayoutArchetype = 'chronicle' | 'gallery' | 'minimal' | 'narrative' | 'experimental' | 'monolith';

export type LayoutBlockType =
  | 'Hero'
  | 'Identity'
  | 'Proof'
  | 'Metrics'
  | 'Links'
  | 'Timeline'
  | 'Signals'
  | 'Actions';

export type LayoutRegionType = 'grid' | 'overlay' | 'fixed';

export interface LayoutSpecV1 {
  version: 'v1';
  meta: {
    name: string;
    archetype: LayoutArchetype;
    description?: string;
  };
  theme: {
    background?: string;
    textColor?: string;
    accentColor?: string;
  };
  canvas: {
    minHeight?: string;
    overflowX?: 'visible' | 'hidden' | 'clip';
    overflowY?: 'visible' | 'hidden' | 'auto';
  };
  layout: {
    grid: {
      columns: number;
      rows?: number;
      gap?: string;
      align?: 'start' | 'center' | 'end' | 'stretch';
      justify?: 'start' | 'center' | 'end' | 'stretch';
      padding?: string;
      maxWidth?: string;
    };
    regions: LayoutRegion[];
  };
  blocks: LayoutBlockSpec[];
  motion?: {
    enabled?: boolean;
    transitions?: 'none' | 'soft' | 'expressive';
  };
  safety?: {
    clampGrid?: boolean;
    preventOverlap?: boolean;
  };
}

export interface LayoutRegion {
  id: string;
  type: LayoutRegionType;
  gridArea?: string;
  zIndex?: number;
  position?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export interface LayoutBlockSpec {
  id: string;
  type: LayoutBlockType;
  regionId: string;
  variant?: string;
  style?: Record<string, string | number>;
}
