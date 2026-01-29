import \"jsr:@supabase/functions-js/edge-runtime.d.ts\"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError } from '../_shared/response.ts'

Deno.serve(async (req) => {
    try {
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Snapshot top creators
        const { data: top } = await adminClient
            .from('profiles')
            .select('id, display_name, handle, avatar_url, created_at')
            .limit(10)

        // Update leaderboard table
        return standardResponse({ ok: true, snapshot: top })
    } catch (error) {
        return standardResponse(normalizeError(error), 400)
    }
})
