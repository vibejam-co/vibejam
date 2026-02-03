import { LayoutSpecV1 } from '../spec';

const GalleryPreset: LayoutSpecV1 = {
  version: 'v1',
  meta: {
    name: 'Gallery',
    archetype: 'gallery'
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
      { id: 'identity', type: 'grid', gridArea: '2 / 1 / 3 / 5' },
      { id: 'metrics', type: 'grid', gridArea: '2 / 5 / 3 / 9' },
      { id: 'links', type: 'grid', gridArea: '2 / 9 / 3 / 13' },
      { id: 'timeline', type: 'grid', gridArea: '3 / 1 / 4 / 13' }
    ]
  },
  blocks: [
    { id: 'hero', type: 'Hero', regionId: 'hero' },
    { id: 'identity', type: 'Identity', regionId: 'identity' },
    { id: 'metrics', type: 'Metrics', regionId: 'metrics' },
    { id: 'links', type: 'Links', regionId: 'links' },
    { id: 'timeline', type: 'Timeline', regionId: 'timeline' },
    { id: 'signals', type: 'Signals', regionId: 'links' }
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

export default GalleryPreset;
