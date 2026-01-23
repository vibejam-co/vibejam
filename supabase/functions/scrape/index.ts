
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    try {
        const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: req.headers.get('Authorization')! } } })
        const { jamId, websiteUrl } = await req.json()
        const res = await fetch(websiteUrl, { headers: { 'User-Agent': 'VibeJam-Scraper/1.0' } })
        const html = await res.text()
        const doc = new DOMParser().parseFromString(html, "text/html");
        const getMeta = (prop: string) => doc?.querySelector(`meta[property="${prop}"]`)?.getAttribute("content") || doc?.querySelector(`meta[name="${prop}"]`)?.getAttribute("content");
        const payload = { name: getMeta("og:title") || doc?.querySelector("title")?.textContent || "", tagline: getMeta("og:description") || getMeta("description") || "" }
        await supabase.functions.invoke('jam-upsert-draft', { body: { jamId, websiteUrl, patch: payload, source: 'scrape' } })
        return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (error) { return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
})
