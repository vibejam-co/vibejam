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

        const { jamId, content, parentId } = await req.json().catch(() => ({}))
        const clean = (content || '').trim()
        if (!jamId || !clean) {
            return standardResponse({ ok: false, code: 'INVALID_INPUT', message: 'jamId and content are required' }, 400)
        }
        if (clean.length > 2000) {
            return standardResponse({ ok: false, code: 'CONTENT_TOO_LONG', message: 'Signal is too long' }, 400)
        }

        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data, error } = await adminClient
            .from('jam_signals')
            .insert({
                jam_id: jamId,
                user_id: user.id,
                parent_id: parentId || null,
                content: clean
            })
            .select(`
                id,
                jam_id,
                user_id,
                parent_id,
                content,
                created_at,
                profile:profiles!jam_signals_user_id_fkey (
                    id,
                    display_name,
                    handle,
                    avatar_url,
                    badges
                )
            `)
            .single()

        if (error) throw error

        return standardResponse({ ok: true, item: data }, 200)
    } catch (error) {
        return standardResponse(normalizeError(error), 500)
    }
})
