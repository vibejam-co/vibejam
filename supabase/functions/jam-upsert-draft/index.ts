import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client-request-id',
}

function dbKeyMapping(key: string): string {
    if (key === 'teamType') return 'team_type';
    if (key === 'vibeTools') return 'vibe_tools';
    if (key === 'techStack') return 'tech_stack';
    if (key === 'isPrivate') return 'is_private';
    if (key === 'isListed') return 'is_listed';
    if (key === 'websiteUrl') return 'website_url';
    if (key === 'appUrl') return 'app_url';
    if (key === 'mrrBucket') return 'mrr_bucket';
    if (key === 'mrrValue') return 'mrr_value';
    if (key === 'mrrVisibility') return 'mrr_visibility';
    return key;
}

const ALLOWED_COLUMNS = [
    'creator_id', 'status', 'name', 'tagline', 'description', 'category', 'team_type',
    'website_url', 'app_url', 'socials', 'vibe_tools', 'tech_stack',
    'mrr_bucket', 'mrr_value', 'mrr_visibility', 'media', 'stats', 'rank',
    'published_at', 'is_hidden', 'is_listed', 'listed_at', 'slug', 'is_private'
];

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const requestId = req.headers.get('x-client-request-id') || crypto.randomUUID();
    console.log(`[${requestId}] === JAM-UPSERT-DRAFT START ===`);

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error(`[${requestId}] No Authorization header`);
            throw new Error('Unauthorized');
        }

        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) {
            console.error(`[${requestId}] Auth failed: ${authError?.message || 'no user'}`);
            throw new Error('Unauthorized');
        }
        console.log(`[${requestId}] User: ${user.id}`);

        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Ensure profile exists
        const { data: profileExists } = await adminClient.from('profiles').select('id').eq('id', user.id).maybeSingle();
        if (!profileExists) {
            console.log(`[${requestId}] Profile missing, creating stub...`);
            await adminClient.from('profiles').insert({
                id: user.id,
                display_name: user.user_metadata?.full_name || 'Maker',
                handle: `user_${user.id.slice(0, 5)}`
            });
        }

        const body = await req.json();
        console.log(`[${requestId}] Request Body:`, JSON.stringify(body));

        let { jamId, websiteUrl, patch, ...rest } = body;

        // 1. Validate UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (jamId && !uuidRegex.test(jamId)) {
            console.warn(`[${requestId}] Invalid UUID: ${jamId}`);
            jamId = undefined;
        }

        // 2. Prepare Updates
        const sourceData = { ...rest, ...(patch || {}) };
        const updates: any = {};

        Object.keys(sourceData).forEach(key => {
            const mappedKey = dbKeyMapping(key);
            if (ALLOWED_COLUMNS.includes(mappedKey) && sourceData[key] !== undefined) {
                let value = sourceData[key];

                // Sanitization
                if (mappedKey === 'mrr_value') {
                    if (typeof value === 'string') {
                        const num = value.replace(/[^0-9.]/g, '');
                        value = num ? parseFloat(num) : 0;
                    }
                }

                if ((mappedKey === 'tech_stack' || mappedKey === 'vibe_tools') && !Array.isArray(value)) {
                    value = typeof value === 'string' ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
                }

                updates[mappedKey] = value;
            }
        });

        // 3. Special handling for websiteUrl (camelCase)
        if (websiteUrl && !updates.website_url) {
            updates.website_url = websiteUrl;
        }

        // 4. Publishing Logic
        if (updates.status === 'published') {
            updates.published_at = updates.published_at || new Date().toISOString();
            updates.is_listed = (updates.is_listed !== undefined) ? updates.is_listed : true;
            if (updates.is_listed) {
                updates.listed_at = updates.published_at;
            }
            if (!updates.slug && updates.name) {
                // Generate a simple slug if missing
                updates.slug = `${updates.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${(jamId || crypto.randomUUID()).slice(0, 8)}`;
            }
        }

        let result: any = null;

        // 5. Execution
        if (jamId) {
            console.log(`[${requestId}] Attempting update for: ${jamId}`);
            const { data, error: updateError } = await adminClient
                .from('jams')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', jamId)
                .eq('creator_id', user.id)
                .select()
                .single();

            if (updateError) {
                console.error(`[${requestId}] DB Update Error:`, updateError);
                throw new Error(`Database Error (Update): ${updateError.message}`);
            }
            result = data;
        } else if (updates.website_url) {
            console.log(`[${requestId}] Lookup by URL: ${updates.website_url}`);
            const { data: existing } = await adminClient
                .from('jams')
                .select('*')
                .eq('creator_id', user.id)
                .eq('website_url', updates.website_url)
                .eq('status', 'draft')
                .maybeSingle();

            if (existing) {
                console.log(`[${requestId}] Updating existing draft: ${existing.id}`);
                const { data, error: updateError } = await adminClient
                    .from('jams')
                    .update({ ...updates, updated_at: new Date().toISOString() })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error(`[${requestId}] DB Update (Lookup) Error:`, updateError);
                    throw new Error(`Database Error (Update/Lookup): ${updateError.message}`);
                }
                result = data;
            }
        }

        if (!result) {
            console.log(`[${requestId}] Creating new record`);
            if (!updates.website_url && !updates.name) {
                throw new Error('Name or Website URL is required to start a Jam.');
            }

            const insertPayload = {
                creator_id: user.id,
                status: 'draft',
                ...updates,
                updated_at: new Date().toISOString()
            };

            const { data, error: insertError } = await adminClient
                .from('jams')
                .insert(insertPayload)
                .select()
                .single();

            if (insertError) {
                console.error(`[${requestId}] DB Insert Error:`, insertError);
                throw new Error(`Database Error (Insert): ${insertError.message}`);
            }
            result = data;
        }

        console.log(`[${requestId}] SUCCESS. id: ${result.id}`);
        return new Response(JSON.stringify({
            ok: true,
            success: true,
            jam_id: result.id,
            id: result.id,
            data: result,
            live_url: result.status === 'published' ? (Deno.env.get('SITE_URL') || 'https://vibejam.co') + '/jam/' + result.id : null
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error(`[${requestId}] ERROR:`, error.message);
        return new Response(JSON.stringify({
            ok: false,
            success: false,
            error: error.name === 'Error' ? error.message : 'INTERNAL_ERROR',
            message: error.message,
            details: error
        }), {
            status: error.message === 'Unauthorized' ? 401 : 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
