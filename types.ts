

export type BadgeType = 'founding_creator' | 'founding_member' | 'early_access' | 'breakout_creator' | 'consistent_shipper' | 'revenue_leader' | 'cult_favorite' | 'top_curator' | 'community_builder' | 'insider';

export interface TrustFlags {
  verified: boolean;
  consistent: boolean;
  revenue_verified: boolean;
  community_trusted: boolean;
}

export interface MonetizationStatus {
  eligible: boolean;
  pipeline_stage: 'none' | 'pending' | 'verified' | 'active';
}

export interface Badge {
  type: BadgeType;
  label: string;
  description: string;
}

// Legacy AppProject for compatibility, adapting to new schema where possible
export interface AppProject {
  id: string;
  name: string;
  description: string; // Mapped from tagline or description
  category: string;
  icon?: string; // Mapped from faviconUrl or derived
  screenshot: string; // Mapped from heroImageUrl
  mediaType: 'image' | 'video';
  thumbnailUrl: string; // Mapped from heroImageUrl
  stats: {
    revenue: string; // Mapped from mrrBucket
    isRevenuePublic: boolean;
    growth: string; // Placeholder
    rank: number; // Mapped from rank.scoreTrending
    upvotes: number;
    daysLive: number; // Derived from publishedAt
    views?: number;
    bookmarks?: number;
  };
  creator: {
    name: string;
    avatar: string;
    color?: string;
    type: 'Solo Founder' | 'Team'; // Mapped from TeamType
    handle: string;
    badges?: Badge[];
    trust_flags?: TrustFlags;
    monetization_status?: MonetizationStatus;
  };
  stack: string[]; // Mapped from techStack
  vibeTools: string[];
  milestones?: { date: string; label: string }[];

  // New fields for direct access if needed
  websiteUrl?: string;
  status?: JamStatus;
}

export enum VibeColor {
  Blue = '#3b82f6',
  Red = '#f43f5e',
  Yellow = '#facc15',
  Green = '#22c55e',
  Purple = '#a855f7'
}

// --- NEW FIREBASE SCHEMA TYPES ---

export type JamStatus = "draft" | "published";
export type TeamType = "solo" | "team";
export type MrrVisibility = "public" | "hidden";

export type JamMedia = {
  heroImageUrl?: string;
  imageUrls: string[];
  videoEmbedUrl?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  screenshotUrl?: string;
};

export type JamStats = {
  upvotes: number;
  views: number;
  bookmarks: number;
  commentsCount: number;
};

export type JamRank = {
  scoreTrending: number;
  scoreRevenue: number;
  scoreNewest: number;
};

export type JamDoc = {
  id: string; // Client-side convenience, not in DB doc
  creatorId: string;
  status: JamStatus;
  createdAt: string;   // ISO string on client
  updatedAt: string;
  publishedAt?: string;

  name: string;
  tagline: string;
  description?: string;

  category: string;
  teamType: TeamType;

  websiteUrl: string;
  appUrl?: string;

  socials?: {
    x?: string;
    github?: string;
    productHunt?: string;
  };

  vibeTools: string[];
  techStack: string[];

  mrrBucket: string;
  mrrValue?: number | null;
  mrrVisibility: MrrVisibility;

  media: JamMedia;
  stats: JamStats;
  rank: JamRank;
};

export type LeaderboardItem = {
  jamId: string;
  name: string;
  tagline: string;
  heroImageUrl?: string;

  creatorId: string;
  creatorName: string;
  creatorAvatarUrl: string;

  category: string;
  mrrBucket: string;
  upvotes: number;

  techStackTop: string[];
  vibeToolsTop: string[];
};

export type LeaderboardDoc = {
  scope: string;
  generatedAt: string;
  window: { label: string; from: string; to: string };
  items: LeaderboardItem[];
};

export type SignalType = "view" | "upvote" | "bookmark";
