import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError } from '../_shared/response.ts'

Deno.serve(async (req) => {
    // 1. Setup Service Role
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
        const { scope = 'shipping_this_week', force = false } = await req.json().catch(() => ({}));

        // 2. Check TTL (Idempotency / caching)
        if (!force) {
            const { data: existing } = await supabase
                .from('leaderboards')
                .select('generated_at')
                .eq('scope', scope)
                .maybeSingle();

            if (existing) {
                const age = Date.now() - new Date(existing.generated_at).getTime();
                const ttl = scope === 'newest' ? 10 * 60 * 1000 : 15 * 60 * 1000; // 10 min vs 15 min

                if (age < ttl) {
                    return standardResponse({ ok: true, cached: true, age_seconds: age / 1000 });
                }
            }
        }

        // 3. Compute (The Heavy Lift)
        let query = supabase.from('jams').select('id, name, tagline, media, stats, creator_id, published_at')
            .eq('status', 'published')
            .eq('is_listed', true);

        // Scope Logic
        const now = new Date();
        const items = [];

        if (scope === 'shipping_this_week') {
            // Last 7 days
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const { data } = await query
                .gte('published_at', weekAgo.toISOString())
                .order('published_at', { ascending: false }) // Initial sort, simplified
                .limit(50);
            // In reality, this might rank by a score formula (upvotes * time_decay)
            // For MVP: sorting by upvotes descending
            if (data) items.push(...data.sort((a: any, b: any) => (b.stats?.upvotes || 0) - (a.stats?.upvotes || 0)));
        } else if (scope === 'trending') {
            // Last 24h high activity
            const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const { data } = await query
                .gte('published_at', dayAgo.toISOString())
                .limit(50);
            if (data) items.push(...data.sort((a: any, b: any) => (b.stats?.views || 0) - (a.stats?.views || 0)));
        } else if (scope === 'newest') {
            const { data } = await query
                .order('published_at', { ascending: false })
                .limit(50);
            if (data) items.push(...data);
        }

        // 4. Enrich with Profiles (Avoid Client N+1)
        const enrichedItems = [];
        for (const item of items) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('display_name, handle, avatar_url, badges') // Fetch badges specifically for verified tick
                .eq('id', item.creator_id)
                .single();

            enrichedItems.push({
                ...item,
                creator: profile || { display_name: 'Maker', handle: 'maker' }
            });
        }

        // 5. Snapshot Write
        const snapshot = {
            scope,
            generated_at: now.toISOString(),
            time_window: { start: now.toISOString(), end: now.toISOString() },
            items: enrichedItems
        };

        const { error: writeError } = await supabase
            .from('leaderboards')
            .upsert(snapshot);

        if (writeError) throw writeError;

        return standardResponse({ ok: true, generated: true, count: items.length });

    } catch (e: any) {
        return standardResponse(normalizeError(e), 500);
    }
})
