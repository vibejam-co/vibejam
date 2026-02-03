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

        const client = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await client.auth.getUser()
        if (authError || !user) {
            return standardResponse({ ok: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401)
        }

        const { data, error } = await client
            .from('jams')
            .select('*')
            .eq('creator_id', user.id)
            .eq('status', 'draft')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) throw error

        return standardResponse({ ok: true, jam: data || null, source: 'supabase' }, 200)
    } catch (error) {
        return standardResponse(normalizeError(error), 500)
    }
})
