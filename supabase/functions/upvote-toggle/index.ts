import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError } from '../_shared/response.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Auth Check (User Context)
        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized')

        // 2. Admin Context (Service Role for Writes)
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { jamId } = await req.json().catch(() => ({}))
        if (!jamId) throw new Error('jamId required')

        // 3. Logic
        // Check existing using Admin Client (trust source of truth, though RLS might allow user read)
        const { data: existing } = await adminClient
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
                isUpvoted = true
                console.warn(`Upvote debounce triggered for user ${user.id} on jam ${jamId}`)
            } else {
                // Untoggle
                await adminClient.from('jam_upvotes').delete().eq('user_id', user.id).eq('jam_id', jamId)
                isUpvoted = false
            }
        } else {
            // Toggle on
            await adminClient.from('jam_upvotes').insert({ user_id: user.id, jam_id: jamId })
            isUpvoted = true
        }

        // 4. Update Stats
        const { count } = await adminClient
            .from('jam_upvotes')
            .select('*', { count: 'exact', head: true })
            .eq('jam_id', jamId)

        const { data: jam } = await adminClient.from('jams').select('stats').eq('id', jamId).single()
        if (jam) {
            const stats = jam.stats || { views: 0, upvotes: 0, bookmarks: 0, comments: 0 }
            stats.upvotes = count || 0
            await adminClient.from('jams').update({ stats }).eq('id', jamId)
        }

        const finalStats = jam?.stats || { upvotes: count || 0 }

        return new Response(JSON.stringify({ stats: finalStats, isUpvoted }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('Upvote Toggle Error', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
