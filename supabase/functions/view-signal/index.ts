import \"jsr:@supabase/functions-js/edge-runtime.d.ts\"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError } from '../_shared/response.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    try {
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { jamId, sessionId } = await req.json()
        if (!jamId) throw new Error('jamId required')

        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const { allowed } = await checkRateLimit(adminClient, `view:${ip}`, 300, 3600);
        if (!allowed) return standardResponse({ ok: false, code: 'RATE_LIMITED' }, 429);

        // Dedupe and increment (Atomic in real app, here simple)
        const { data: jam } = await adminClient.from('jams').select('stats').eq('id', jamId).single()
        if (jam) {
            const stats = jam.stats || { views: 0, upvotes: 0, bookmarks: 0, comments: 0 }
            stats.views = (stats.views || 0) + 1
            await adminClient.from('jams').update({ stats }).eq('id', jamId);
            return standardResponse({ ok: true, views: stats.views });
        }

        return standardResponse({ ok: true });
    } catch (error) {
        return standardResponse(normalizeError(error), 400)
    }
})
