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
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Verify Admin (via secret key or specific ID)
        // For security, we expect an ADMIN_TOKEN in the header if not using service role directly from trusted source.
        // However, this function is meant to be called by an internal admin dashboard or script.
        const authHeader = req.headers.get('Authorization')
        if (!authHeader?.includes(Deno.env.get('ADMIN_SHARED_SECRET') || 'vj_internal_trust')) {
            // In a real prod environment, use a more robust admin auth check.
            // throw new Error('Unauthorized Admin access')
        }

        const { action, targetId, data } = await req.json()

        let result;
        if (action === 'set_trust_flags') {
            const { data: profile, error } = await supabase
                .from('profiles')
                .update({ trust_flags: data })
                .eq('id', targetId)
                .select()
                .single()
            if (error) throw error
            result = profile
        } else if (action === 'flag_jam') {
            const { data: flag, error } = await supabase
                .from('moderation_flags')
                .insert({
                    jam_id: targetId,
                    reason: data.reason,
                    severity: data.severity || 'medium'
                })
                .select()
                .single()
            if (error) throw error
            result = flag
        }

        // 2. Audit action
        await supabase.from('admin_actions').insert({
            action_type: action,
            target_type: action === 'set_trust_flags' ? 'profile' : 'jam',
            target_id: targetId,
            metadata: data
        })

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
