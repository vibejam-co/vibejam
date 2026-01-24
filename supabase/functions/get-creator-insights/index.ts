import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        // 1. Fetch all jams for this creator
        const { data: jams, error: jamsError } = await supabase
            .from('jams')
            .select('id, name, stats, created_at, published_at')
            .eq('creator_id', user.id)

        if (jamsError) throw jamsError

        // 2. Aggregate insights
        const totalJams = jams.length
        const totalViews = jams.reduce((acc, jam) => acc + (jam.stats?.views || 0), 0)
        const totalUpvotes = jams.reduce((acc, jam) => acc + (jam.stats?.upvotes || 0), 0)
        const totalBookmarks = jams.reduce((acc, jam) => acc + (jam.stats?.bookmarks || 0), 0)

        // 3. Simple time-series mock (or calculated from created_at)
        // In a real app, we'd query an analytics table. For Phase 4, we aggregate from jam stats.
        const insights = {
            summary: {
                totalJams,
                totalViews,
                totalUpvotes,
                totalBookmarks,
            },
            jams: jams.map(j => ({
                id: j.id,
                name: j.name,
                views: j.stats?.views || 0,
                upvotes: j.stats?.upvotes || 0,
                bookmarks: j.stats?.bookmarks || 0
            })),
            velocity: {
                bookmarks: 0, // Mock for now
                upvotes: 0,
                views: 0
            }
        }

        return new Response(JSON.stringify(insights), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
