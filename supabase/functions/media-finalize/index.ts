import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError, corsHeaders } from '../_shared/response.ts'

const ALLOWED_BUCKETS = new Set(['jam-media', 'avatars'])
const ALLOWED_SLOTS = new Set(['hero', 'image', 'avatar'])

const buildPublicUrl = (baseUrl: string, bucket: string, path: string) => {
    const encodedPath = path.split('/').map(encodeURIComponent).join('/')
    return `${baseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return standardResponse({ ok: false, code: 'UNAUTHORIZED', message: 'Authorization required' }, 401)
        }

        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) {
            return standardResponse({ ok: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, 401)
        }

        const body = await req.json().catch(() => ({}))
        const bucket = body.bucket
        const path = body.path
        const jamId = body.jamId
        const profileId = body.profileId
        const slot = body.slot

        if (!ALLOWED_BUCKETS.has(bucket)) {
            return standardResponse({ ok: false, code: 'INVALID_BUCKET', message: 'Unsupported bucket' }, 400)
        }
        if (!ALLOWED_SLOTS.has(slot)) {
            return standardResponse({ ok: false, code: 'INVALID_SLOT', message: 'Unsupported slot' }, 400)
        }
        if (!path) {
            return standardResponse({ ok: false, code: 'INVALID_PATH', message: 'Path is required' }, 400)
        }

        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const baseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const publicUrl = buildPublicUrl(baseUrl, bucket, path)

        if (slot === 'avatar' || bucket === 'avatars') {
            const targetProfile = profileId || user.id
            const { data, error } = await adminClient
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', targetProfile)
                .select()
                .single()

            if (error) throw error

            return standardResponse({ ok: true, updated: true, url: publicUrl, profile: data }, 200)
        }

        if (!jamId) {
            return standardResponse({ ok: false, code: 'INVALID_JAM', message: 'jamId is required for jam media' }, 400)
        }

        const { data: jam, error: jamError } = await adminClient
            .from('jams')
            .select('media')
            .eq('id', jamId)
            .eq('creator_id', user.id)
            .maybeSingle()

        if (jamError || !jam) {
            return standardResponse({ ok: false, code: 'NOT_FOUND', message: 'Jam not found or unauthorized' }, 404)
        }

        const media = { ...(jam.media || {}) }
        if (slot === 'hero') {
            media.heroImageUrl = publicUrl
        } else if (slot === 'image') {
            const existing = Array.isArray(media.imageUrls) ? media.imageUrls : []
            media.imageUrls = Array.from(new Set([publicUrl, ...existing]))
        }

        const { error: updateError } = await adminClient
            .from('jams')
            .update({ media, updated_at: new Date().toISOString() })
            .eq('id', jamId)
            .eq('creator_id', user.id)

        if (updateError) throw updateError

        return standardResponse({ ok: true, updated: true, url: publicUrl }, 200)
    } catch (error) {
        return standardResponse(normalizeError(error), 500)
    }
})
