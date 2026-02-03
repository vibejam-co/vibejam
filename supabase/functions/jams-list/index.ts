import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError, corsHeaders } from '../_shared/response.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { sort = 'trending', category, limit = 20, offset = 0, windowDays = 7 } = await req.json().catch(() => ({}))

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
            .neq('is_hidden', true)

        if (category && category !== 'All') {
            query = query.eq('category', category)
        }

        const safeLimit = Math.max(1, Math.min(200, limit || 20))
        const safeOffset = Math.max(0, offset || 0)
        const fetchLimit = Math.min(200, Math.max(safeLimit + safeOffset, 50))

        // Fetch a wider window then sort in-process to support flexible rules.
        const { data, error } = await query
            .order('published_at', { ascending: false })
            .range(0, fetchLimit - 1)
        if (error) throw error

        const now = Date.now()
        const windowMs = Math.max(1, windowDays) * 24 * 60 * 60 * 1000

        const normalized = (data || []).map((j: any) => {
            const publishedAt = j.published_at || j.publishedAt || null
            const publishedAtMs = publishedAt ? new Date(publishedAt).getTime() : 0
            const upvotes = j.stats?.upvotes ?? 0
            const mrrValue = j.mrr_value ?? 0
            return {
                ...j,
                __publishedAtMs: publishedAtMs,
                __isNew: publishedAtMs ? (now - publishedAtMs <= windowMs) : false,
                __upvotes: upvotes,
                __mrrValue: mrrValue
            }
        })

        let result = normalized

        if (sort === 'new') {
            result = result
                .filter(j => j.__isNew)
                .sort((a, b) => (b.__upvotes - a.__upvotes) || (b.__publishedAtMs - a.__publishedAtMs))
        } else if (sort === 'revenue') {
            result = result
                .sort((a, b) => (b.__mrrValue - a.__mrrValue) || (b.__upvotes - a.__upvotes) || (b.__publishedAtMs - a.__publishedAtMs))
        } else if (sort === 'picks') {
            result = result
                .sort((a, b) => (b.__upvotes - a.__upvotes) || (b.__publishedAtMs - a.__publishedAtMs))
        } else {
            // trending (default): most upvotes always take top spot; recency breaks ties.
            result = result
                .sort((a, b) => (b.__upvotes - a.__upvotes) || (b.__publishedAtMs - a.__publishedAtMs))
        }

        const sliced = result.slice(safeOffset, safeOffset + safeLimit)
        return standardResponse({ ok: true, jams: sliced, source: 'supabase' }, 200, corsHeaders)
    } catch (error) {
        return standardResponse(normalizeError(error), 400, corsHeaders)
    }
})
