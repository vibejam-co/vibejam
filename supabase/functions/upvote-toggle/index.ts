
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
        const { jamId } = await req.json()
        const { data: existing } = await supabase.from('jam_upvotes').select('*').eq('user_id', user.id).eq('jam_id', jamId).single()
        if (existing) {
            await supabase.from('jam_upvotes').delete().eq('user_id', user.id).eq('jam_id', jamId)
        } else {
            await supabase.from('jam_upvotes').insert({ user_id: user.id, jam_id: jamId })
        }
        const { count } = await supabase.from('jam_upvotes').select('*', { count: 'exact', head: true }).eq('jam_id', jamId)
        await supabase.from('jams').update({ "stats->upvotes": count }).eq('id', jamId)
        return new Response(JSON.stringify({ ok: true, count }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (error) { return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
})
