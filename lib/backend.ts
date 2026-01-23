
import { createClient } from '@supabase/supabase-js';
import { JamDoc, JamStatus, LeaderboardDoc } from '../types';
import { jamLocalStore } from './jamLocalStore';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

async function safeInvoke<T>(functionName: string, body: any, fallback: () => Promise<T> | T): Promise<T> {
    if (!supabase) {
        console.warn(`[Backend] Supabase not configured. Using fallback for ${functionName}.`);
        return fallback();
    }
    try {
        const { data, error } = await supabase.functions.invoke(functionName, { body });
        if (error) throw error;
        return data as T;
    } catch (err) {
        console.error(`[Backend] Call to ${functionName} failed:`, err);
        return fallback();
    }
}

export const backend = {
    upsertDraft: async (draft: Partial<JamDoc> & { websiteUrl: string, jamId?: string, source?: 'manual' | 'scrape' }): Promise<JamDoc> => {
        return safeInvoke('jam-upsert-draft', draft, async () => {
            const mockJam: JamDoc = {
                id: draft.jamId || `local-${Date.now()}`,
                creatorId: 'local-user',
                status: (draft.status as JamStatus) || 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                websiteUrl: draft.websiteUrl,
                name: draft.name || 'Untitled Jam',
                tagline: draft.tagline || '',
                description: draft.description || '',
                category: draft.category || 'Tech',
                teamType: draft.teamType || 'solo',
                media: draft.media || { imageUrls: [], heroImageUrl: '' },
                stats: { upvotes: 0, views: 0, bookmarks: 0, commentsCount: 0 },
                rank: { scoreTrending: 0, scoreRevenue: 0, scoreNewest: 0 },
                vibeTools: draft.vibeTools || [],
                techStack: draft.techStack || [],
                mrrBucket: draft.mrrBucket || 'pre_revenue',
                mrrVisibility: draft.mrrVisibility || 'hidden',
                ...draft
            } as JamDoc;
            return mockJam;
        });
    },

    scrapeUrl: async (websiteUrl: string, jamId?: string): Promise<{ extraction: Partial<JamDoc>, jam?: JamDoc }> => {
        return new Promise(async (resolve) => {
            const timeout = setTimeout(() => {
                resolve({ extraction: {} });
            }, 6000);
            try {
                const result = await safeInvoke<{ extraction: any, jam: any }>('scrape', { websiteUrl, jamId, mode: 'fill_if_empty' }, async () => {
                    return { extraction: {}, jam: undefined };
                });
                clearTimeout(timeout);
                resolve(result);
            } catch (e) {
                clearTimeout(timeout);
                resolve({ extraction: {} });
            }
        });
    },

    toggleBookmark: async (jamId: string): Promise<{ stats: any, isBookmarked: boolean }> => {
        return safeInvoke('bookmark-toggle', { jamId }, async () => {
            return { stats: { bookmarks: 0 }, isBookmarked: false };
        });
    },

    publishJam: async (params: { jamId: string, patch: Partial<JamDoc> }): Promise<JamDoc & { slug: string }> => {
        const { jamId, patch } = params;
        const payload = { ...patch, status: 'published' };
        return safeInvoke('jam-upsert-draft', { jamId, patch: payload, source: 'manual' }, async () => {
            const mockPublished: JamDoc = {
                id: jamId,
                creatorId: 'local-user',
                status: 'published',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                websiteUrl: patch.websiteUrl || '',
                name: patch.name || 'Untitled',
                tagline: patch.tagline || '',
                description: patch.description || '',
                category: patch.category || 'SaaS',
                teamType: patch.teamType || 'solo',
                media: patch.media || { imageUrls: [], heroImageUrl: '' },
                stats: { upvotes: 0, views: 0, bookmarks: 0, commentsCount: 0 },
                rank: { scoreTrending: 0, scoreRevenue: 0, scoreNewest: 0 },
                vibeTools: patch.vibeTools || [],
                techStack: patch.techStack || [],
                mrrBucket: patch.mrrBucket || 'pre_revenue',
                mrrVisibility: patch.mrrVisibility || 'hidden',
                ...patch
            } as JamDoc;
            return { ...mockPublished, slug: mockPublished.name.toLowerCase().replace(/\s+/g, '-') };
        });
    },

    getMyLatestDraft: async (): Promise<{ jam: JamDoc | null; source: "supabase" | "local"; error?: string }> => {
        return safeInvoke('jam-latest-draft', {}, async () => {
            const lastId = localStorage.getItem("vj_last_draft_id");
            if (lastId) {
                const local = jamLocalStore.get(lastId);
                return { jam: local || null, source: 'local' };
            }
            return { jam: null, source: 'local' };
        });
    },

    listPublishedJams: async (params: { sort: "trending" | "new" | "revenue" | "picks"; filters?: any }): Promise<{ jams: JamDoc[]; source: "supabase" | "local"; error?: string }> => {
        return safeInvoke('jams-list', params, async () => {
            return { jams: [], source: 'local' };
        });
    },

    listMyBookmarks: async (): Promise<{ jams: JamDoc[]; source: "supabase" | "local"; error?: string }> => {
        return safeInvoke('bookmarks-list', {}, async () => {
            try {
                const raw = localStorage.getItem('vj_bookmarks_v1');
                const items = raw ? JSON.parse(raw) : [];
                return { jams: items as any[], source: 'local' };
            } catch {
                return { jams: [], source: 'local' };
            }
        });
    }
};
