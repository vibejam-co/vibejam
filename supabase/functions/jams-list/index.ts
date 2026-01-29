import \"jsr:@supabase/functions-js/edge-runtime.d.ts\"
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

        const { filter, sort, limit = 20 } = await req.json().catch(() => ({}))
        
        let query = adminClient
            .from('jams')
            .select('*')
            .eq('status', 'published')
            .eq('is_listed', true)

        if (sort === 'newest') query = query.order('published_at', { ascending: false })
        else query = query.order('stats->upvotes', { ascending: false })

        const { data, error } = await query.limit(limit)
        if (error) throw error

        return standardResponse({ ok: true, data })
    } catch (error) {
        return standardResponse(normalizeError(error), 400)
    }
})
