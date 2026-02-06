import { SilenceState } from './deriveSilenceState';

export type SilenceFramingIntent = {
  densityReduction: 'none' | 'medium' | 'high';
  contrastSoftening: boolean;
  sectionBreathingRoom: 'normal' | 'expanded';
  timelineOpacityBias: 'normal' | 'muted';
};

export const SILENCE_FRAMING_MAP: Record<SilenceState, SilenceFramingIntent> = {
  pure: {
    densityReduction: 'high',
    contrastSoftening: true,
    sectionBreathingRoom: 'expanded',
    timelineOpacityBias: 'muted'
  },
  pause: {
    densityReduction: 'medium',
    contrastSoftening: true,
    sectionBreathingRoom: 'expanded',
    timelineOpacityBias: 'muted'
  },
  quiet_verified: {
    densityReduction: 'medium',
    contrastSoftening: false,
    sectionBreathingRoom: 'normal',
    timelineOpacityBias: 'muted'
  }
};
