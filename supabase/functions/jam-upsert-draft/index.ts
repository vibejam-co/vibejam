import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        const body = await req.json()
        const { jamId, websiteUrl, patch, source } = body

        if (!websiteUrl && !jamId) {
            return new Response(JSON.stringify({ error: 'websiteUrl or jamId required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Prepare fields to update
        const updates: any = { updated_at: new Date().toISOString() }

        // Allowed patch fields
        const allowed = [
            'name', 'tagline', 'description', 'category', 'team_type',
            'socials', 'vibe_tools', 'tech_stack', 'mrr_bucket',
            'mrr_value', 'mrr_visibility', 'media', 'app_url', 'is_listed', 'status'
        ]

        if (patch) {
            for (const key of allowed) {
                if (patch[key] !== undefined) {
                    updates[key] = patch[key]
                }
            }

            // Validation for Publishing
            if (updates.status === 'published') {
                const name = updates.name || '';
                const category = updates.category || '';
                const heroImageUrl = updates.media?.heroImageUrl || '';

                // If any critical field is missing, we check existing record first if jamId exists
                let finalName = name;
                let finalCategory = category;
                let finalHero = heroImageUrl;

                if (jamId && (!name || !category || !heroImageUrl)) {
                    const { data: existing } = await supabase.from('jams').select('name, category, media').eq('id', jamId).single();
                    finalName = name || existing?.name;
                    finalCategory = category || existing?.category;
                    finalHero = heroImageUrl || existing?.media?.heroImageUrl;
                }

                if (!finalName || !finalCategory || !finalHero) {
                    return new Response(JSON.stringify({
                        ok: false,
                        success: false,
                        error: 'INCOMPLETE_METADATA',
                        message: 'Name, Category, and Hero Image are required to publish.'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    })
                }

                updates.published_at = new Date().toISOString();
                updates.is_listed = true;
                updates.listed_at = updates.published_at;
            }

            // Safety caps
            if (updates.media?.imageUrls?.length > 5) {
                updates.media.imageUrls = updates.media.imageUrls.slice(0, 5)
            }
            if (updates.tech_stack?.length > 12) {
                updates.tech_stack = updates.tech_stack.slice(0, 12)
            }
            if (updates.vibe_tools?.length > 10) {
                updates.vibe_tools = updates.vibe_tools.slice(0, 10)
            }
        }

        let result;

        if (jamId) {
            // Fetch existing to check ownership and existence
            const { data: existing, error: fetchError } = await supabase
                .from('jams')
                .select('*')
                .eq('id', jamId)
                .single()

            if (fetchError || !existing) throw new Error('Jam not found or not editable')

            if (existing.creator_id !== user.id) throw new Error('Unauthorized')

            // Scrape mode: only fill empty fields
            if (source === 'scrape') {
                const fillable = ['name', 'tagline', 'description', 'media']
                for (const key of fillable) {
                    if (updates[key]) {
                        if (key === 'media') {
                            const existingMedia = existing.media || {}
                            const newMedia = updates.media || {}
                            updates.media = {
                                ...existingMedia,
                                ...newMedia,
                                heroImageUrl: existingMedia.heroImageUrl || newMedia.heroImageUrl,
                                faviconUrl: existingMedia.faviconUrl || newMedia.faviconUrl,
                                ogImageUrl: existingMedia.ogImageUrl || newMedia.ogImageUrl,
                                imageUrls: (existingMedia.imageUrls?.length > 0) ? existingMedia.imageUrls : newMedia.imageUrls
                            }
                        } else if (existing[key]) {
                            delete updates[key]
                        }
                    }
                }
            }

            const { data, error } = await supabase
                .from('jams')
                .update(updates)
                .eq('id', jamId)
                .select()
                .single()

            if (error) throw error
            result = data

        } else {
            // Create new draft
            const { data, error } = await supabase
                .from('jams')
                .insert({
                    creator_id: user.id,
                    status: 'draft',
                    website_url: websiteUrl,
                    is_listed: false,
                    ...updates
                })
                .select()
                .single()

            if (error) throw error
            result = data
        }

        // Construct authoritative response
        const response = {
            ok: true,
            success: true,
            jam_id: result.id,
            live_url: result.status === 'published' ? `${Deno.env.get('SITE_URL') || 'https://vibejam.co'}/jam/${result.id}` : null,
            discoverable: result.is_listed && result.status === 'published',
            reason_if_not: (result.status === 'published' && !result.is_listed) ? 'NOT_LISTED' : null,
            data: result
        }

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ ok: false, success: false, error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
