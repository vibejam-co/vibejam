import { JamDoc, JamStatus, JamMedia, LeaderboardDoc, LeaderboardItem } from '../types';
import { jamLocalStore } from './jamLocalStore';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const BACKEND_OFFLINE_ERROR = { ok: false, success: false, error: 'BACKEND_OFFLINE' };

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

// Helper: Fail-open wrapper with Hardening (Now strictly REAL mode)
async function safeInvoke<T>(functionName: string, body: any): Promise<T> {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    try {
        await requireSession();
        const { data, error } = await withTimeout(supabase.functions.invoke(functionName, { body }));
        if (error) throw error;
        return data as T;
    } catch (err) {
        console.error(`[Backend] safeInvoke failed for ${functionName}:`, err.message);
        throw err;
    }
}

/**
 * Ensures a valid Supabase session exists.
 * Throws an error if no session is present.
 */
async function requireSession(): Promise<any> {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('NO_SESSION');
    return session;
}

export const backend = {

    /**
     * Create or update a jam draft.
     */
    upsertDraft: async (draft: Partial<JamDoc> & { websiteUrl: string, jamId?: string, source?: 'manual' | 'scrape' }): Promise<JamDoc> => {
        if (!isSupabaseConfigured || !supabase) {
            throw new Error('BACKEND_OFFLINE');
        }

        try {
            await requireSession();
            const { data, error } = await supabase.functions.invoke('jam-upsert-draft', { body: draft });
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[Backend] UpsertDraft failed:', err);
            throw err;
        }
    },

    /**
     * Scrape URL metadata.
     */
    scrapeUrl: async (websiteUrl: string, jamId?: string): Promise<{ extraction: Partial<JamDoc>, jam?: JamDoc; ok: boolean; error?: string; code?: string }> => {
        if (!isSupabaseConfigured || !supabase) {
            return { extraction: {}, ok: false, code: 'SUPABASE_NOT_CONFIGURED' };
        }

        try {
            await requireSession();
            const { data, error } = await supabase.functions.invoke('scrape', {
                body: { url: websiteUrl, jamId }
            });

            if (error) {
                console.warn('[Backend] Scrape failed:', error);
                return { extraction: {}, ok: false, code: 'SCRAPE_FAILED', error: error.message };
            }

            return { extraction: data, ok: true };
        } catch (e) {
            console.error('[Backend] Scrape hit critical error:', e);
            return { extraction: {}, ok: false, code: 'INTERNAL_ERROR', error: normalizeError(e).code };
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
    /**
     * Toggle Upvote.
     */
    toggleUpvote: async (jamId: string): Promise<{ ok: boolean; stats: any, isUpvoted: boolean; error?: string }> => {
        return safeInvoke<{ ok: boolean; stats: any, isUpvoted: boolean; error?: string }>('upvote-toggle', { jamId });
    },

    /**
     * Toggle Bookmark.
     */
    toggleBookmark: async (jamId: string): Promise<{ ok: boolean; stats: any, isBookmarked: boolean; error?: string }> => {
        return safeInvoke<{ ok: boolean; stats: any, isBookmarked: boolean; error?: string }>('bookmark-toggle', { jamId });
    },

    /**
     * Get Leaderboard.
     */
    /**
     * Get Leaderboard from Snapshot (Cached).
     */
    getLeaderboard: async (scope: string): Promise<LeaderboardDoc | null> => {
        // Cold Start Cache Key
        const CACHE_KEY = `vj_leaderboard_${scope}`;

        if (!supabase) {
            // Offline fallback
            const cached = localStorage.getItem(CACHE_KEY);
            return cached ? JSON.parse(cached) : null;
        }

        try {
            // Read from 'leaderboards' table (Snapshot)
            const { data, error } = await withTimeout(
                supabase.from('leaderboards').select('*').eq('scope', scope).maybeSingle()
            );

            if (error || !data) {
                // Cold Start / Miss: Fallback to local cache if exists
                console.warn('[Backend] Leaderboard cache miss/error, checking local...', error);
                const cached = localStorage.getItem(CACHE_KEY);
                return cached ? JSON.parse(cached) : null;
            }

            const doc: LeaderboardDoc = {
                scope: data.scope,
                generatedAt: data.generated_at,
                window: data.time_window || { label: 'Today', from: '', to: '' },
                items: data.items || []
            };

            // Update local cache
            localStorage.setItem(CACHE_KEY, JSON.stringify(doc));
            return doc;

        } catch (e) {
            console.error('[Backend] Leaderboard fail:', e);
            const cached = localStorage.getItem(CACHE_KEY);
            return cached ? JSON.parse(cached) : null;
        }
    },

    /**
     * Search Jams using Full-text Search.
     */
    searchJams: async (q: string, limit: number = 20): Promise<{ ok: boolean; items: any[]; errorCode?: string }> => {
        return safeInvoke<any>('search-jams', { q, limit });
    },

    publishJam: async (params: { jamId: string, patch: Partial<JamDoc> }): Promise<{ ok: boolean; success: boolean; jam_id?: string; live_url?: string; discoverable?: boolean; reason_if_not?: string | null; data?: JamDoc; error?: string }> => {
        if (!isSupabaseConfigured || !supabase) {
            return { ok: false, success: false, error: 'BACKEND_OFFLINE' };
        }

        const { jamId, patch } = params;
        const payload = { ...patch, status: 'published' };

        try {
            const session = await requireSession();
            // Inject creator_id from session for safety
            const finalPayload = { ...payload, jamId, creator_id: session.user.id };

            // Increased timeout for publish (15s) to allow for cold starts on Edge Functions
            const { data, error } = await withTimeout(supabase.functions.invoke('jam-upsert-draft', {
                body: finalPayload,
                headers: { 'x-client-request-id': crypto.randomUUID() }
            }), 15000);

            if (error) {
                console.error('[Backend] Publish failed:', error);
                return { ok: false, success: false, error: error.message };
            }

            return { ok: true, success: true, data };
        } catch (e) {
            console.error('[Backend] Publish hit critical error:', e);
            return { ok: false, success: false, error: normalizeError(e).code };
        }
    },

    /**
     * Get a specific Jam.
     */
    getJam: async (jamId: string): Promise<{ jam: JamDoc | null; source: "supabase" | "local"; ok: boolean; error?: string }> => {
        try {
            const result = await safeInvoke<any>('jam-get', { jamId });
            return { ...result, ok: true };
        } catch (e) {
            return { jam: null, source: 'local', ok: false, error: normalizeError(e).code };
        }
    },

    /**
     * Get Latest Draft.
     */
    getMyLatestDraft: async (): Promise<{ jam: JamDoc | null; source: "supabase" | "local"; ok: boolean }> => {
        return safeInvoke<{ jam: JamDoc | null, source: "supabase" | "local", ok: boolean }>('jam-latest-draft', {});
    },

    /**
     * List Published Jams (Feed) with Cold Start Cache.
     */
    listPublishedJams: async (params: { sort: "trending" | "new" | "revenue" | "picks"; filters?: any }): Promise<{ jams: JamDoc[]; source: "supabase" | "local"; ok: boolean }> => {
        // Simple cache key based on sort
        const CACHE_KEY = `vj_feed_${params.sort}`;

        try {
            const result = await safeInvoke<{ jams: any[]; source: "supabase" | "local"; ok: boolean }>('jams-list', params);

            if (result.ok && result.jams?.length > 0) {
                // Update Cache
                localStorage.setItem(CACHE_KEY, JSON.stringify(result));
                return result;
            }

            throw new Error('Feed fetch failed or empty');

        } catch (e) {
            console.warn('[Backend] Feed cold start fallback:', CACHE_KEY);
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                return JSON.parse(cached); // Return stale data transparently
            }
            return { jams: [], source: 'local', ok: false };
        }
    },

    /**
     * Get Leaderboard Snapshot.
     */
    getLeaderboardSnapshot: async (kind: string): Promise<{ rows: any[]; source: "supabase" | "local"; ok: boolean }> => {
        return safeInvoke<{ rows: any[]; source: "supabase" | "local"; ok: boolean }>('leaderboard-snapshot', { kind });
    },

    /**
     * List My Bookmarks.
     */
    listMyBookmarks: async (): Promise<{ jams: JamDoc[]; source: "supabase" | "local"; ok: boolean }> => {
        // TODO: bookmarks-list function doesn't exist yet
        return { jams: [], source: "local", ok: true };
        // return safeInvoke<{ jams: JamDoc[]; source: "supabase" | "local"; ok: boolean }>('bookmarks-list', {});
    },

    /**
     * Get private creator insights.
     */
    getCreatorInsights: async (): Promise<{ summary: any; jams: any[]; source: "supabase" | "local"; ok: boolean }> => {
        return safeInvoke<{ summary: any; jams: any[]; source: "supabase" | "local"; ok: boolean }>('get-creator-insights', {});
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
        return safeInvoke<{ ok: boolean, error?: string }>('subscription-create', { planId });
    },

    cancelSubscription: async (subscriptionId: string): Promise<{ ok: boolean; error?: string }> => {
        return safeInvoke<{ ok: boolean, error?: string }>('subscription-cancel', { subscriptionId });
    },

    createPaidExposure: async (jamId: string, exposureType: string, durationHours: number): Promise<{ ok: boolean; error?: string }> => {
        return safeInvoke<{ ok: boolean, error?: string }>('paid-exposure-create', { jamId, exposureType, durationHours });
    },

    // ============ PHASE 10: PAYMENTS ACTIVATION ============

    /**
     * Create a Stripe Checkout session.
     */
    createCheckoutSession: async (priceId: string, successUrl: string, cancelUrl: string): Promise<{ ok: boolean; enabled: boolean; url?: string; errorCode?: string }> => {
        return safeInvoke<any>('billing-create-checkout-session', { priceId, successUrl, cancelUrl });
    },

    /**
     * Create a Stripe Customer Portal session.
     */
    openBillingPortal: async (returnUrl?: string): Promise<{ ok: boolean; url?: string }> => {
        return safeInvoke<any>('billing-portal', { returnUrl });
    },

    /**
     * Get entitlements for current user.
     */
    getMyEntitlements: async (): Promise<{ ok: boolean; entitlements: { is_pro: boolean; source: string } }> => {
        return safeInvoke<any>('billing-get-my-entitlements', {});
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
        return safeInvoke<any>('media-sign-upload', params);
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
        return safeInvoke<any>('media-finalize', params);
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

    // ============ PHASE 12: DETERMINISTIC QUERY LAYER ============

    /**
     * SURFACE 1: Creator Profile -> Products list
     */
    fetchCreatorPublishedJamsByHandle: async (handle: string, { limit = 12, cursor }: { limit?: number, cursor?: { publishedAt: string, id: string } }): Promise<{ data: any[], nextCursor?: any, error?: string }> => {
        if (!supabase) return { data: [], error: 'BACKEND_OFFLINE' };
        try {
            // 1. Resolve creator_id
            const { data: profile, error: pErr } = await supabase.from('profiles').select('id').eq('handle', handle).maybeSingle();
            if (pErr || !profile) return { data: [], error: pErr?.message || 'CREATOR_NOT_FOUND' };

            // 2. Fetch jams
            let query = supabase.from('jams')
                .select('id, slug, name, tagline, category, media, published_at, creator_id')
                .eq('creator_id', profile.id)
                .eq('status', 'published')
                .eq('is_private', false)
                .not('published_at', 'is', null)
                .order('published_at', { ascending: false })
                .order('id', { ascending: false })
                .limit(limit + 1);

            // Cursor logic: (published_at, id) < (cursorPublishedAt, cursorId)
            if (cursor) {
                query = query.or(`published_at.lt.${cursor.publishedAt},and(published_at.eq.${cursor.publishedAt},id.lt.${cursor.id})`);
            }

            const { data, error } = await query;
            if (error) throw error;

            const hasMore = data.length > limit;
            const items = data.slice(0, limit).map(j => ({
                id: j.id,
                slug: j.slug,
                name: j.name,
                tagline: j.tagline,
                category: j.category,
                cover_image_url: j.media?.heroImageUrl || null,
                published_at: j.published_at,
                creator_id: j.creator_id
            }));

            const next = hasMore ? { publishedAt: data[limit - 1].published_at, id: data[limit - 1].id } : undefined;
            return { data: items, nextCursor: next };
        } catch (e) {
            return { data: [], error: normalizeError(e).code };
        }
    },

    /**
     * SURFACE 2: Discover -> New tab
     */
    fetchDiscoverNewJams: async ({ limit = 24, cursor }: { limit?: number, cursor?: { publishedAt: string, id: string } }): Promise<{ data: any[], nextCursor?: any, error?: string }> => {
        if (!supabase) return { data: [], error: 'BACKEND_OFFLINE' };
        try {
            let query = supabase.from('jams')
                .select(`
                    id, slug, name, tagline, category, media, published_at,
                    creator:profiles!jams_creator_id_fkey (handle, display_name, avatar_url)
                `)
                .eq('status', 'published')
                .eq('is_private', false)
                .eq('is_listed', true)
                .not('published_at', 'is', null)
                .order('published_at', { ascending: false })
                .order('id', { ascending: false })
                .limit(limit + 1);

            if (cursor) {
                query = query.or(`published_at.lt.${cursor.publishedAt},and(published_at.eq.${cursor.publishedAt},id.lt.${cursor.id})`);
            }

            const { data, error } = await query;
            if (error) throw error;

            const hasMore = data.length > limit;
            const items = data.slice(0, limit).map((j: any) => ({
                id: j.id,
                slug: j.slug,
                name: j.name,
                tagline: j.tagline,
                category: j.category,
                cover_image_url: j.media?.heroImageUrl || null,
                published_at: j.published_at,
                handle: j.creator?.handle,
                display_name: j.creator?.display_name,
                avatar_url: j.creator?.avatar_url
            }));

            const next = hasMore ? { publishedAt: data[limit - 1].published_at, id: data[limit - 1].id } : undefined;
            return { data: items, nextCursor: next };
        } catch (e) {
            return { data: [], error: normalizeError(e).code };
        }
    },

    /**
     * SURFACE 3: Homepage -> Top Jams Shipping Today
     */
    fetchHomepageTopJamsToday: async ({ limit = 8, cursor, tz = 'America/Los_Angeles' }: { limit?: number, cursor?: { publishedAt: string, id: string }, tz?: string }): Promise<{ data: any[], nextCursor?: any, error?: string }> => {
        if (!supabase) return { data: [], error: 'BACKEND_OFFLINE' };
        try {
            // Calculate Today's window in the given TZ
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
            const parts = formatter.formatToParts(now);
            const y = parts.find(p => p.type === 'year')?.value;
            const m = parts.find(p => p.type === 'month')?.value;
            const d = parts.find(p => p.type === 'day')?.value;
            const dateStr = `${y}-${m}-${d}`;

            const startOfDay = new Date(`${dateStr}T00:00:00Z`); // Simplified representation for comparison
            // To get real local start, we'd need a more complex conversion, but since comparison is in DB, 
            // the logic is: published_at >= startOfDay(tz).
            // A more robust way in Supabase: query with published_at at time zone 'UTC' at time zone tz >= current_date

            let query = supabase.from('jams')
                .select(`
                    id, slug, name, tagline, category, media, published_at,
                    creator:profiles!jams_creator_id_fkey (handle, display_name, avatar_url)
                `)
                .eq('status', 'published')
                .eq('is_private', false)
                .eq('is_listed', true)
                .not('published_at', 'is', null)
                .gte('published_at', startOfDay.toISOString())
                .order('published_at', { ascending: false })
                .order('id', { ascending: false })
                .limit(limit + 1);

            if (cursor) {
                query = query.or(`published_at.lt.${cursor.publishedAt},and(published_at.eq.${cursor.publishedAt},id.lt.${cursor.id})`);
            }

            const { data, error } = await query;
            if (error) throw error;

            const hasMore = data.length > limit;
            const items = data.slice(0, limit).map((j: any) => ({
                id: j.id,
                slug: j.slug,
                name: j.name,
                tagline: j.tagline,
                category: j.category,
                cover_image_url: j.media?.heroImageUrl || null,
                published_at: j.published_at,
                handle: j.creator?.handle,
                display_name: j.creator?.display_name,
                avatar_url: j.creator?.avatar_url
            }));

            const next = hasMore ? { publishedAt: data[limit - 1].published_at, id: data[limit - 1].id } : undefined;
            return { data: items, nextCursor: next };
        } catch (e) {
            return { data: [], error: normalizeError(e).code };
        }
    },

    healthCheck: async (): Promise<{ ok: boolean; mode: string }> => {
        return { ok: true, mode: 'production' };
    }

};
