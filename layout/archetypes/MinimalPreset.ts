import { LayoutSpecV1 } from '../spec';

const MinimalPreset: LayoutSpecV1 = {
  version: 'v1',
  meta: {
    name: 'Minimal',
    archetype: 'minimal'
  },
  theme: {
    background: '#ffffff',
    textColor: '#111827'
  },
  canvas: {
    minHeight: '100vh',
    overflowX: 'hidden',
    overflowY: 'visible'
  },
  layout: {
    grid: {
      columns: 12,
      gap: '24px',
      padding: '48px',
      maxWidth: '1200px'
    },
    regions: [
      { id: 'hero', type: 'grid', gridArea: '1 / 1 / 2 / 13' },
      { id: 'meta', type: 'grid', gridArea: '2 / 1 / 3 / 13' }
    ]
  },
  blocks: [
    { id: 'hero', type: 'Hero', regionId: 'hero' },
    { id: 'identity', type: 'Identity', regionId: 'meta' },
    { id: 'links', type: 'Links', regionId: 'meta' },
    { id: 'signals', type: 'Signals', regionId: 'meta' }
  ],
  motion: {
    enabled: false,
    transitions: 'none'
  },
  safety: {
    clampGrid: true,
    preventOverlap: true
  }
};

export default MinimalPreset;
