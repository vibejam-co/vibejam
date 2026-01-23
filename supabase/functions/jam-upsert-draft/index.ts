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
            'mrr_value', 'mrr_visibility', 'media', 'app_url'
        ]

        if (patch) {
            for (const key of allowed) {
                if (patch[key] !== undefined) {
                    updates[key] = patch[key]
                }
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
                const fillable = ['name', 'tagline', 'description', 'media'] // extend as needed
                for (const key of fillable) {
                    if (updates[key]) {
                        // Logic: if existing is empty/null/default, allow update.
                        // For media, it's a JSONB, so we might need deeper merge. 
                        // Simplified: if existing media is default/null, take new.
                        // Or merge specific subfields. 

                        if (key === 'media') {
                            // Shallow merge for media props if they are missing in existing
                            const existingMedia = existing.media || {}
                            const newMedia = updates.media || {}
                            updates.media = {
                                ...existingMedia,
                                ...newMedia,
                                // Keep existing non-null values
                                heroImageUrl: existingMedia.heroImageUrl || newMedia.heroImageUrl,
                                faviconUrl: existingMedia.faviconUrl || newMedia.faviconUrl,
                                ogImageUrl: existingMedia.ogImageUrl || newMedia.ogImageUrl,
                                // For arrays, maybe append or keep existing?
                                // Prompt says "do NOT overwrite a field if it already has a non-empty value"
                                imageUrls: (existingMedia.imageUrls?.length > 0) ? existingMedia.imageUrls : newMedia.imageUrls
                            }
                        } else if (existing[key]) {
                            // exists and not empty, delete from updates
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
                    ...updates
                })
                .select()
                .single()

            if (error) throw error
            result = data
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
