import { LayoutSpecV1 } from '../spec';

const ExperimentalPreset: LayoutSpecV1 = {
  version: 'v1',
  meta: {
    name: 'Experimental',
    archetype: 'experimental'
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
      gap: '20px',
      padding: '40px',
      maxWidth: '1400px'
    },
    regions: [
      { id: 'hero', type: 'grid', gridArea: '1 / 1 / 2 / 13' },
      { id: 'left', type: 'grid', gridArea: '2 / 1 / 3 / 7' },
      { id: 'right', type: 'grid', gridArea: '2 / 7 / 3 / 13' }
    ]
  },
  blocks: [
    { id: 'hero', type: 'Hero', regionId: 'hero' },
    { id: 'timeline', type: 'Timeline', regionId: 'left' },
    { id: 'identity', type: 'Identity', regionId: 'right' },
    { id: 'metrics', type: 'Metrics', regionId: 'right' },
    { id: 'links', type: 'Links', regionId: 'right' },
    { id: 'proof', type: 'Proof', regionId: 'right' },
    { id: 'signals', type: 'Signals', regionId: 'right' }
  ],
  motion: {
    enabled: false,
    transitions: 'expressive'
  },
  safety: {
    clampGrid: true,
    preventOverlap: true
  }
};

export default ExperimentalPreset;
