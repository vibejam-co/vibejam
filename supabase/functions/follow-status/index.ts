import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError, corsHeaders } from '../_shared/response.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { targetId, handle } = await req.json().catch(() => ({}))
        if (!targetId && !handle) {
            return standardResponse({ ok: false, code: 'INVALID_INPUT', message: 'targetId or handle required' }, 400)
        }

        const authHeader = req.headers.get('Authorization')
        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined
        )

        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        let resolvedTargetId = targetId as string | undefined
        if (!resolvedTargetId && handle) {
            const clean = String(handle).replace('@', '')
            const { data: profile, error: pErr } = await adminClient
                .from('profiles')
                .select('id')
                .eq('handle', clean)
                .maybeSingle()
            if (pErr || !profile) {
                return standardResponse({ ok: false, code: 'NOT_FOUND', message: 'Target not found' }, 404)
            }
            resolvedTargetId = profile.id
        }

        if (!resolvedTargetId) {
            return standardResponse({ ok: false, code: 'NOT_FOUND', message: 'Target not found' }, 404)
        }

        const { data: { user } } = await authClient.auth.getUser().catch(() => ({ data: { user: null } }))

        let isFollowing = false
        if (user) {
            const { count } = await adminClient
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', user.id)
                .eq('following_id', resolvedTargetId)
            isFollowing = !!count
        }

        const { count: followersCount } = await adminClient
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', resolvedTargetId)

        return standardResponse({
            ok: true,
            isFollowing,
            followersCount: followersCount || 0,
            targetId: resolvedTargetId
        }, 200)
    } catch (error) {
        return standardResponse(normalizeError(error), 500)
    }
})
