import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

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

        const { jamId, websiteUrl, mode } = await req.json()
        if (!websiteUrl) throw new Error('URL required')

        // 1. Fetch HTML with 5s timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        let html = ''
        try {
            const res = await fetch(websiteUrl, {
                signal: controller.signal,
                headers: { 'User-Agent': 'VibeJam-Scraper/1.0' }
            })
            if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
            html = await res.text()
        } catch (e) {
            // If fetch fails, we still might want to proceed if we just wanted to init a jam
            // But the prompt implies returning extraction.
            throw new Error(`Scrape failed: ${e.message}`)
        } finally {
            clearTimeout(timeoutId)
        }

        // 2. Parse Metadata
        const doc = new DOMParser().parseFromString(html, "text/html");
        if (!doc) throw new Error('Failed to parse HTML')

        const getMeta = (prop: string) =>
            doc.querySelector(`meta[property="${prop}"]`)?.getAttribute("content") ||
            doc.querySelector(`meta[name="${prop}"]`)?.getAttribute("content");

        const title = getMeta("og:title") || doc.querySelector("title")?.textContent || "";
        const description = getMeta("og:description") || getMeta("description") || "";
        const ogImage = getMeta("og:image") || getMeta("twitter:image");

        // Favicon
        let favicon = doc.querySelector("link[rel~='icon']")?.getAttribute("href")
        if (favicon && !favicon.startsWith('http')) {
            // resolve relative
            try {
                favicon = new URL(favicon, websiteUrl).href
            } catch { }
        }

        // Hero / Screenshot fallback
        let heroImage = ogImage;
        if (!heroImage) {
            // find first large image
            const imgs = doc.querySelectorAll('img');
            // simple heuristic: first img with src
            for (const img of imgs) {
                const src = img.getAttribute('src');
                if (src) {
                    heroImage = src.startsWith('http') ? src : new URL(src, websiteUrl).href;
                    break;
                }
            }
        }

        const payload = {
            name: title.substring(0, 100), // truncate
            tagline: description.substring(0, 150),
            media: {
                heroImageUrl: heroImage,
                ogImageUrl: ogImage,
                faviconUrl: favicon,
                imageUrls: [] // Could extract more if needed
            }
        }

        // 3. Call jam-upsert-draft internally
        // We can call the function directly or just do DB update since we have the client.
        // However, jam-upsert-draft has the logic for "fill_if_empty" and validation.
        // It's cleaner to reuse logic, but invoking another edge function via HTTP can be tricky with auth.
        // Since we are in the same project, let's just replicate the update logic simply here or use the DB directly 
        // to avoid RTT, complying to "call jam-upsert-draft internally" instruction from prompt.
        // "call jam-upsert-draft internally" -> usually means invoke.

        const { data: updatedJam, error: upsertError } = await supabase.functions.invoke('jam-upsert-draft', {
            body: {
                jamId,
                websiteUrl,
                patch: payload,
                source: 'scrape'
            }
        })

        if (upsertError) throw upsertError

        return new Response(JSON.stringify({
            extraction: payload,
            jam: updatedJam
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
