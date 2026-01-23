
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    try {
        const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { global: { headers: { Authorization: req.headers.get('Authorization')! } } })
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')
        const { data: jams } = await supabase.from('jams').select('id, name, stats').eq('creator_id', user.id)
        const summary = {
            totalJams: jams?.length || 0,
            totalViews: jams?.reduce((acc, j) => acc + (j.stats?.views || 0), 0) || 0,
            totalUpvotes: jams?.reduce((acc, j) => acc + (j.stats?.upvotes || 0), 0) || 0,
            totalBookmarks: jams?.reduce((acc, j) => acc + (j.stats?.bookmarks || 0), 0) || 0
        }
        return new Response(JSON.stringify({ summary, jams }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (error) { return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
})
