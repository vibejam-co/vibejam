import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError, corsHeaders } from '../_shared/response.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { targetId, handle, kind = 'followers', limit = 100 } = await req.json().catch(() => ({}))
        if (!targetId && !handle) {
            return standardResponse({ ok: false, code: 'INVALID_INPUT', message: 'targetId or handle required' }, 400)
        }
        if (kind !== 'followers' && kind !== 'following') {
            return standardResponse({ ok: false, code: 'INVALID_INPUT', message: 'kind must be followers|following' }, 400)
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

        const safeLimit = Math.max(1, Math.min(500, limit || 100))

        const selectProfile = `
            profile:profiles!follows_${kind === 'followers' ? 'follower_id' : 'following_id'}_fkey (
                id,
                display_name,
                handle,
                avatar_url,
                badges,
                trust_flags
            )
        `

        const baseQuery = adminClient.from('follows').select(selectProfile).limit(safeLimit)
        const { data, error } = kind === 'followers'
            ? await baseQuery.eq('following_id', resolvedTargetId)
            : await baseQuery.eq('follower_id', resolvedTargetId)

        if (error) throw error

        const profiles = (data || []).map((row: any) => row.profile).filter(Boolean)

        const { data: { user } } = await authClient.auth.getUser().catch(() => ({ data: { user: null } }))

        let followingSet = new Set<string>()
        if (user && profiles.length > 0) {
            const ids = profiles.map((p: any) => p.id)
            const { data: followingRows } = await adminClient
                .from('follows')
                .select('following_id')
                .eq('follower_id', user.id)
                .in('following_id', ids)
            followingSet = new Set((followingRows || []).map((r: any) => r.following_id))
        }

        const items = profiles.map((p: any) => ({
            id: p.id,
            name: p.display_name || 'Maker',
            handle: p.handle ? `@${p.handle}` : '@maker',
            avatar: p.avatar_url || '',
            badge: p.badges?.[0]?.type,
            isFollowing: user ? followingSet.has(p.id) : false,
            trust_flags: p.trust_flags || null
        }))

        return standardResponse({ ok: true, items, targetId: resolvedTargetId, kind }, 200)
    } catch (error) {
        return standardResponse(normalizeError(error), 500)
    }
})
