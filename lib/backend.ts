import { createClient } from '@supabase/supabase-js';
import { JamDoc, JamStatus, JamMedia, LeaderboardDoc, LeaderboardItem } from '../types';
import { jamLocalStore } from './jamLocalStore';

// Initialize Supabase (Fail-safe)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Helper: Fail-open wrapper
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

    /**
     * Create or update a jam draft.
     */
    upsertDraft: async (draft: Partial<JamDoc> & { websiteUrl: string, jamId?: string, source?: 'manual' | 'scrape' }): Promise<JamDoc> => {
        return safeInvoke('jam-upsert-draft', draft, async () => {
            // FALBACK: Mimic success locally
            console.log('[Backend] Fallback: Simulating upsertDraft');
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
                media: draft.media || { imageUrls: [] },
                stats: { upvotes: 0, views: 0, bookmarks: 0, commentsCount: 0 },
                rank: { scoreTrending: 0, scoreRevenue: 0, scoreNewest: 0 },
                vibeTools: draft.vibeTools || [],
                techStack: draft.techStack || [],
                mrrBucket: draft.mrrBucket || 'pre_revenue',
                mrrVisibility: draft.mrrVisibility || 'hidden',
                ...draft // Spread remaining
            } as JamDoc;

            // If publishing, save to local store
            if (draft.status === 'published') {
                // Map to JamPublished manually since types might differ slightly
                const published = {
                    ...mockJam,
                    slug: mockJam.name.toLowerCase().replace(/\s+/g, '-'),
                    publishedAt: Date.now(),
                    status: 'published' as const,
                    // Required legacy props for JamPublished
                    screenshot: mockJam.media.heroImageUrl || '',
                    mediaType: 'image' as const,
                    thumbnailUrl: mockJam.media.heroImageUrl || '',
                    icon: mockJam.media.faviconUrl || '',
                    stack: mockJam.techStack,
                    // map stats
                    stats: {
                        revenue: mockJam.mrrBucket,
                        isRevenuePublic: mockJam.mrrVisibility === 'public',
                        growth: '+0%', // Mock
                        rank: 0,
                        upvotes: 0,
                        daysLive: 0,
                        views: 0
                    },
                    creator: {
                        name: 'Local User',
                        avatar: '',
                        type: mockJam.teamType === 'team' ? 'Team' : 'Solo Founder',
                        handle: 'localuser'
                    }
                };
                jamLocalStore.savePublished(published);
            }
            return mockJam;
        });
    },

    /**
     * Scrape URL metadata.
     * Enforced client-side timeout of 6s to be safe (Edge func has 5s).
     */
    scrapeUrl: async (websiteUrl: string, jamId?: string): Promise<{ extraction: Partial<JamDoc>, jam?: JamDoc }> => {
        // Client-side Abort for extra safety
        return new Promise(async (resolve) => {
            const timeout = setTimeout(() => {
                console.warn('[Backend] Scrape client timeout. Returning empty.');
                resolve({ extraction: {} });
            }, 6000);

            try {
                const result = await safeInvoke<{ extraction: any, jam: any }>('scrape', { websiteUrl, jamId, mode: 'fill_if_empty' }, async () => {
                    // Fallback: Empty extraction
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

    /**
     * Signal a view.
     */
    signalView: async (jamId: string, sessionId?: string): Promise<void> => {
        // Fire and forget, but we use safeInvoke if we care about errors.
        // Here we just want to trigger it.
        if (supabase) {
            supabase.functions.invoke('view-signal', { body: { jamId, sessionId } }).catch(e => console.error(e));
        }
    },

    /**
     * Toggle Upvote.
     */
    toggleUpvote: async (jamId: string): Promise<{ stats: any, isUpvoted: boolean }> => {
        return safeInvoke('upvote-toggle', { jamId }, async () => {
            // Fallback: Toggle local state fake
            // We can't know true state, so just return dummy
            return { stats: { upvotes: 99 }, isUpvoted: false };
        });
    },

    /**
     * Toggle Bookmark.
     */
    toggleBookmark: async (jamId: string): Promise<{ stats: any, isBookmarked: boolean }> => {
        return safeInvoke('bookmark-toggle', { jamId }, async () => {
            return { stats: { bookmarks: 99 }, isBookmarked: false };
        });
    },

    /**
     * Get Leaderboard.
     */
    getLeaderboard: async (scope: string): Promise<LeaderboardDoc | null> => {
        // We can query table directly or via function if dynamic.
        // Prompt said "recompute-leaderboards" generates it. 
        // So we should query the "leaderboards" table here.
        if (!supabase) return null;

        try {
            const { data, error } = await supabase
                .from('leaderboards')
                .select('*')
                .eq('scope', scope)
                .single();

            if (error) throw error;

            return {
                scope: data.scope,
                generatedAt: data.generated_at,
                window: data.time_window || { label: 'Today', from: '', to: '' },
                items: data.items || []
            } as LeaderboardDoc;

        } catch (e) {
            console.error('[Backend] Failed to fetch leaderboard', e);
            return null;
        }
    },

    /**
     * Publish a jam.
     * Transitions status to 'published' and returns the final jam doc.
     */
    publishJam: async (params: { jamId: string, patch: Partial<JamDoc> }): Promise<JamDoc & { slug: string }> => {
        const { jamId, patch } = params;
        const payload = { ...patch, status: 'published' };

        return safeInvoke('jam-upsert-draft', { jamId, patch: payload, source: 'manual' }, async () => {
            // FALLBACK: Local simulation
            console.log('[Backend] Fallback: Simulating publishJam');

            // Re-use logic from upsertDraft fallback or just construct here
            // distinct enough to warrant its own mock for clarity
            const mockPublished: JamDoc = {
                id: jamId,
                creatorId: 'local-user',
                status: 'published',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                websiteUrl: patch.websiteUrl || '', // Should be in patch
                name: patch.name || 'Untitled',
                tagline: patch.tagline || '',
                description: patch.description || '',
                category: patch.category || 'SaaS',
                teamType: patch.teamType || 'solo',
                media: patch.media || { imageUrls: [] },
                stats: { upvotes: 0, views: 0, bookmarks: 0, commentsCount: 0 },
                rank: { scoreTrending: 0, scoreRevenue: 0, scoreNewest: 0 },
                vibeTools: patch.vibeTools || [],
                techStack: patch.techStack || [],
                mrrBucket: patch.mrrBucket || 'pre_revenue',
                mrrVisibility: patch.mrrVisibility || 'hidden',
                ...patch // spread any other overrides
            } as JamDoc;

            // Save to local store for hybrid continuity
            const publishedForStore = {
                ...mockPublished,
                slug: mockPublished.name.toLowerCase().replace(/\s+/g, '-'),
                publishedAt: Date.now(),
                mediaType: 'image' as const,
                thumbnailUrl: mockPublished.media.heroImageUrl || '',
                screenshot: mockPublished.media.heroImageUrl || '',
                icon: mockPublished.media.faviconUrl || '✨',
                stack: mockPublished.techStack,
                stats: {
                    revenue: mockPublished.mrrBucket,
                    isRevenuePublic: mockPublished.mrrVisibility === 'public',
                    growth: '+0%', rank: 99, upvotes: 0, daysLive: 0, views: 0, bookmarks: 0
                },
                creator: {
                    name: 'You',
                    avatar: '',
                    type: 'Solo Founder',
                    handle: '@you'
                }
            };
            jamLocalStore.savePublished(publishedForStore as any);

            return { ...mockPublished, slug: publishedForStore.slug };
        });
    },

    /**
     * Get a specific Jam.
     */
    getJam: async (jamId: string): Promise<{ jam: JamDoc | null; source: "supabase" | "local"; error?: string }> => {
        return safeInvoke('jam-get', { jamId }, async () => {
            const local = jamLocalStore.get(jamId);
            return { jam: local || null, source: 'local' };
        }).then(res => {
            // safeInvoke returns the raw data from function, which might just be the jam object
            // If the function returns { jam, source }, great. If not, wrap it.
            // Assumption based on prompt: checking if it's the wrapper or raw.
            // Adjusting strictness: safeInvoke returns T. The fallback returns { jam, source }.
            // So the edge function should return { jam, source } too.
            return res as { jam: JamDoc | null; source: "supabase" | "local"; error?: string };
        });
    },

    /**
     * Get Latest Draft.
     */
    getMyLatestDraft: async (): Promise<{ jam: JamDoc | null; source: "supabase" | "local"; error?: string }> => {
        return safeInvoke('jam-latest-draft', {}, async () => {
            const lastId = localStorage.getItem("vj_last_draft_id");
            if (lastId) {
                const local = jamLocalStore.get(lastId);
                // Return even if status!=draft? Prompt implies we want resume capability.
                return { jam: local || null, source: 'local' };
            }
            return { jam: null, source: 'local' };
        });
    },

    /**
     * List Published Jams (Feed).
     */
    listPublishedJams: async (params: { sort: "trending" | "new" | "revenue" | "picks"; filters?: any }): Promise<{ jams: JamDoc[]; source: "supabase" | "local"; error?: string }> => {
        return safeInvoke('jams-list', params, async () => {
            // Fallback: Read local published jams
            // Since we don't have a specific "list" API in jamLocalStore for all published,
            // we might rely on what we have. 
            // But actually, jamLocalStore *is* a key-value store. 
            // We can only retrieve what we know by ID, unless we scan localStorage keys?
            // For fail-open demo, maybe just return empty or a hardcoded mock set if MOCK_APPS is unavailable?
            // Better: Parse 'vj_published_jams_index' if we decided to persist a list.
            // Given constraint "No crashes", empty array is safe.
            // OR: We can import MOCK_APPS if strictly needed, but let's stick to localStorage for "user generated"
            return { jams: [], source: 'local' };
        });
    },

    /**
     * Get Leaderboard Snapshot.
     */
    getLeaderboardSnapshot: async (kind: string): Promise<{ rows: any[]; source: "supabase" | "local"; error?: string }> => {
        return safeInvoke('leaderboard-snapshot', { kind }, async () => {
            try {
                const cached = localStorage.getItem(`vj_leaderboard_${kind}`);
                return { rows: cached ? JSON.parse(cached) : [], source: 'local' };
            } catch {
                return { rows: [], source: 'local' };
            }
        });
    },

    /**
     * List My Bookmarks.
     */
    listMyBookmarks: async (): Promise<{ jams: JamDoc[]; source: "supabase" | "local"; error?: string }> => {
        return safeInvoke('bookmarks-list', {}, async () => {
            // Fallback: use existing localStorage key (handled in hook mostly, but here for completeness)
            try {
                const raw = localStorage.getItem('vj_bookmarks_v1'); // referencing useBookmarks.ts key
                const items = raw ? JSON.parse(raw) : [];
                // Transform to JamDoc if necessary or return specific shape
                // The interface expects JamDoc[]. valid bookmark items are subset.
                return { jams: items as any[], source: 'local' };
            } catch {
                return { jams: [], source: 'local' };
            }
        });
    },

    /**
     * Get private creator insights.
     */
    getCreatorInsights: async (): Promise<{ summary: any; jams: any[]; source: "supabase" | "local" }> => {
        return safeInvoke('get-creator-insights', {}, async () => {
            return {
                summary: { totalJams: 0, totalViews: 0, totalUpvotes: 0, totalBookmarks: 0 },
                jams: [],
                source: 'local'
            };
        });
    },

    /**
     * Check if user is eligible for monetization (plumbing).
     */
    checkMonetizationEligibility: async (): Promise<{ eligible: boolean; stage: string; source: "supabase" | "local" }> => {
        if (!supabase) return { eligible: false, stage: 'none', source: 'local' };
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { eligible: false, stage: 'none', source: 'local' };
            const { data, error } = await supabase.from('profiles').select('monetization_status').eq('id', user.id).single();
            if (error) throw error;
            return {
                eligible: data.monetization_status?.eligible || false,
                stage: data.monetization_status?.pipeline_stage || 'none',
                source: 'supabase'
            };
        } catch (e) {
            return { eligible: false, stage: 'none', source: 'local' };
        }
    },

    /**
     * Report a Jam (Governance hook).
     */
    reportJam: async (jamId: string, reason: string): Promise<{ ok: boolean }> => {
        // This could call a function or just log locally in demo
        if (supabase) {
            const { error } = await supabase.from('moderation_flags').insert({ jam_id: jamId, reason, severity: 'medium' });
            return { ok: !error };
        }
        console.log(`[Governance] Local report for jam ${jamId}: ${reason}`);
        return { ok: true };
    },

    // ============ PHASE 5: BILLING & ENTITLEMENTS ============

    /**
     * Get current user's entitlements (fail-open: returns empty array).
     */
    getMyEntitlements: async (): Promise<{ key: string; expiresAt: string | null }[]> => {
        if (!supabase) return [];
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            const { data, error } = await supabase
                .from('entitlements')
                .select('entitlement_key, expires_at')
                .eq('user_id', user.id);
            if (error) throw error;
            return (data || []).map((e: any) => ({
                key: e.entitlement_key,
                expiresAt: e.expires_at
            }));
        } catch (e) {
            console.error('[Backend] getMyEntitlements failed:', e);
            return [];
        }
    },

    /**
     * Check if user has a specific entitlement (fail-open: returns false).
     */
    hasEntitlement: async (key: string): Promise<boolean> => {
        if (!supabase) return false;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('entitlements')
                .select('id')
                .eq('user_id', user.id)
                .eq('entitlement_key', key)
                .or(`expires_at.is.null,expires_at.gt.${now}`)
                .maybeSingle();
            if (error) throw error;
            return !!data;
        } catch (e) {
            console.error('[Backend] hasEntitlement failed:', e);
            return false;
        }
    },

    /**
     * List current user's subscriptions (fail-open: returns empty array).
     */
    listMySubscriptions: async (): Promise<{ id: string; planId: string; status: string; periodEnd: string | null }[]> => {
        if (!supabase) return [];
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            const { data, error } = await supabase
                .from('subscriptions')
                .select('id, plan_id, status, current_period_end')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []).map((s: any) => ({
                id: s.id,
                planId: s.plan_id,
                status: s.status,
                periodEnd: s.current_period_end
            }));
        } catch (e) {
            console.error('[Backend] listMySubscriptions failed:', e);
            return [];
        }
    },

    /**
     * Create a subscription (calls Edge Function).
     */
    createSubscription: async (planId: string): Promise<{ ok: boolean; subscription?: any; error?: string }> => {
        return safeInvoke('subscription-create', { planId }, () => ({
            ok: false,
            error: 'BILLING_UNAVAILABLE'
        }));
    },

    /**
     * Cancel a subscription (calls Edge Function).
     */
    cancelSubscription: async (subscriptionId: string): Promise<{ ok: boolean; error?: string }> => {
        return safeInvoke('subscription-cancel', { subscriptionId }, () => ({
            ok: false,
            error: 'BILLING_UNAVAILABLE'
        }));
    },

    /**
     * Create a paid exposure / boost (calls Edge Function).
     */
    createPaidExposure: async (jamId: string, exposureType: string, durationHours: number): Promise<{ ok: boolean; exposure?: any; payment?: any; error?: string }> => {
        return safeInvoke('paid-exposure-create', { jamId, exposureType, durationHours }, () => ({
            ok: false,
            error: 'BILLING_UNAVAILABLE'
        }));
    }

};
