import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError } from '../_shared/response.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    try {
<<<<<<< HEAD
=======
        // Admin Client: Service Role for writing stats/dedupe
>>>>>>> c13cbec (feat: resolve Jam launch issues and restore discovery feed)
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { jamId, sessionId } = await req.json()
        if (!jamId) throw new Error('jamId required')

<<<<<<< HEAD
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const { allowed } = await checkRateLimit(adminClient, `view:${ip}`, 300, 3600);
        if (!allowed) return standardResponse({ ok: false, code: 'RATE_LIMITED' }, 429);

        // 1. Construct Dedupe Key
        // key: view_{jamId}_{userIdOrSessionId}_{yyyy-mm-dd-hh}
        const date = new Date()
        const hourKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`
=======
        // 1. Rate Check
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const { allowed } = await checkRateLimit(adminClient, `view:${ip}`, 300, 3600); // 300 views/hour per IP
        if (!allowed) {
            return standardResponse({ ok: false, code: 'RATE_LIMITED' }, 429);
        }
>>>>>>> c13cbec (feat: resolve Jam launch issues and restore discovery feed)

        // 2. Determine User ID (Safe Auth Check)
        let userId = 'anon'
        const authHeader = req.headers.get('Authorization')
        if (authHeader) {
            const authClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_ANON_KEY') ?? '',
                { global: { headers: { Authorization: authHeader } } }
            )
            const { data: { user } } = await authClient.auth.getUser()
            if (user) userId = user.id
        }

        // 3. Construct Dedupe Key
        // key: view_{jamId}_{userIdOrSessionId}_{yyyy-mm-dd-hh}
        const date = new Date()
        const hourKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`
        const distinctId = userId !== 'anon' ? userId : (sessionId || 'unknown')
        const key = `view_${jamId}_${distinctId}_${hourKey}`

<<<<<<< HEAD
        // 2. Check Dedupe via signals_dedupe table
        const { error: insertError } = await adminClient
            .from('signals_dedupe')
            .insert({ id: key })

        let stats = null
=======
        // 4. Dedupe Insert
        const { error: insertError } = await adminClient
            .from('signals_dedupe')
            .insert({ id: key }) // table must exist
>>>>>>> c13cbec (feat: resolve Jam launch issues and restore discovery feed)

        // 5. Update Stats (if unique)
        if (!insertError) {
<<<<<<< HEAD
            // Unique view: Increment stats
            const { data: jam } = await adminClient.from('jams').select('stats').eq('id', jamId).single()
            if (jam) {
                stats = jam.stats || { views: 0, upvotes: 0, bookmarks: 0, commentsCount: 0 }
                stats.views = (stats.views || 0) + 1
                await adminClient.from('jams').update({ stats }).eq('id', jamId);
            }
        } else {
            // Fetch current to return if it was already deduped
            const { data: jam } = await adminClient.from('jams').select('stats').eq('id', jamId).single()
            if (jam) stats = jam.stats
        }

        return standardResponse({ ok: true, stats });

    } catch (error) {
        return standardResponse(normalizeError(error), 400)
=======
            // Atomic increment via RPC would be better, but read-modify-write is MVP acceptable here
            const { data: jam } = await adminClient.from('jams').select('stats').eq('id', jamId).single()
            if (jam) {
                const stats = jam.stats || { views: 0, upvotes: 0, bookmarks: 0, comments: 0 }
                stats.views = (stats.views || 0) + 1

                await adminClient.from('jams').update({ stats }).eq('id', jamId);

                return standardResponse({ ok: true, views: stats.views });
            }
        }

        return standardResponse({ ok: true, dedicated: false });

    } catch (error: any) {
        return standardResponse(normalizeError(error), 400);
>>>>>>> c13cbec (feat: resolve Jam launch issues and restore discovery feed)
    }
})
