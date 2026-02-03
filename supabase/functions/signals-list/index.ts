import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError, corsHeaders } from '../_shared/response.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { jamId, limit = 200 } = await req.json().catch(() => ({}))
        if (!jamId) {
            return standardResponse({ ok: false, code: 'INVALID_INPUT', message: 'jamId required' }, 400)
        }

        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const safeLimit = Math.max(1, Math.min(500, limit || 200))

        const { data, error } = await adminClient
            .from('jam_signals')
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
            .eq('jam_id', jamId)
            .order('created_at', { ascending: true })
            .limit(safeLimit)

        if (error) throw error

        return standardResponse({ ok: true, items: data || [] }, 200)
    } catch (error) {
        return standardResponse(normalizeError(error), 500)
    }
})
