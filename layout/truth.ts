import { AppProject } from '../types';

export type TruthBlockType =
  | 'Hero'
  | 'Identity'
  | 'Proof'
  | 'Metrics'
  | 'Links'
  | 'Timeline'
  | 'Signals'
  | 'Actions';

export interface TruthBlockBase<T extends TruthBlockType, P> {
  type: T;
  props: P;
}

export type TruthHero = TruthBlockBase<'Hero', {
  title: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  daysLive?: number;
}>;

export type TruthIdentity = TruthBlockBase<'Identity', {
  name: string;
  handle?: string;
  avatarUrl?: string;
}>;

export type TruthProof = TruthBlockBase<'Proof', {
  proofUrl?: string;
}>;

export type TruthMetrics = TruthBlockBase<'Metrics', {
  growth?: string;
  revenue?: string;
  followers?: number | null;
}>;

export type TruthLinks = TruthBlockBase<'Links', {
  websiteUrl?: string;
}>;

export type TruthTimeline = TruthBlockBase<'Timeline', {
  milestones: { date: string; label: string }[];
}>;

export type TruthSignals = TruthBlockBase<'Signals', {
  jamId: string;
}>;

export type TruthActions = TruthBlockBase<'Actions', {
  jamId: string;
}>;

export type TruthBlocks = {
  Hero: TruthHero;
  Identity: TruthIdentity;
  Proof: TruthProof;
  Metrics: TruthMetrics;
  Links: TruthLinks;
  Timeline: TruthTimeline;
  Signals: TruthSignals;
  Actions: TruthActions;
};

export const createTruthModel = (jam: AppProject): TruthBlocks => {
  return {
    Hero: {
      type: 'Hero',
      props: {
        title: jam.name,
        description: jam.description,
        imageUrl: jam.screenshot,
        category: jam.category,
        daysLive: jam.stats?.daysLive
      }
    },
    Identity: {
      type: 'Identity',
      props: {
        name: jam.creator?.name || 'Maker',
        handle: jam.creator?.handle,
        avatarUrl: jam.creator?.avatar
      }
    },
    Proof: {
      type: 'Proof',
      props: {
        proofUrl: jam.proofUrl
      }
    },
    Metrics: {
      type: 'Metrics',
      props: {
        growth: jam.stats?.growth,
        revenue: jam.stats?.revenue
      }
    },
    Links: {
      type: 'Links',
      props: {
        websiteUrl: jam.websiteUrl
      }
    },
    Timeline: {
      type: 'Timeline',
      props: {
        milestones: jam.milestones || []
      }
    },
    Signals: {
      type: 'Signals',
      props: {
        jamId: jam.id
      }
    },
    Actions: {
      type: 'Actions',
      props: {
        jamId: jam.id
      }
    }
  };
};
