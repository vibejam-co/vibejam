
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    try {
        const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
        const { jamId, sessionId } = await req.json()
        const key = `view_${jamId}_${sessionId}_${new Date().getHours()}`
        const { error: insertError } = await supabase.from('signals_dedupe').insert({ id: key })
        if (!insertError) {
            const { data: jam } = await supabase.from('jams').select('stats').eq('id', jamId).single()
            if (jam) {
                const stats = jam.stats || { views: 0 }
                stats.views = (stats.views || 0) + 1
                await supabase.from('jams').update({ stats }).eq('id', jamId)
            }
        }
        return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (error) { return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
})
