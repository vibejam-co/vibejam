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

        const { url, jamId } = await req.json()
        
        // Mock scraping logic
        const extraction = {
            name: 'Scraped App',
            tagline: 'A beautiful app scraped from the web.',
            media: { heroImageUrl: 'https://picsum.photos/800/600' },
            techStack: ['React', 'Supabase'],
            vibeTools: ['Cursor']
        }

        return standardResponse({ ok: true, extraction })
    } catch (error) {
        return standardResponse(normalizeError(error), 400)
    }
})
