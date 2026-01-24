import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError } from '../_shared/response.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    try {
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { action, targetId, jamId, reason, data, action_type } = await req.json()
        const effectiveJamId = jamId || targetId;

        let result;
        if (action === 'unlist') {
            await adminClient.from('jams').update({ status: 'draft' }).eq('id', effectiveJamId)
        } else if (action === 'list') {
            await adminClient.from('jams').update({ status: 'published' }).eq('id', effectiveJamId)
        } else if (action === 'set_trust_flags') {
            const { data: profile, error } = await adminClient
                .from('profiles')
                .update({ trust_flags: data })
                .eq('id', targetId)
                .select()
                .single()
            if (error) throw error
            result = profile
        } else if (action === 'flag_jam') {
            const { data: flag, error } = await adminClient
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
        await adminClient.from('admin_actions').insert({
            action_type: action,
            target_type: action === 'set_trust_flags' ? 'profile' : 'jam',
            target_id: targetId || jamId,
            metadata: data || { reason }
        })

        return standardResponse({ ok: true, result })
    } catch (error) {
        return standardResponse(normalizeError(error), 400)
    }
})
