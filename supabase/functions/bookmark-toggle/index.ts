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
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role to update stats
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // User context
        const userClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: authError } = await userClient.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized')

        const { jamId } = await req.json()
        if (!jamId) throw new Error('jamId required')

        // Check existing
        const { data: existing } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', user.id)
            .eq('jam_id', jamId)
            .single()

        let isBookmarked = false

        if (existing) {
            await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('jam_id', jamId)
            isBookmarked = false
        } else {
            await supabase.from('bookmarks').insert({ user_id: user.id, jam_id: jamId })
            isBookmarked = true
        }

        // Update Jam Stats (count bookmarks)
        const { count: jamCount } = await supabase
            .from('bookmarks')
            .select('*', { count: 'exact', head: true })
            .eq('jam_id', jamId)

        const { data: jam } = await supabase.from('jams').select('stats').eq('id', jamId).single()
        const stats = jam?.stats || {}
        stats.bookmarks = jamCount || 0
        await supabase.from('jams').update({ stats }).eq('id', jamId)

        // Update Profile Stats
        const { count: userCount } = await supabase
            .from('bookmarks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        await supabase.from('profiles').update({ bookmarks_count: userCount || 0 }).eq('id', user.id)

        return new Response(JSON.stringify({ stats, isBookmarked }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
