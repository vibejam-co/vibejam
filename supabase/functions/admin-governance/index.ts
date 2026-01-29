import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError } from '../_shared/response.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Verify Admin (Simple Secret for internal ops)
        const authHeader = req.headers.get('Authorization')
        const adminSecret = Deno.env.get('ADMIN_SHARED_SECRET') || 'vj_internal_trust';

        if (!authHeader?.includes(adminSecret)) {
            return standardResponse({ ok: false, error: 'Unauthorized Admin' }, 401);
        }

        const { action, targetId, jamId, data } = await req.json()
        const effectiveJamId = jamId || targetId;
        let result = { ok: true };

        // 2. Action Switch
        if (action === 'set_trust_flags') {
            const { data: profile, error } = await supabase
                .from('profiles')
                .update({ trust_flags: data }) // { verified: true, banned: false }
                .eq('id', targetId)
                .select()
                .single()
            if (error) throw error
            result = { ok: true, profile }

        } else if (action === 'flag_jam' || action === 'hide_jam') {
            const { error } = await supabase
                .from('jams')
                .update({ is_hidden: true, status: 'archived' })
                .eq('id', effectiveJamId)

            if (error) throw error

            // Log flag implicitly
            await supabase.from('moderation_flags').insert({
                jam_id: effectiveJamId,
                reason: data?.reason || 'Admin action',
                status: 'resolved',
                meta: { resolution: action === 'hide_jam' ? 'hidden' : 'flagged' }
            });

        } else if (action === 'unhide_jam' || action === 'list') {
            const { error } = await supabase
                .from('jams')
                .update({ is_hidden: false, status: 'published' })
                .eq('id', effectiveJamId)
            if (error) throw error

        } else if (action === 'unlist') {
            await supabase.from('jams').update({ status: 'draft' }).eq('id', effectiveJamId)

        } else if (action === 'recompute_leaderboards_now') {
            const scopes = data?.scopes || ['shipping_this_week', 'trending'];
            const results = [];

            for (const scope of scopes) {
                const { ok } = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/recompute-leaderboards`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ scope, force: true })
                }).then(r => r.json()).catch(e => ({ ok: false, error: String(e) }));
                results.push({ scope, ok });
            }
            result = { ok: true, results }
        }

        // 3. Audit
        await supabase.from('admin_actions').insert({
            action,
            target_id: targetId || jamId,
            actor: 'system_admin',
            meta: data
        })

        return standardResponse(result);

    } catch (error: any) {
        return standardResponse(normalizeError(error), 500);
    }
})
