import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError } from '../_shared/response.ts'

Deno.serve(async (req) => {
<<<<<<< HEAD
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }
=======
    if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
>>>>>>> c13cbec (feat: resolve Jam launch issues and restore discovery feed)

    try {
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

<<<<<<< HEAD
        const { action, targetId, jamId, reason, data, action_type } = await req.json()
        const effectiveJamId = jamId || targetId;

        let result;
        if (action === 'unlist') {
            await adminClient.from('jams').update({ status: 'draft' }).eq('id', effectiveJamId)
        } else if (action === 'list') {
            await adminClient.from('jams').update({ status: 'published' }).eq('id', effectiveJamId)
        } else if (action === 'set_trust_flags') {
            const { data: profile, error } = await adminClient
=======
        // 1. Verify Admin (Simple Secret for internal ops)
        const authHeader = req.headers.get('Authorization')
        const adminSecret = Deno.env.get('ADMIN_SHARED_SECRET') || 'vj_internal_trust';

        if (!authHeader?.includes(adminSecret)) {
            return standardResponse({ ok: false, error: 'Unauthorized Admin' }, 401);
        }

        const { action, targetId, data } = await req.json()
        let result = { ok: true };

        // 2. Action Switch
        if (action === 'set_trust_flags') {
            // ... (existing logic)
            const { data: profile, error } = await supabase
>>>>>>> c13cbec (feat: resolve Jam launch issues and restore discovery feed)
                .from('profiles')
                .update({ trust_flags: data }) // { verified: true, banned: false }
                .eq('id', targetId)
                .select()
                .single()
            if (error) throw error
<<<<<<< HEAD
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
=======
            result = { ok: true, profile }

        } else if (action === 'hide_jam') {
            const { error } = await supabase
                .from('jams')
                .update({ is_hidden: true, status: 'archived' })
                .eq('id', targetId)
>>>>>>> c13cbec (feat: resolve Jam launch issues and restore discovery feed)
            if (error) throw error

            // Log flag implicitly
            await supabase.from('moderation_flags').insert({
                jam_id: targetId,
                reason: data?.reason || 'Admin hidden',
                status: 'resolved',
                meta: { resolution: 'hidden' }
            });

        } else if (action === 'unhide_jam') {
            const { error } = await supabase
                .from('jams')
                .update({ is_hidden: false, status: 'published' })
                .eq('id', targetId)
            if (error) throw error

        } else if (action === 'recompute_leaderboards_now') {
            // Trigger the recompute function internally (or just call logic if shared, but calling function saves memory/code duplication here)
            const scopes = data?.scopes || ['shipping_this_week', 'trending'];
            const results = [];

            for (const scope of scopes) {
                // We use standard fetch to call neighbor function
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

<<<<<<< HEAD
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
=======
        // 3. Audit
        await supabase.from('admin_actions').insert({
            action,
            target_id: targetId,
            actor: 'system_admin',
            meta: data
        })

        return standardResponse(result);

    } catch (error: any) {
        return standardResponse(normalizeError(error), 500);
>>>>>>> c13cbec (feat: resolve Jam launch issues and restore discovery feed)
    }
})
