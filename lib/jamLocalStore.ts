import { AppProject, JamStatus } from '../types';
import { db } from './firebase';
import { collection, query, where, orderBy, limit as firestoreLimit, getDocs } from 'firebase/firestore';

export interface JamPublished extends AppProject {
  slug: string;
  publishedAt: number;
  status: 'published';
}

const PUBLISHED_KEY = 'vj_startjam_published_v2';

export const jamLocalStore = {
  savePublished: (jam: JamPublished): void => {
    try {
      const existing = jamLocalStore.listLocalOnly();
      existing.unshift(jam);
      localStorage.setItem(PUBLISHED_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error("Failed to save jam locally", e);
    }
  },

  listLocalOnly: (): JamPublished[] => {
    try {
      const data = localStorage.getItem(PUBLISHED_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  get: (id: string): any | null => {
    try {
      // 1. Check Published
      const published = jamLocalStore.listLocalOnly();
      const found = published.find((j: any) => j.id === id);
      if (found) return found;

      // 2. Check Draft
      const draftRaw = localStorage.getItem('vj_draft_jam');
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft.id === id) return draft;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Unified hybrid fetcher for v1
   * Merges Firestore results with localStorage drafts/published jams.
   */
  listAll: async (limit = 20): Promise<JamPublished[]> => {
    let remoteJams: JamPublished[] = [];

    // Check if Firebase is configured (API Key present)
    const isConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

    if (isConfigured) {
      try {
        const q = query(
          collection(db, "jams"),
          where("status", "==", "published"),
          orderBy("publishedAt", "desc"), // Ensure index exists or use createdAt
          firestoreLimit(limit)
        );

        const snapshot = await getDocs(q);
        remoteJams = snapshot.docs.map(doc => mapDocToJam(doc.id, doc.data()));

      } catch (e) {
        console.warn("VJ: Failed to fetch remote jams, using local only.", e);
      }
    }

    const localJams = jamLocalStore.listLocalOnly();
    // Unique merge by ID, prioritizing local for the current user's session mechanism
    // (In reality, remote should probably win for published, but local for instant optimistic updates)
    const combined = [...localJams, ...remoteJams];
    const seen = new Set();
    return combined.filter(j => {
      const duplicate = seen.has(j.id);
      seen.add(j.id);
      return !duplicate;
    });
  }
};

/**
 * Mapping helper for Firestore schema to VibeJam types
 */
function mapDocToJam(id: string, data: any): JamPublished {
  return {
    id: id,
    // Use stored slug or fallback to ID/Name derived
    slug: data.slug || slugify(data.name || 'untitled'),
    name: data.name || 'Untitled Jam',
    description: data.tagline || data.description || '',
    category: data.category || 'Uncategorized',
    // Media mapping
    screenshot: data.media?.heroImageUrl || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200',
    mediaType: 'image', // Default for now
    thumbnailUrl: data.media?.heroImageUrl || '',
    icon: data.media?.faviconUrl || '',

    stats: {
      revenue: data.mrrBucket || '$0',
      isRevenuePublic: data.mrrVisibility === 'public',
      growth: '+0%',
      rank: data.rank?.scoreTrending || 99,
      upvotes: data.stats?.upvotes || 0,
      daysLive: 0, // Calculate relative time if needed
      views: data.stats?.views || 0,
      bookmarks: data.stats?.bookmarks || 0
    },

    creator: {
      name: 'Creator', // This data is ideally denormalized or fetched via creatorId. MVP: Placeholder or partial data if stored
      avatar: 'https://picsum.photos/seed/vj/100',
      type: data.teamType === 'team' ? 'Team' : 'Solo Founder',
      handle: '@unknown', // Need to join user or store denormalized
      // If we decide to denormalize creator info on the jam doc (recommended for read-heavy), map it here.
      // For now, let's assume we might update the schema to include creator snapshot
    },

    stack: data.techStack || [],
    vibeTools: data.vibeTools || [],
    publishedAt: data.publishedAt ? (data.publishedAt.toMillis ? data.publishedAt.toMillis() : new Date(data.publishedAt).getTime()) : Date.now(),
    status: 'published',
    websiteUrl: data.websiteUrl
  };
}

export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};
