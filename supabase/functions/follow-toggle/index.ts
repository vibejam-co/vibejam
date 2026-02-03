import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError, corsHeaders } from '../_shared/response.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return standardResponse({ ok: false, code: 'UNAUTHORIZED', message: 'Authorization required' }, 401)
        }

        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) {
            return standardResponse({ ok: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401)
        }

        const { targetId, handle } = await req.json().catch(() => ({}))
        if (!targetId && !handle) {
            return standardResponse({ ok: false, code: 'INVALID_INPUT', message: 'targetId or handle required' }, 400)
        }

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
            return standardResponse({ ok: false, code: 'INVALID_INPUT', message: 'Target not found' }, 404)
        }
        if (resolvedTargetId === user.id) {
            return standardResponse({ ok: false, code: 'INVALID_ACTION', message: 'Cannot follow نفسك' }, 400)
        }

        const { data: existing } = await adminClient
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', resolvedTargetId)
            .maybeSingle()

        let isFollowing = false
        if (existing) {
            await adminClient.from('follows').delete().eq('follower_id', user.id).eq('following_id', resolvedTargetId)
            isFollowing = false
        } else {
            await adminClient.from('follows').insert({ follower_id: user.id, following_id: resolvedTargetId })
            isFollowing = true
        }

        const { count: followersCount } = await adminClient
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', resolvedTargetId)

        const { count: followingCount } = await adminClient
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', user.id)

        return standardResponse({
            ok: true,
            isFollowing,
            followersCount: followersCount || 0,
            followingCount: followingCount || 0,
            targetId: resolvedTargetId
        }, 200)
    } catch (error) {
        return standardResponse(normalizeError(error), 500)
    }
})
