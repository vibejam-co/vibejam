import { JamDoc, JamStatus, JamMedia, LeaderboardDoc, LeaderboardItem } from '../types';
import { jamLocalStore } from './jamLocalStore';
import { supabase, isSupabaseConfigured, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseClient';

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
        const { data, error } = await invokeWithAuthRetry<T>(functionName, body);
        if (error) throw error;
        return data as T;
    } catch (err) {
        console.error(`[Backend] safeInvoke failed for ${functionName}:`, err.message);
        throw err;
    }
}

// Helper: Invoke without requiring a session (public-safe functions)
async function safeInvokePublic<T>(functionName: string, body: any): Promise<T> {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    try {
        const { data, error } = await withTimeout(supabase.functions.invoke(functionName, { body }));
        if (error) throw error;
        return data as T;
    } catch (err) {
        console.error(`[Backend] safeInvokePublic failed for ${functionName}:`, err.message);
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

    // Validate session with auth server to catch invalid JWTs early
    try {
        const { error: userError } = await supabase.auth.getUser();
        if (userError) {
            await supabase.auth.signOut();
            throw new Error('INVALID_JWT');
        }
    } catch (e) {
        // If validation fails for any reason, ensure clean sign-out
        await supabase.auth.signOut();
        throw new Error('INVALID_JWT');
    }

    // Refresh if token is about to expire (or missing access token)
    const expiresAtMs = session.expires_at ? session.expires_at * 1000 : 0;
    if (!session.access_token || (expiresAtMs && expiresAtMs < Date.now() + 60_000)) {
        const { data: refreshed, error } = await supabase.auth.refreshSession();
        if (error || !refreshed?.session) throw new Error('SESSION_REFRESH_FAILED');
        return refreshed.session;
    }

    return session;
}

async function invokeWithAuthRetry<T>(functionName: string, body: any, timeoutMs: number = 6000): Promise<{ data: T | null; error: any | null; session: any | null }> {
    const session = await requireSession();
    const invokeOnce = async (token: string) => {
        return withTimeout(supabase!.functions.invoke(functionName, {
            body,
            headers: {
                'x-client-request-id': crypto.randomUUID(),
                'Authorization': `Bearer ${token}`
            }
        }), timeoutMs);
    };

    let result = await invokeOnce(session.access_token);
    if (result.error && (result.error.message?.includes('Invalid JWT') || result.error.message?.includes('JWT') || result.error.status === 401)) {
        const { data: refreshed, error } = await supabase!.auth.refreshSession();
        if (error || !refreshed?.session) return { data: null, error: result.error, session: session };
        result = await invokeOnce(refreshed.session.access_token);
        return { data: result.data as T, error: result.error, session: refreshed.session };
    }

    return { data: result.data as T, error: result.error, session };
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
            const { data, error } = await invokeWithAuthRetry<JamDoc>('jam-upsert-draft', draft, 12000);
            if (error) throw error;
            return data as JamDoc;
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
        const payload = { ...patch, status: 'published', is_listed: true, listed_at: new Date().toISOString() };

        try {
            const session = await requireSession();
            // Inject creator_id from session for safety
            const finalPayload = { ...payload, jamId, creator_id: session.user.id };

            // Increased timeout for publish (15s) to allow for cold starts on Edge Functions
            const { data, error, session: effectiveSession } = await invokeWithAuthRetry<JamDoc>('jam-upsert-draft', finalPayload, 15000);

            if (error) {
                console.error('[Backend] Publish failed:', error);
                // Fallback: direct REST call with explicit auth to surface error body
                if (SUPABASE_URL && SUPABASE_ANON_KEY) {
                    try {
                        const res = await fetch(`${SUPABASE_URL}/functions/v1/jam-upsert-draft`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': SUPABASE_ANON_KEY,
                                'Authorization': `Bearer ${effectiveSession?.access_token || session.access_token}`,
                                'x-client-request-id': crypto.randomUUID()
                            },
                            body: JSON.stringify(finalPayload)
                        });
                        const body = await res.json().catch(() => ({}));
                        if (!res.ok) {
                            return { ok: false, success: false, error: body?.message || body?.error || `HTTP_${res.status}` };
                        }
                        return { ok: true, success: true, data: body?.data || body };
                    } catch (fetchErr) {
                        console.error('[Backend] Publish fallback failed:', fetchErr);
                    }
                }
                return { ok: false, success: false, error: error.message };
            }

            return { ok: true, success: true, data: data as JamDoc };
        } catch (e) {
            console.error('[Backend] Publish hit critical error:', e);
            return { ok: false, success: false, error: normalizeError(e).code };
        }
    },

    /**
     * Unpublish or archive a jam (soft-delete by hiding).
     */
    unpublishJam: async (params: { jamId: string; hide?: boolean }): Promise<{ ok: boolean; success: boolean; data?: JamDoc; error?: string }> => {
        if (!isSupabaseConfigured || !supabase) {
            return { ok: false, success: false, error: 'BACKEND_OFFLINE' };
        }

        try {
            const payload: any = {
                jamId: params.jamId,
                status: 'draft',
                is_listed: false,
            };
            if (params.hide) payload.is_hidden = true;

            const { data, error } = await invokeWithAuthRetry<JamDoc>('jam-upsert-draft', payload, 15000);

            if (error) {
                console.error('[Backend] Unpublish failed:', error);
                return { ok: false, success: false, error: error.message };
            }

            return { ok: true, success: true, data: data as JamDoc };
        } catch (e) {
            console.error('[Backend] Unpublish hit critical error:', e);
            return { ok: false, success: false, error: normalizeError(e).code };
        }
    },

    /**
     * Get a specific Jam.
     */
    getJam: async (jamId: string): Promise<{ jam: JamDoc | null; source: "supabase" | "local"; ok: boolean; error?: string }> => {
        try {
            const result = await safeInvokePublic<any>('jam-get', { jamId });
            return result;
        } catch (e) {
            return { jam: null, source: 'local', ok: false, error: normalizeError(e).code };
        }
    },

    /**
     * Get a specific Jam by slug.
     */
    getJamBySlug: async (slug: string): Promise<{ jam: JamDoc | null; source: "supabase" | "local"; ok: boolean; error?: string }> => {
        try {
            const result = await safeInvokePublic<any>('jam-get', { slug });
            return result;
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
    listPublishedJams: async (params: { sort: "trending" | "new" | "revenue" | "picks"; category?: string; limit?: number; offset?: number }): Promise<{ jams: JamDoc[]; source: "supabase" | "local"; ok: boolean }> => {
        // Simple cache key based on sort
        const FEED_CACHE_VERSION = 'v5';
        const cacheCategory = params.category || 'All';
        const cacheLimit = params.limit || 20;
        const cacheOffset = params.offset || 0;
        const CACHE_KEY = `vj_feed_${FEED_CACHE_VERSION}_${params.sort}_${cacheCategory}_${cacheLimit}_${cacheOffset}`;

        try {
            if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');

            // Primary path: direct table query (most reliable)
            const safeLimit = Math.max(1, Math.min(200, params.limit || 20));
            const safeOffset = Math.max(0, params.offset || 0);
            const fetchLimit = Math.min(200, Math.max(safeLimit + safeOffset, 50));
            const { data: rows, error: queryError } = await supabase
                .from('jams')
                .select(`
                    *,
                    creator:profiles!jams_creator_id_fkey (
                        id,
                        display_name,
                        handle,
                        avatar_url,
                        type,
                        trust_flags,
                        monetization_status
                    )
                `)
                .eq('status', 'published')
                .eq('is_listed', true)
                .neq('is_hidden', true)
                .order('published_at', { ascending: false })
                .range(0, fetchLimit - 1);

            if (!queryError && rows?.length) {
                const now = Date.now();
                const windowDays = 7;
                const windowMs = windowDays * 24 * 60 * 60 * 1000;
                const normalized = rows.map((j: any) => {
                    const publishedAt = j.published_at || j.publishedAt || null;
                    const publishedAtMs = publishedAt ? new Date(publishedAt).getTime() : 0;
                    const upvotes = j.stats?.upvotes ?? 0;
                    const mrrValue = j.mrr_value ?? 0;
                    return {
                        ...j,
                        __publishedAtMs: publishedAtMs,
                        __isNew: publishedAtMs ? (now - publishedAtMs <= windowMs) : false,
                        __upvotes: upvotes,
                        __mrrValue: mrrValue
                    };
                });

                let sorted = normalized;
                if (params.sort === 'new') {
                    sorted = normalized
                        .filter((j: any) => j.__isNew)
                        .sort((a: any, b: any) => (b.__upvotes - a.__upvotes) || (b.__publishedAtMs - a.__publishedAtMs));
                } else if (params.sort === 'revenue') {
                    sorted = normalized
                        .sort((a: any, b: any) => (b.__mrrValue - a.__mrrValue) || (b.__upvotes - a.__upvotes) || (b.__publishedAtMs - a.__publishedAtMs));
                } else if (params.sort === 'picks') {
                    sorted = normalized
                        .sort((a: any, b: any) => (b.__upvotes - a.__upvotes) || (b.__publishedAtMs - a.__publishedAtMs));
                } else {
                    sorted = normalized
                        .sort((a: any, b: any) => (b.__upvotes - a.__upvotes) || (b.__publishedAtMs - a.__publishedAtMs));
                }

                const sliced = sorted.slice(safeOffset, safeOffset + safeLimit);
                const directResult = { jams: sliced, source: 'supabase', ok: true };
                localStorage.setItem(CACHE_KEY, JSON.stringify(directResult));
                return directResult;
            }

            // Secondary: Edge function (if available)
            const { data, error } = await withTimeout(
                supabase.functions.invoke('jams-list', { body: params })
            );
            if (error) throw error;
            const result = data as { jams: any[]; source: "supabase" | "local"; ok: boolean };

            if (result.ok && result.jams?.length > 0) {
                localStorage.setItem(CACHE_KEY, JSON.stringify(result));
                return result;
            }

            // Last resort: REST call to the function endpoint
            if (SUPABASE_URL && SUPABASE_ANON_KEY) {
                const res = await fetch(`${SUPABASE_URL}/functions/v1/jams-list`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify(params)
                });
                if (res.ok) {
                    const alt = await res.json();
                    if (alt?.ok && alt?.jams?.length > 0) {
                        localStorage.setItem(CACHE_KEY, JSON.stringify(alt));
                        return alt;
                    }
                }
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

    /**
     * List signals (comments) for a jam.
     */
    listSignals: async (jamId: string): Promise<{ ok: boolean; items: any[] }> => {
        if (!supabase) return { ok: false, items: [] };
        try {
            const { data, error } = await withTimeout(
                supabase.functions.invoke('signals-list', { body: { jamId } })
            );
            if (error) throw error;
            return { ok: true, items: data?.items || [] };
        } catch (e) {
            console.warn('[Backend] listSignals failed:', e);
            // Fallback: direct table query (RLS-protected)
            try {
                const { data, error } = await withTimeout(
                    supabase
                        .from('jam_signals')
                        .select('id,jam_id,user_id,parent_id,content,created_at,profile:profiles!jam_signals_user_id_fkey (display_name,handle,avatar_url,badges)')
                        .eq('jam_id', jamId)
                        .order('created_at', { ascending: true })
                );
                if (error) throw error;
                return { ok: true, items: data || [] };
            } catch (fallbackErr) {
                console.warn('[Backend] listSignals fallback failed:', fallbackErr);
                return { ok: false, items: [] };
            }
        }
    },

    /**
     * Create a signal (comment/reply).
     */
    createSignal: async (params: { jamId: string; content: string; parentId?: string | null }): Promise<{ ok: boolean; item?: any; error?: string }> => {
        return safeInvoke<any>('signal-create', params);
    },

    /**
     * Follow status for a profile (by handle or id).
     */
    getFollowStatus: async (params: { handle?: string; targetId?: string }): Promise<{ ok: boolean; isFollowing: boolean; followersCount?: number; targetId?: string }> => {
        if (!supabase) return { ok: false, isFollowing: false };
        try {
            const { data, error } = await withTimeout(
                supabase.functions.invoke('follow-status', { body: params })
            );
            if (error) throw error;
            return { ok: true, ...data };
        } catch (e) {
            console.warn('[Backend] getFollowStatus failed:', e);
            return { ok: false, isFollowing: false };
        }
    },

    /**
     * Toggle follow for a profile (by handle or id).
     */
    toggleFollow: async (params: { handle?: string; targetId?: string }): Promise<{ ok: boolean; isFollowing: boolean; followersCount?: number; followingCount?: number; targetId?: string; error?: string }> => {
        return safeInvoke<any>('follow-toggle', params);
    },

    /**
     * List followers/following for a profile.
     */
    listFollows: async (params: { handle?: string; targetId?: string; kind: 'followers' | 'following'; limit?: number }): Promise<{ ok: boolean; items: any[]; targetId?: string }> => {
        if (!supabase) return { ok: false, items: [] };
        try {
            const { data, error } = await withTimeout(
                supabase.functions.invoke('follow-list', { body: params })
            );
            if (error) throw error;
            return { ok: true, items: data?.items || [], targetId: data?.targetId };
        } catch (e) {
            console.warn('[Backend] listFollows failed:', e);
            return { ok: false, items: [] };
        }
    },

    /**
     * List notifications for current user.
     */
    listNotifications: async (limit: number = 50): Promise<{ ok: boolean; items: any[] }> => {
        if (!supabase) return { ok: false, items: [] };
        try {
            const { data, error } = await withTimeout(
                supabase
                    .from('notifications')
                    .select('id,type,created_at,read_at,data,jam_id,actor:profiles!notifications_actor_id_fkey (display_name,handle,avatar_url)')
                    .order('created_at', { ascending: false })
                    .limit(limit)
            );
            if (error) throw error;
            return { ok: true, items: data || [] };
        } catch (e) {
            console.warn('[Backend] listNotifications failed:', e);
            return { ok: false, items: [] };
        }
    },

    /**
     * Mark notifications as read for current user.
     */
    markNotificationsRead: async (): Promise<{ ok: boolean }> => {
        if (!supabase) return { ok: false };
        try {
            const { data: auth } = await supabase.auth.getUser();
            const user = auth?.user;
            if (!user) return { ok: false };
            const { error } = await withTimeout(
                supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('recipient_id', user.id).is('read_at', null)
            );
            if (error) throw error;
            return { ok: true };
        } catch (e) {
            console.warn('[Backend] markNotificationsRead failed:', e);
            return { ok: false };
        }
    },

    /**
     * Get unread notifications count for current user.
     */
    getUnreadNotificationCount: async (): Promise<{ ok: boolean; count: number }> => {
        if (!supabase) return { ok: false, count: 0 };
        try {
            const { data: auth } = await supabase.auth.getUser();
            const user = auth?.user;
            if (!user) return { ok: true, count: 0 };
            const { count, error } = await withTimeout(
                supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('recipient_id', user.id).is('read_at', null)
            );
            if (error) throw error;
            return { ok: true, count: count || 0 };
        } catch (e) {
            console.warn('[Backend] getUnreadNotificationCount failed:', e);
            return { ok: false, count: 0 };
        }
    },

    /**
     * Get notification settings for current user (auto-creates defaults if missing).
     */
    getNotificationSettings: async (): Promise<{ ok: boolean; settings?: any }> => {
        if (!supabase) return { ok: false };
        try {
            const { data: auth } = await supabase.auth.getUser();
            const user = auth?.user;
            if (!user) return { ok: false };
            const { data, error } = await withTimeout(
                supabase.from('notification_settings').select('*').eq('recipient_id', user.id).maybeSingle()
            );
            if (error) throw error;
            if (!data) {
                const defaults = {
                    recipient_id: user.id,
                    notify_follow: true,
                    notify_comment: true,
                    notify_reply: true
                };
                const { data: inserted, error: insertError } = await withTimeout(
                    supabase.from('notification_settings').insert(defaults).select().single()
                );
                if (insertError) throw insertError;
                return { ok: true, settings: inserted };
            }
            return { ok: true, settings: data };
        } catch (e) {
            console.warn('[Backend] getNotificationSettings failed:', e);
            return { ok: false };
        }
    },

    /**
     * Update notification settings for current user.
     */
    updateNotificationSettings: async (patch: { notify_follow?: boolean; notify_comment?: boolean; notify_reply?: boolean }): Promise<{ ok: boolean; settings?: any }> => {
        if (!supabase) return { ok: false };
        try {
            const { data: auth } = await supabase.auth.getUser();
            const user = auth?.user;
            if (!user) return { ok: false };
            const { data, error } = await withTimeout(
                supabase.from('notification_settings').upsert({ recipient_id: user.id, ...patch }).select().single()
            );
            if (error) throw error;
            return { ok: true, settings: data };
        } catch (e) {
            console.warn('[Backend] updateNotificationSettings failed:', e);
            return { ok: false };
        }
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

    /**
     * Remix a theme using AI based on a vibe prompt.
     */
    remixTheme: async (params: { jamId: string, prompt: string, baseTheme: any }): Promise<any> => {
        return safeInvoke<any>('theme-remix', params);
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
    }): Promise<{ ok: boolean; uploadUrl?: string; token?: string; path?: string; publicUrl?: string; error?: string }> => {
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
                .select('id, slug, name, tagline, category, media, published_at, creator_id, tech_stack, vibe_tools, socials')
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
                creator_id: j.creator_id,
                tech_stack: j.tech_stack || [],
                vibe_tools: j.vibe_tools || [],
                socials: j.socials || null
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
                    vibe_tools, tech_stack, socials, mrr_bucket, mrr_visibility,
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
                vibe_tools: j.vibe_tools || [],
                tech_stack: j.tech_stack || [],
                socials: j.socials || null,
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
