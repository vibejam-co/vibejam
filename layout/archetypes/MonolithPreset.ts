import { LayoutSpecV1 } from '../spec';

const MonolithPreset: LayoutSpecV1 = {
  version: 'v1',
  meta: {
    name: 'Monolith',
    archetype: 'monolith'
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
      { id: 'side', type: 'grid', gridArea: '2 / 9 / 3 / 13' },
      { id: 'actions', type: 'fixed', position: { bottom: '24px', left: '50%' }, zIndex: 100 }
    ]
  },
  blocks: [
    { id: 'hero', type: 'Hero', regionId: 'hero' },
    { id: 'timeline', type: 'Timeline', regionId: 'timeline' },
    { id: 'identity', type: 'Identity', regionId: 'side' },
    { id: 'proof', type: 'Proof', regionId: 'side' },
    { id: 'metrics', type: 'Metrics', regionId: 'side' },
    { id: 'links', type: 'Links', regionId: 'side' },
    { id: 'signals', type: 'Signals', regionId: 'side' },
    { id: 'actions', type: 'Actions', regionId: 'actions', style: { transform: 'translateX(-50%)' } }
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

export default MonolithPreset;
