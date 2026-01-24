import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role to read all jams/profiles
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Validate cron or admin secret if needed. For now, open or key protected.

        const scopes = ['shipping_today', 'highest_earning', 'trending', 'newest']

        const results = {}

        for (const scope of scopes) {
            let query = supabase
                .from('jams')
                .select(`
                id, name, tagline, category, media,
                mrr_bucket, stats, tech_stack, vibe_tools,
                creator_id,
                profiles (id, display_name, avatar_url, handle)
            `)
                .eq('status', 'published')
                .eq('is_hidden', false)

            // Window/Ordering Logic
            if (scope === 'shipping_today') {
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                query = query.gt('published_at', yesterday).order('published_at', { ascending: false })
            } else if (scope === 'highest_earning') {
                query = query.eq('mrr_visibility', 'public').order('mrr_value', { ascending: false, nullsFirst: false })
            } else if (scope === 'trending') {
                // MVP: Order by upvotes for now, or rank->>scoreTrending if we populated it
                // Using upvotes as proxy for reliability if rank is empty
                query = query.order('stats->upvotes', { ascending: false })
                // Or reliable: order by created_at desc limit 50?
                // Prompt says: "trending".
            } else if (scope === 'newest') {
                query = query.order('published_at', { ascending: false })
            }

            const { data: jams, error } = await query.limit(50)

            if (error) {
                console.error(`Error fetching ${scope}:`, error)
                continue
            }

            // Transform to LeaderboardItem
            const items = jams.map((j: any) => ({
                jamId: j.id,
                name: j.name,
                tagline: j.tagline,
                heroImageUrl: j.media?.heroImageUrl,
                creatorId: j.creator_id,
                creatorName: j.profiles?.display_name || 'Creator',
                creatorAvatarUrl: j.profiles?.avatar_url,
                category: j.category,
                mrrBucket: j.mrr_bucket,
                upvotes: j.stats?.upvotes || 0,
                techStackTop: (j.tech_stack || []).slice(0, 3),
                vibeToolsTop: (j.vibe_tools || []).slice(0, 3)
            }))

            // Upsert to leaderboards
            // time_window logic could be dynamic, for now just empty or fixed
            await supabase
                .from('leaderboards')
                .upsert({
                    scope,
                    generated_at: new Date().toISOString(),
                    time_window: {},
                    items
                })

            results[scope] = items.length
        }

        return new Response(JSON.stringify({ success: true, counts: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
