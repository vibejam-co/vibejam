import "jsr:@supabase/functions-js/edge-runtime.d.ts"
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

        const { sort = 'trending', category, limit = 20, offset = 0 } = await req.json().catch(() => ({}))

        let query = adminClient
            .from('jams')
            .select(`
        *,
        creator:profiles!jams_creator_id_fkey (
          id,
          display_name,
          handle,
          avatar_url,
          type,
          trust_flags,
          monetization_status
        )
      `)
            .eq('status', 'published')
            .eq('is_listed', true)

        if (category && category !== 'All') {
            query = query.eq('category', category)
        }

        // Apply Sorting
        if (sort === 'trending') {
            query = query.order('rank->scoreTrending', { ascending: false })
        } else if (sort === 'revenue') {
            query = query.order('mrr_value', { ascending: false, nullsFirst: false }).order('rank->scoreRevenue', { ascending: false })
        } else if (sort === 'new') {
            query = query.order('published_at', { ascending: false })
        } else if (sort === 'picks') {
            query = query.order('rank->scoreTrending', { ascending: false })
        }

        const { data, error } = await query.range(offset, offset + limit - 1)
        if (error) throw error

        return standardResponse({ ok: true, jams: data, source: 'supabase' })
    } catch (error) {
        return standardResponse(normalizeError(error), 400)
    }
})
    }
})
