import \"jsr:@supabase/functions-js/edge-runtime.d.ts\"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError } from '../_shared/response.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    try {
        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )
        const { data: { user } } = await authClient.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { jamId, websiteUrl, name, source, patch } = await req.json()
        
        // Upsert logic
        const { data, error } = await adminClient
            .from('jams')
            .upsert({
                id: jamId || undefined,
                creator_id: user.id,
                name: name || patch?.name,
                website_url: websiteUrl || patch?.website_url,
                category: patch?.category,
                tagline: patch?.tagline,
                tech_stack: patch?.tech_stack,
                vibe_tools: patch?.vibeTools,
                mrr_bucket: patch?.mrr_bucket,
                mrr_visibility: patch?.mrr_visibility,
                media: patch?.media,
                status: 'draft',
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error

        return standardResponse({ ok: true, jam: data })
    } catch (error) {
        return standardResponse(normalizeError(error), 400)
    }
})
