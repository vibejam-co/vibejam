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
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role for stats update
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // User Auth Check
        const userClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: authError } = await userClient.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized')

        const { jamId } = await req.json().catch(() => ({}))
        if (!jamId) throw new Error('jamId required')

        // 1. Check existence & previous state
        const { data: existing } = await supabase
            .from('jam_upvotes')
            .select('*')
            .eq('user_id', user.id)
            .eq('jam_id', jamId)
            .single()

        let isUpvoted = false

        if (existing) {
            // COOLDOWN CHECK: If created < 1s ago, ignore toggle (prevent double-clicks spam)
            const created = new Date(existing.created_at).getTime()
            const now = Date.now()
            if (now - created < 1000) {
                // Too fast untoggle. Identify as "bounce".
                // Just return current state (true) without deleting.
                isUpvoted = true
                console.warn(`Upvote debounce triggered for user ${user.id} on jam ${jamId}`)
            } else {
                // Untoggle
                await supabase.from('jam_upvotes').delete().eq('user_id', user.id).eq('jam_id', jamId)
                isUpvoted = false
            }
        } else {
            // Toggle on
            await supabase.from('jam_upvotes').insert({ user_id: user.id, jam_id: jamId })
            isUpvoted = true
        }

        // 2. Authoritative Count Update
        // Service role needed to bypass potential RLS on jams update if user is not creator
        // But we initialized supabase with SERVICE_ROLE_KEY above.

        const { count } = await supabase
            .from('jam_upvotes')
            .select('*', { count: 'exact', head: true })
            .eq('jam_id', jamId)

        // Atomic-ish update
        const { data: jam } = await supabase.from('jams').select('stats').eq('id', jamId).single()
        if (jam) {
            const stats = jam.stats || { views: 0, upvotes: 0, bookmarks: 0, commentsCount: 0 }
            stats.upvotes = count || 0

            await supabase
                .from('jams')
                .update({ stats })
                .eq('id', jamId)
        }

        // Return latest stats to keep UI in sync
        const finalStats = jam?.stats || { upvotes: count || 0 }

        return new Response(JSON.stringify({ stats: finalStats, isUpvoted }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Upvote Toggle Error', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
