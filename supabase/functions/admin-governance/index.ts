
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
        const { action, targetId, data } = await req.json()
        let result;
        if (action === 'set_trust_flags') {
            const { data: p } = await supabase.from('profiles').update({ trust_flags: data }).eq('id', targetId).select().single()
            result = p
        } else if (action === 'flag_jam') {
            const { data: f } = await supabase.from('moderation_flags').insert({ jam_id: targetId, reason: data.reason }).select().single()
            result = f
        }
        await supabase.from('admin_actions').insert({ action_type: action, target_type: 'res', target_id: targetId, metadata: data })
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (error) { return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
})
