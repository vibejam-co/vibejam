import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError, corsHeaders } from '../_shared/response.ts'

const ALLOWED_BUCKETS = new Set(['jam-media', 'avatars'])
const ALLOWED_KINDS = new Set(['jam_hero', 'jam_image', 'avatar'])

const sanitizeExt = (ext: string) => ext.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'png'

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
        const kind = body.kind
        const jamId = body.jamId
        const profileId = body.profileId
        const ext = sanitizeExt(body.ext || '')

        if (!ALLOWED_BUCKETS.has(bucket)) {
            return standardResponse({ ok: false, code: 'INVALID_BUCKET', message: 'Unsupported bucket' }, 400)
        }
        if (!ALLOWED_KINDS.has(kind)) {
            return standardResponse({ ok: false, code: 'INVALID_KIND', message: 'Unsupported media kind' }, 400)
        }

        const ownerId = profileId || user.id
        const fileId = crypto.randomUUID()

        let path = ''
        if (bucket === 'avatars') {
            path = `${ownerId}/avatar-${fileId}.${ext}`
        } else {
            const safeJamId = jamId || 'draft'
            const label = kind === 'jam_image' ? 'image' : 'hero'
            path = `${ownerId}/jams/${safeJamId}/${label}-${fileId}.${ext}`
        }

        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data, error } = await adminClient.storage
            .from(bucket)
            .createSignedUploadUrl(path, { upsert: true })

        if (error || !data?.signedUrl || !data?.token) throw error

        const baseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const publicUrl = buildPublicUrl(baseUrl, bucket, data.path)

        return standardResponse({
            ok: true,
            uploadUrl: data.signedUrl,
            token: data.token,
            path: data.path,
            publicUrl
        }, 200)
    } catch (error) {
        return standardResponse(normalizeError(error), 500)
    }
})
