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

        const { jamId, action, reason } = await req.json()
        
        if (action === 'unlist') {
            await adminClient.from('jams').update({ is_listed: false }).eq('id', jamId)
        } else if (action === 'list') {
            await adminClient.from('jams').update({ is_listed: true }).eq('id', jamId)
        }

        return standardResponse({ ok: true })
    } catch (error) {
        return standardResponse(normalizeError(error), 400)
    }
})
