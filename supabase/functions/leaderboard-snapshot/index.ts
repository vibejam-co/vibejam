
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const { kind } = await req.json().catch(() => ({}))

    if (!kind) {
        return new Response(JSON.stringify({ error: 'Missing kind' }), { status: 400, headers: corsHeaders })
    }

    // Initialize Supabase Client (Anon is fine for reading public leaderboards)
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    try {
        // Fetch latest snapshot for the scope (kind)
        const { data, error } = await supabase
            .from('leaderboards')
            .select('*')
            .eq('scope', kind)
            .single()

        if (error && error.code !== 'PGRST116') throw error

        const rows = data?.items || []

        return new Response(
            JSON.stringify({ rows }),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' // Edge Cache 5 mins
                }
            }
        )

    } catch (error) {
        console.error('Leaderboard Fetch Error', error)
        return new Response(
            JSON.stringify({ rows: [] }), // Fail-safe empty
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
