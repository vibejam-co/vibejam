import { LayoutSpecV1 } from '../spec';

const ChroniclePreset: LayoutSpecV1 = {
  version: 'v1',
  meta: {
    name: 'Chronicle',
    archetype: 'chronicle'
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
      maxWidth: '1400px'
    },
    regions: [
      { id: 'hero', type: 'grid', gridArea: '1 / 1 / 2 / 13' },
      { id: 'timeline', type: 'grid', gridArea: '2 / 1 / 3 / 9' },
      { id: 'side', type: 'grid', gridArea: '2 / 9 / 3 / 13' }
    ]
  },
  blocks: [
    { id: 'hero', type: 'Hero', regionId: 'hero' },
    { id: 'timeline', type: 'Timeline', regionId: 'timeline' },
    { id: 'identity', type: 'Identity', regionId: 'side' },
    { id: 'proof', type: 'Proof', regionId: 'side' },
    { id: 'metrics', type: 'Metrics', regionId: 'side' },
    { id: 'links', type: 'Links', regionId: 'side' },
    { id: 'signals', type: 'Signals', regionId: 'side' }
  ],
  motion: {
    enabled: false,
    transitions: 'soft'
  },
  safety: {
    clampGrid: true,
    preventOverlap: true
  }
};

export default ChroniclePreset;
