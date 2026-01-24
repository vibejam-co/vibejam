import { createClient } from '@supabase/supabase-js';
import { JamDoc, JamStatus, JamMedia, LeaderboardDoc, LeaderboardItem } from '../types';
import { jamLocalStore } from './jamLocalStore';

// Initialize Supabase (Fail-safe)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;


// ============ PHASE 6: HARDENING & OBSERVABILITY ============

/**
 * Ensures a promise resolves within a strictly bounded time.
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 6000): Promise<T> {
    let timer: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Sanitizes errors to prevent exposing backend internals to the client.
 */
function normalizeError(err: any): { code: string; message: string } {
    console.error('[Backend] Internal Error:', err);
    if (err.message === 'TIMEOUT') return { code: 'SERVER_TIMEOUT', message: 'Backend is taking too long to respond.' };
    if (err.message === 'Unauthorized' || err.status === 401) return { code: 'UNAUTHORIZED', message: 'Session expired or invalid.' };
    return { code: 'INTERNAL_ERROR', message: 'An unexpected backend error occurred.' };
}

/**
 * Fires an event to the observability log without blocking.
 */
function logEventSafe(eventType: string, level: 'info' | 'warn' | 'error' = 'info', meta: any = {}) {
    if (!supabase) return;
    // Fire and forget
    supabase.functions.invoke('log-event', {
        body: { level, eventType, meta: { ...meta, url: window.location.href } }
    }).catch(() => { });
}

// Helper: Fail-open wrapper with Hardening
async function safeInvoke<T>(functionName: string, body: any, fallback: () => Promise<T> | T): Promise<T> {
    if (!supabase) {
        logEventSafe('fallback_local', 'info', { functionName });
        return fallback();
    }
    try {
        const { data, error } = await withTimeout(supabase.functions.invoke(functionName, { body }));
        if (error) throw error;
        return data as T;
    } catch (err) {
        logEventSafe('invoke_fail', 'warn', { functionName, error: err.message });
        return fallback();
    }
}

export const backend = {

    /**
     * Create or update a jam draft.
     */
    upsertDraft: async (draft: Partial<JamDoc> & { websiteUrl: string, jamId?: string, source?: 'manual' | 'scrape' }): Promise<JamDoc> => {
        return safeInvoke('jam-upsert-draft', draft, async () => {
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
                media: draft.media || { heroImageUrl: '', faviconUrl: '', imageUrls: [] },
                stats: { upvotes: 0, views: 0, bookmarks: 0, commentsCount: 0 },
                rank: { scoreTrending: 0, scoreRevenue: 0, scoreNewest: 0 },
                vibeTools: draft.vibeTools || [],
                techStack: draft.techStack || [],
                mrrBucket: draft.mrrBucket || 'pre_revenue',
                mrrVisibility: draft.mrrVisibility || 'hidden',
                ...draft
            } as JamDoc;

            if (draft.status === 'published') {
                const published = {
                    ...mockJam,
                    slug: mockJam.name.toLowerCase().replace(/\s+/g, '-'),
                    publishedAt: Date.now(),
                    status: 'published' as const,
                    screenshot: mockJam.media.heroImageUrl || '',
                    mediaType: 'image' as const,
                    thumbnailUrl: mockJam.media.heroImageUrl || '',
                    icon: mockJam.media.faviconUrl || '',
                    stack: mockJam.techStack,
                    stats: {
                        revenue: mockJam.mrrBucket,
                        isRevenuePublic: mockJam.mrrVisibility === 'public',
                        growth: '+0%', rank: 0, upvotes: 0, daysLive: 0, views: 0, bookmarks: 0
                    },
                    creator: {
                        name: 'Local User',
                        avatar: '',
                        type: mockJam.teamType === 'team' ? 'Team' : 'Solo Founder',
                        handle: 'localuser'
                    }
                };
                jamLocalStore.savePublished(published as any);
            }
            return mockJam;
        });
    },

    /**
     * Scrape URL metadata.
     */
    scrapeUrl: async (websiteUrl: string, jamId?: string): Promise<{ extraction: Partial<JamDoc>, jam?: JamDoc; ok: boolean; error?: string }> => {
        try {
            const result = await safeInvoke<{ extraction: any, jam: any, ok: boolean, error?: string }>('scrape', { websiteUrl, jamId }, async () => {
                return { extraction: {}, jam: undefined, ok: false, error: 'BACKEND_OFFLINE' };
            });
            return result;
        } catch (e) {
            const err = normalizeError(e);
            return { extraction: {}, ok: false, error: err.code };
        }
    },

    /**
     * Signal a view.
     */
    signalView: async (jamId: string, sessionId?: string): Promise<void> => {
        if (!supabase) return;
        try {
            await withTimeout(supabase.functions.invoke('view-signal', { body: { jamId, sessionId } }));
        } catch (e) {
            console.warn('[Backend] signalView failed silently:', e.message);
        }
    },

    /**
     * Toggle Upvote.
     */
    toggleUpvote: async (jamId: string): Promise<{ ok: boolean; stats: any, isUpvoted: boolean; error?: string }> => {
        return safeInvoke<{ ok: boolean; stats: any, isUpvoted: boolean; error?: string }>('upvote-toggle', { jamId }, async () => {
            return { ok: true, stats: { upvotes: 0 }, isUpvoted: false };
        });
    },

    /**
     * Toggle Bookmark.
     */
    toggleBookmark: async (jamId: string): Promise<{ ok: boolean; stats: any, isBookmarked: boolean; error?: string }> => {
        return safeInvoke<{ ok: boolean; stats: any, isBookmarked: boolean; error?: string }>('bookmark-toggle', { jamId }, async () => {
            return { ok: true, stats: { bookmarks: 0 }, isBookmarked: false };
        });
    },

    /**
     * Get Leaderboard.
     */
    getLeaderboard: async (scope: string): Promise<LeaderboardDoc | null> => {
        if (!supabase) return null;
        try {
            const query = supabase.from('leaderboards').select('*').eq('scope', scope).maybeSingle();
            const { data, error } = await withTimeout(Promise.resolve(query));
            if (error || !data) return null;
            return {
                scope: data.scope,
                generatedAt: data.generated_at,
                window: data.time_window || { label: 'Today', from: '', to: '' },
                items: data.items || []
            } as LeaderboardDoc;
        } catch (e) {
            return null;
        }
    },

    /**
     * Search Jams using Full-text Search.
     */
    searchJams: async (q: string, limit: number = 20): Promise<{ ok: boolean; items: any[]; errorCode?: string }> => {
        return safeInvoke<any>('search-jams', { q, limit }, async () => {
            // Local Fallback: Basic string match
            const allLocal = jamLocalStore.listLocalOnly();
            const query = q.toLowerCase();
            const matched = allLocal.filter(j =>
                j.name.toLowerCase().includes(query) ||
                j.description.toLowerCase().includes(query) ||
                j.category.toLowerCase().includes(query)
            ).slice(0, limit);

            return { ok: true, items: matched };
        });
    },

    /**
     * Publish a jam.
     */
    publishJam: async (params: { jamId: string, patch: Partial<JamDoc> }): Promise<{ ok: boolean; jam?: JamDoc & { slug: string }; error?: string }> => {
        const { jamId, patch } = params;
        const payload = { ...patch, status: 'published' };

        try {
            const result = await safeInvoke<any>('jam-upsert-draft', { jamId, patch: payload }, async () => {
                return { ok: false, error: 'BACKEND_OFFLINE' };
            });
            if (result && result.ok && result.data) {
                return { ok: true, jam: { ...result.data, slug: result.data.name.toLowerCase().replace(/\s+/g, '-') } };
            }
            return { ok: false, error: result?.error || 'PUBLISH_FAILED' };
        } catch (e) {
            return { ok: false, error: normalizeError(e).code };
        }
    },

    /**
     * Get a specific Jam.
     */
    getJam: async (jamId: string): Promise<{ jam: JamDoc | null; source: "supabase" | "local"; ok: boolean; error?: string }> => {
        try {
            const result = await safeInvoke<any>('jam-get', { jamId }, async () => {
                const local = jamLocalStore.get(jamId);
                return { jam: local || null, source: 'local' as const, ok: true };
            });
            return { ...result, ok: true };
        } catch (e) {
            return { jam: null, source: 'local', ok: false, error: normalizeError(e).code };
        }
    },

    /**
     * Get Latest Draft.
     */
    getMyLatestDraft: async (): Promise<{ jam: JamDoc | null; source: "supabase" | "local"; ok: boolean }> => {
        return safeInvoke<{ jam: JamDoc | null, source: "supabase" | "local", ok: boolean }>('jam-latest-draft', {}, async () => {
            const lastId = localStorage.getItem("vj_last_draft_id");
            const local = lastId ? jamLocalStore.get(lastId) : null;
            return { jam: local || null, source: 'local' as const, ok: true };
        });
    },

    /**
     * List Published Jams (Feed).
     */
    listPublishedJams: async (params: { sort: "trending" | "new" | "revenue" | "picks"; filters?: any }): Promise<{ jams: JamDoc[]; source: "supabase" | "local"; ok: boolean }> => {
        return safeInvoke<{ jams: JamDoc[]; source: "supabase" | "local"; ok: boolean }>('jams-list', params, async () => {
            return { jams: [], source: 'local' as const, ok: true };
        });
    },

    /**
     * Get Leaderboard Snapshot.
     */
    getLeaderboardSnapshot: async (kind: string): Promise<{ rows: any[]; source: "supabase" | "local"; ok: boolean }> => {
        return safeInvoke<{ rows: any[]; source: "supabase" | "local"; ok: boolean }>('leaderboard-snapshot', { kind }, async () => {
            try {
                const cached = localStorage.getItem(`vj_leaderboard_${kind}`);
                return { rows: cached ? JSON.parse(cached) : [], source: 'local' as const, ok: true };
            } catch {
                return { rows: [], source: 'local' as const, ok: true };
            }
        });
    },

    /**
     * List My Bookmarks.
     */
    listMyBookmarks: async (): Promise<{ jams: JamDoc[]; source: "supabase" | "local"; ok: boolean }> => {
        return safeInvoke<{ jams: JamDoc[]; source: "supabase" | "local"; ok: boolean }>('bookmarks-list', {}, async () => {
            try {
                const raw = localStorage.getItem('vj_bookmarks_v1');
                const items = raw ? JSON.parse(raw) : [];
                return { jams: items as any[], source: 'local' as const, ok: true };
            } catch {
                return { jams: [], source: 'local' as const, ok: true };
            }
        });
    },

    /**
     * Get private creator insights.
     */
    getCreatorInsights: async (): Promise<{ summary: any; jams: any[]; source: "supabase" | "local"; ok: boolean }> => {
        return safeInvoke<{ summary: any; jams: any[]; source: "supabase" | "local"; ok: boolean }>('get-creator-insights', {}, async () => {
            return {
                summary: { totalJams: 0, totalViews: 0, totalUpvotes: 0, totalBookmarks: 0 },
                jams: [],
                source: 'local' as const,
                ok: true
            };
        });
    },

    /**
     * Check if user is eligible for monetization.
     */
    checkMonetizationEligibility: async (): Promise<{ eligible: boolean; stage: string; source: "supabase" | "local" }> => {
        if (!supabase) return { eligible: false, stage: 'none', source: 'local' };
        try {
            const { data } = await withTimeout(supabase.auth.getUser());
            const user = data?.user;
            if (!user) return { eligible: false, stage: 'none', source: 'local' };
            const { data: profile, error } = await supabase.from('profiles').select('monetization_status').eq('id', user.id).maybeSingle();
            if (error || !profile) return { eligible: false, stage: 'none', source: 'local' };
            return {
                eligible: (profile.monetization_status as any)?.eligible || false,
                stage: (profile.monetization_status as any)?.pipeline_stage || 'none',
                source: 'supabase'
            };
        } catch (e) {
            return { eligible: false, stage: 'none', source: 'local' };
        }
    },

    /**
     * Report a Jam (Governance).
     */
    reportJam: async (jamId: string, reason: string): Promise<{ ok: boolean }> => {
        if (supabase) {
            try {
                const query = supabase.from('moderation_flags').insert({ jam_id: jamId, reason });
                const { error } = await withTimeout(Promise.resolve(query));
                return { ok: !error };
            } catch (e) {
                return { ok: false };
            }
        }
        return { ok: true };
    },

    // ============ PHASE 5: BILLING & ENTITLEMENTS ============


    listMySubscriptions: async (): Promise<{ id: string; planId: string; status: string; periodEnd: string | null }[]> => {
        if (!supabase) return [];
        try {
            const { data: auth } = await withTimeout(supabase.auth.getUser());
            const user = auth?.user;
            if (!user) return [];
            const { data, error } = await supabase.from('subscriptions').select('id, plan_id, status, current_period_end').eq('user_id', user.id).order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []).map((s: any) => ({ id: s.id, planId: s.plan_id, status: s.status, periodEnd: s.current_period_end }));
        } catch (e) {
            return [];
        }
    },

    createSubscription: async (planId: string): Promise<{ ok: boolean; error?: string }> => {
        return safeInvoke<{ ok: boolean, error?: string }>('subscription-create', { planId }, () => ({ ok: false, error: 'BILLING_UNAVAILABLE' }));
    },

    cancelSubscription: async (subscriptionId: string): Promise<{ ok: boolean; error?: string }> => {
        return safeInvoke<{ ok: boolean, error?: string }>('subscription-cancel', { subscriptionId }, () => ({ ok: false, error: 'BILLING_UNAVAILABLE' }));
    },

    createPaidExposure: async (jamId: string, exposureType: string, durationHours: number): Promise<{ ok: boolean; error?: string }> => {
        return safeInvoke<{ ok: boolean, error?: string }>('paid-exposure-create', { jamId, exposureType, durationHours }, () => ({ ok: false, error: 'BILLING_UNAVAILABLE' }));
    },

    // ============ PHASE 10: PAYMENTS ACTIVATION ============

    /**
     * Create a Stripe Checkout session.
     */
    createCheckoutSession: async (priceId: string, successUrl: string, cancelUrl: string): Promise<{ ok: boolean; enabled: boolean; url?: string; errorCode?: string }> => {
        return safeInvoke<any>('billing-create-checkout-session', { priceId, successUrl, cancelUrl }, () => ({
            ok: true,
            enabled: false,
            url: null
        }));
    },

    /**
     * Create a Stripe Customer Portal session.
     */
    openBillingPortal: async (returnUrl?: string): Promise<{ ok: boolean; url?: string }> => {
        return safeInvoke<any>('billing-portal', { returnUrl }, () => ({
            ok: true,
            url: null
        }));
    },

    /**
     * Get entitlements for current user.
     */
    getMyEntitlements: async (): Promise<{ ok: boolean; entitlements: { is_pro: boolean; source: string } }> => {
        return safeInvoke<any>('billing-get-my-entitlements', {}, () => ({
            ok: true,
            entitlements: { is_pro: false, source: 'none' }
        }));
    },

    /**
     * Check for a specific entitlement.
     */
    hasEntitlement: async (key: string): Promise<boolean> => {
        if (key !== 'is_pro') return false;
        try {
            const res = await backend.getMyEntitlements();
            return !!res?.entitlements?.is_pro;
        } catch {
            return false;
        }
    },

    // ============ PHASE 7: MEDIA STORAGE PLUMBING ============

    /**
     * Request a signed upload URL for media.
     */
    signMediaUpload: async (params: {
        bucket: 'jam-media' | 'avatars';
        kind: 'jam_hero' | 'jam_image' | 'avatar';
        jamId?: string;
        profileId?: string;
        contentType: string;
        ext: string;
    }): Promise<{ ok: boolean; uploadUrl?: string; path?: string; publicUrl?: string; error?: string }> => {
        return safeInvoke<any>('media-sign-upload', params, () => ({
            ok: true,
            upload: false,
            error: 'STORAGE_UNAVAILABLE'
        }));
    },

    /**
     * Finalize media upload and update DB fields.
     */
    finalizeMediaUpload: async (params: {
        bucket: 'jam-media' | 'avatars';
        path: string;
        jamId?: string;
        profileId?: string;
        slot: 'hero' | 'image' | 'avatar';
    }): Promise<{ ok: boolean; updated: boolean; url?: string; error?: string }> => {
        return safeInvoke<any>('media-finalize', params, () => ({
            ok: true,
            updated: false,
            error: 'STORAGE_UNAVAILABLE'
        }));
    },

    // ============ PHASE 8: ADMIN OPS & REVIEW QUEUES ============

    /**
     * Admin methods. Protected by x-admin-secret.
     * These should only be used by internal tools, not the public UI.
     */
    admin: {
        /**
         * List moderation flags.
         */
        listFlags: async (params: { status: 'open' | 'reviewing' | 'resolved'; limit?: number; cursor?: string; secret: string }): Promise<{ ok: boolean; authorized: boolean; items?: any[]; error?: string }> => {
            if (!supabase) return { ok: true, authorized: false };
            try {
                const { data, error } = await withTimeout(supabase.functions.invoke('admin-list-flags', {
                    body: params,
                    headers: { 'x-admin-secret': params.secret }
                }));
                if (error) throw error;
                return data;
            } catch (e) {
                return { ok: true, authorized: true, error: normalizeError(e).code };
            }
        },

        /**
         * Resolve a moderation flag.
         */
        resolveFlag: async (params: { flagId: string; resolution: string; resolvedBy?: string; secret: string }): Promise<{ ok: boolean; authorized: boolean; flag?: any; error?: string }> => {
            if (!supabase) return { ok: true, authorized: false };
            try {
                const { data, error } = await withTimeout(supabase.functions.invoke('admin-resolve-flag', {
                    body: params,
                    headers: { 'x-admin-secret': params.secret }
                }));
                if (error) throw error;
                return data;
            } catch (e) {
                return { ok: true, authorized: true, error: normalizeError(e).code };
            }
        },

        /**
         * Silently hide or unhide a jam.
         */
        hideJam: async (params: { jamId: string; hidden: boolean; reason?: string; actorId?: string; secret: string }): Promise<{ ok: boolean; authorized: boolean; error?: string }> => {
            if (!supabase) return { ok: true, authorized: false };
            try {
                const { data, error } = await withTimeout(supabase.functions.invoke('admin-hide-jam', {
                    body: params,
                    headers: { 'x-admin-secret': params.secret }
                }));
                if (error) throw error;
                return data;
            } catch (e) {
                return { ok: true, authorized: true, error: normalizeError(e).code };
            }
        },

        /**
         * Set/unset trust flags on a profile.
         */
        setTrustFlag: async (params: { profileId: string; flag: string; enabled: boolean; actorId?: string; secret: string }): Promise<{ ok: boolean; authorized: boolean; flags?: any; error?: string }> => {
            if (!supabase) return { ok: true, authorized: false };
            try {
                const { data, error } = await withTimeout(supabase.functions.invoke('admin-set-trust-flag', {
                    body: params,
                    headers: { 'x-admin-secret': params.secret }
                }));
                if (error) throw error;
                return data;
            } catch (e) {
                return { ok: true, authorized: true, error: normalizeError(e).code };
            }
        },

        /**
         * Force recompute leaderboards.
         */
        recomputeLeaderboards: async (params: { scopes: string[]; secret: string }): Promise<{ ok: boolean; authorized: boolean; result?: any; error?: string }> => {
            if (!supabase) return { ok: true, authorized: false };
            try {
                const { data, error } = await withTimeout(supabase.functions.invoke('admin-recompute-leaderboards-now', {
                    body: params,
                    headers: { 'x-admin-secret': params.secret }
                }));
                if (error) throw error;
                return data;
            } catch (e) {
                return { ok: true, authorized: true, error: normalizeError(e).code };
            }
        },

        /**
         * Read sampled event logs.
         */
        readEvents: async (params: { eventType?: string; since?: string; limit?: number; secret: string }): Promise<{ ok: boolean; authorized: boolean; items?: any[]; error?: string }> => {
            if (!supabase) return { ok: true, authorized: false };
            try {
                const { data, error } = await withTimeout(supabase.functions.invoke('admin-read-events', {
                    body: params,
                    headers: { 'x-admin-secret': params.secret }
                }));
                if (error) throw error;
                return data;
            } catch (e) {
                return { ok: true, authorized: true, error: normalizeError(e).code };
            }
        },

        /**
         * Read drift audit records.
         */
        readDriftAudit: async (params: { scope?: string; since?: string; limit?: number; secret: string }): Promise<{ ok: boolean; authorized: boolean; items?: any[]; error?: string }> => {
            if (!supabase) return { ok: true, authorized: false };
            try {
                const { data, error } = await withTimeout(supabase.functions.invoke('admin-read-drift-audit', {
                    body: params,
                    headers: { 'x-admin-secret': params.secret }
                }));
                if (error) throw error;
                return data;
            } catch (e) {
                return { ok: true, authorized: true, error: normalizeError(e).code };
            }
        }
    },

    // ============ PHASE 6: HARDENING HELPERS ============

    healthCheck: async (): Promise<{ ok: boolean; mode: string }> => {
        return { ok: !!supabase, mode: supabase ? 'production' : 'demo' };
    }

};
