import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError, corsHeaders } from '../_shared/response.ts'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization') || ''
        const client = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined
        )

        const { jamId, slug } = await req.json().catch(() => ({}))
        const target = slug || jamId
        if (!target) {
            return standardResponse({ ok: false, code: 'INVALID_INPUT', message: 'jamId or slug is required' }, 400)
        }

        const select = `
            *,
            creator:profiles!jams_creator_id_fkey (
                id,
                display_name,
                handle,
                avatar_url,
                bio,
                badges,
                trust_flags,
                monetization_status
            )
        `

        const query = UUID_REGEX.test(jamId || '')
            ? client.from('jams').select(select).eq('id', jamId)
            : client.from('jams').select(select).eq('slug', target)

        const { data, error } = await query.maybeSingle()
        if (error) throw error
        if (!data) {
            return standardResponse({ ok: false, code: 'NOT_FOUND', message: 'Jam not found' }, 404)
        }

        return standardResponse({ ok: true, jam: data, source: 'supabase' }, 200)
    } catch (error) {
        return standardResponse(normalizeError(error), 500)
    }
})
