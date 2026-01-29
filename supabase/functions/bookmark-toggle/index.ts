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

        const { jamId } = await req.json()
        
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: existing } = await adminClient
            .from('bookmarks')
            .select('*')
            .eq('user_id', user.id)
            .eq('jam_id', jamId)
            .single()

        if (existing) {
            await adminClient.from('bookmarks').delete().eq('user_id', user.id).eq('jam_id', jamId)
        } else {
            await adminClient.from('bookmarks').insert({ user_id: user.id, jam_id: jamId })
        }

        return standardResponse({ ok: true, isBookmarked: !existing })
    } catch (error) {
        return standardResponse(normalizeError(error), 400)
    }
})
