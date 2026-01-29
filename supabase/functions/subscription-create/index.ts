import \"jsr:@supabase/functions-js/edge-runtime.d.ts\"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError } from '../_shared/response.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    try {
        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )
        const { data: { user } } = await authClient.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { planId } = await req.json()
        
        const { data: subscription } = await adminClient
            .from('subscriptions')
            .insert({
                user_id: user.id,
                plan_id: planId,
                status: 'active'
            })
            .select()
            .single()

        return standardResponse({ ok: true, subscription })
    } catch (error) {
        return standardResponse(normalizeError(error), 400)
    }
})
