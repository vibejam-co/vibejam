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
        // 1. Auth Check
        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized')

        // 2. Admin Client
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { jamId } = await req.json()
        if (!jamId) throw new Error('jamId required')

        // 3. Logic
        // Check existing
        const { data: existing } = await adminClient
            .from('bookmarks')
            .select('*')
            .eq('user_id', user.id)
            .eq('jam_id', jamId)
            .single()

        let isBookmarked = false

        if (existing) {
            await adminClient.from('bookmarks').delete().eq('user_id', user.id).eq('jam_id', jamId)
            isBookmarked = false
        } else {
            await adminClient.from('bookmarks').insert({ user_id: user.id, jam_id: jamId })
            isBookmarked = true
        }

        // Update Jam Stats
        const { count: jamCount } = await adminClient
            .from('bookmarks')
            .select('*', { count: 'exact', head: true })
            .eq('jam_id', jamId)

        const { data: jam } = await adminClient.from('jams').select('stats').eq('id', jamId).single()
        const stats = jam?.stats || {}
        stats.bookmarks = jamCount || 0
        await adminClient.from('jams').update({ stats }).eq('id', jamId)

        // Update Profile Stats
        const { count: userCount } = await adminClient
            .from('bookmarks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        await adminClient.from('profiles').update({ bookmarks_count: userCount || 0 }).eq('id', user.id)

        return new Response(JSON.stringify({ stats, isBookmarked }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
