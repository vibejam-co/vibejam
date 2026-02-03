import { AppProject } from '../types';
import { slugify } from './jamLocalStore';

// Helper to map JamDoc to AppProject
export const mapJamToAppProject = (jam: any): AppProject => {
  const mrrBucket = jam.mrrBucket || jam.mrr_bucket || '$0';
  const mrrVisibility = jam.mrrVisibility || jam.mrr_visibility || 'hidden';
  const teamType = jam.teamType || jam.team_type;
  const publishedAt = jam.publishedAt || jam.published_at;
  const creator = jam.creator;
  return ({
    id: jam.id,
    slug: jam.slug || (jam.name ? `${slugify(jam.name)}-${jam.id}` : jam.id),
    name: jam.name,
    description: jam.description || jam.tagline || '',
    category: jam.category,
    proofUrl: jam.socials?.proof_url || jam.socials?.proofUrl,
    icon: jam.media?.faviconUrl || '✨',
    screenshot: jam.media?.heroImageUrl || '',
    mediaType: 'image',
    thumbnailUrl: jam.media?.heroImageUrl || '',
    stats: {
      revenue: mrrBucket,
      isRevenuePublic: mrrVisibility === 'public',
      growth: '+0%',
      rank: jam.rank?.scoreTrending || 99,
      upvotes: jam.stats?.upvotes || 0,
      daysLive: publishedAt ? Math.floor((Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      views: jam.stats?.views || 0,
      bookmarks: jam.stats?.bookmarks || 0
    },
    creator: {
      name: creator?.display_name || 'Maker',
      avatar: creator?.avatar_url || '',
      type: teamType === 'team' ? 'Team' : 'Solo Founder',
      handle: creator?.handle || '',
      color: '#3b82f6'
    },
    stack: jam.techStack || jam.tech_stack || [],
    vibeTools: jam.vibeTools || jam.vibe_tools || [],
    websiteUrl: jam.websiteUrl || jam.website_url,
    status: jam.status
  });
};

export const getJamSlug = (project: AppProject) => (
  project.slug || (project.name ? `${slugify(project.name)}-${project.id}` : project.id)
);
