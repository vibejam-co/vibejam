import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );

        const { q, limit = 20, cursor } = await req.json();

        if (!q || q.trim().length === 0) {
            return new Response(JSON.stringify({ ok: true, items: [] }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const sanitizedQuery = q.trim().substring(0, 120);

        // Using RPC for complex search formatting and ranking
        const { data: results, error } = await supabase.rpc("search_jams_v1", {
            p_query: sanitizedQuery,
            p_limit: limit,
            p_cursor: cursor
        });

        if (error) throw error;

        // Optional: Log search event silently
        supabase.from("search_events").insert({
            query: sanitizedQuery,
            results_count: results?.length || 0
        }).catch(() => { });

        return new Response(JSON.stringify({ ok: true, items: results || [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ ok: true, items: [], errorCode: "SEARCH_UNAVAILABLE" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
