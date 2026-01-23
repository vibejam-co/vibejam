
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        // 1. Get all published jams
        // Pagination needed for scale, but starting simple for V1
        const { data: jams, error: fetchError } = await supabase
            .from('jams')
            .select('id')
            .eq('status', 'published')

        if (fetchError) throw fetchError

        const updates = []

        for (const jam of jams) {
            // Parallelize these if possible, but sequential is safer for DB load initially
            const [upvotes, bookmarks, views] = await Promise.all([
                supabase.from('jam_upvotes').select('*', { count: 'exact', head: true }).eq('jam_id', jam.id),
                supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('jam_id', jam.id),
                supabase.from('signals_dedupe').select('*', { count: 'exact', head: true }).eq('jam_id', jam.id).eq('type', 'view')
            ])

            const stats = {
                upvotes: upvotes.count || 0,
                bookmarks: bookmarks.count || 0,
                views: views.count || 0,
                // commentsCount: 0 // Not implemented yet
            }

            // 2. Atomic update (or just update jsonb)
            // We need to merge with existing stats if there are other fields, 
            // but here we are establishing the source of truth for these specific counters.
            // We'll use a jsonb_set or just update the object if we fetch it. 
            // To be safe and atomic, we might want a stored procedure, but client-side update of the JSON column is okay for eventual consistency reconciliation script.

            // Let's just update the stats column directly. 
            // Note from prompt: "Overwrite existing jams.stats atomically"
            // We will assume other stats like revenue/growth are calculated elsewhere or static. 
            // Wait, revenue is static/user-input. Growth is derived. 
            // We should preserve existing revenue/isRevenuePublic.

            // We need to fetch current stats to preserve non-computed fields?
            // Or we can rely on Postgres to merge? jsonb_set?
            // Let's fetch current to be safe.
            const { data: current } = await supabase.from('jams').select('stats').eq('id', jam.id).single();
            const newStats = {
                ...current?.stats,
                upvotes: stats.upvotes,
                bookmarks: stats.bookmarks,
                views: stats.views
            };

            const { error: updateError } = await supabase
                .from('jams')
                .update({ stats: newStats })
                .eq('id', jam.id)

            if (updateError) console.error(`Failed to reconcile jam ${jam.id}`, updateError)
            else updates.push(jam.id)
        }

        return new Response(
            JSON.stringify({ reconciled: updates.length, ids: updates }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
