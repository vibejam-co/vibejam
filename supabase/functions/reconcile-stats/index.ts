import \"jsr:@supabase/functions-js/edge-runtime.d.ts\"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError } from '../_shared/response.ts'

Deno.serve(async (req) => {
    try {
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: jams } = await adminClient.from('jams').select('id, name, website_url')
        
        // Mock reconciliation logic
        console.log(`Reconciling ${jams?.length} jams...`)

        return standardResponse({ ok: true, processed: jams?.length })
    } catch (error) {
        return standardResponse(normalizeError(error), 400)
    }
})
