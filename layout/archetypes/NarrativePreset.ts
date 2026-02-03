import { LayoutSpecV1 } from '../spec';

const NarrativePreset: LayoutSpecV1 = {
  version: 'v1',
  meta: {
    name: 'Narrative',
    archetype: 'narrative'
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
      { id: 'timeline', type: 'grid', gridArea: '2 / 2 / 3 / 12' },
      { id: 'identity', type: 'grid', gridArea: '3 / 2 / 4 / 7' },
      { id: 'metrics', type: 'grid', gridArea: '3 / 7 / 4 / 12' }
    ]
  },
  blocks: [
    { id: 'hero', type: 'Hero', regionId: 'hero' },
    { id: 'timeline', type: 'Timeline', regionId: 'timeline' },
    { id: 'identity', type: 'Identity', regionId: 'identity' },
    { id: 'metrics', type: 'Metrics', regionId: 'metrics' },
    { id: 'links', type: 'Links', regionId: 'metrics' },
    { id: 'signals', type: 'Signals', regionId: 'metrics' }
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

export default NarrativePreset;
