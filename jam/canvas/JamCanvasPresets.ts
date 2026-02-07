import { JamCanvasPlan } from './JamCanvasPlan';

export const EDITORIAL_CANVAS: JamCanvasPlan = {
  id: 'editorial_canvas',
  label: 'Editorial Canvas',
  canvasMode: 'editorial',
  order: ['hero', 'narrative', 'proof', 'identity'],
  regions: {
    hero: {
      id: 'hero',
      placement: 'top',
      width: 'full',
      emphasis: 'dominant',
      stacking: 'normal'
    },
    narrative: {
      id: 'narrative',
      placement: 'center',
      width: 'full',
      emphasis: 'standard',
      stacking: 'normal'
    },
    proof: {
      id: 'proof',
      placement: 'bottom',
      width: 'medium',
      emphasis: 'standard',
      stacking: 'normal'
    },
    identity: {
      id: 'identity',
      placement: 'bottom',
      width: 'narrow',
      emphasis: 'minor',
      stacking: 'normal'
    }
  },
  spatialRules: {
    alignment: 'centered',
    overlap: 'none',
    density: 'balanced',
    breathingRoom: 'wide'
  }
};

export const POSTER_CANVAS: JamCanvasPlan = {
  id: 'poster_canvas',
  label: 'Poster Canvas',
  canvasMode: 'poster',
  order: ['hero', 'proof', 'identity', 'narrative'],
  regions: {
    hero: {
      id: 'hero',
      placement: 'center',
      width: 'full',
      emphasis: 'dominant',
      stacking: 'normal'
    },
    proof: {
      id: 'proof',
      placement: 'overlay',
      width: 'medium',
      emphasis: 'dominant',
      stacking: 'overlay'
    },
    identity: {
      id: 'identity',
      placement: 'side',
      width: 'narrow',
      emphasis: 'minor',
      stacking: 'normal'
    },
    narrative: {
      id: 'narrative',
      placement: 'bottom',
      width: 'full',
      emphasis: 'standard',
      stacking: 'normal'
    }
  },
  spatialRules: {
    alignment: 'asymmetric',
    overlap: 'allowed',
    density: 'compressed',
    breathingRoom: 'tight'
  }
};

export const PREMIUM_SAFE_CANVAS: JamCanvasPlan = {
  id: 'premium_safe_canvas',
  label: 'Premium Safe Canvas',
  canvasMode: 'manifesto',
  order: ['hero', 'proof', 'narrative', 'identity'],
  regions: {
    hero: {
      id: 'hero',
      placement: 'center',
      width: 'full',
      emphasis: 'dominant',
      stacking: 'normal'
    },
    proof: {
      id: 'proof',
      placement: 'center',
      width: 'medium',
      emphasis: 'standard',
      stacking: 'normal'
    },
    narrative: {
      id: 'narrative',
      placement: 'bottom',
      width: 'full',
      emphasis: 'standard',
      stacking: 'normal'
    },
    identity: {
      id: 'identity',
      placement: 'side',
      width: 'narrow',
      emphasis: 'minor',
      stacking: 'normal'
    }
  },
  spatialRules: {
    alignment: 'asymmetric',
    overlap: 'none',
    density: 'balanced',
    breathingRoom: 'normal'
  }
};
