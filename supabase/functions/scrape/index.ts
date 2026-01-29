import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

type ScrapeResult = {
    site_url: string;
    name?: string;
    tagline?: string;
    image_url?: string;
    favicon_url?: string;
    warnings: string[];
};

const DEFAULT_UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

function absolutize(baseUrl: string, maybeRelative?: string) {
    if (!maybeRelative) return undefined;
    try {
        return new URL(maybeRelative, baseUrl).toString();
    } catch {
        return undefined;
    }
}

function strip(s?: string) {
    return s?.replace(/\s+/g, " ").trim();
}

function isBadHeroImage(url: string) {
    return false;
}

async function fetchHtmlWithTimeout(url: string, timeoutMs = 12000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
        const res = await fetch(url, {
            method: "GET",
            redirect: "follow",
            signal: ctrl.signal,
            headers: {
                "user-agent": DEFAULT_UA,
                "accept":
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "no-cache",
                "upgrade-insecure-requests": "1"
            },
        });

        const ct = res.headers.get("content-type") || "";
        if (!res.ok) {
            throw new Error(`HTTP_${res.status}`);
        }

        const html = await res.text();
        return { res, ct, html };
    } finally {
        clearTimeout(t);
    }
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { url } = await req.json().catch(() => ({}));
        if (!url) {
            return new Response(JSON.stringify({ error: "Missing url" }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const inputUrl = new URL(url).toString();
        const warnings: string[] = [];

        let html = "";
        let finalUrl = inputUrl;
        let ct = "";

        try {
            const result = await fetchHtmlWithTimeout(inputUrl, 12000);
            html = result.html;
            finalUrl = result.res.url || inputUrl;
            ct = result.ct;
        } catch (e: any) {
            // Return actionable error for UI
            const errCode = String(e.message).startsWith("HTTP_") ? String(e.message) : "FETCH_FAILED";
            return new Response(JSON.stringify({ error: "Scrape unreachable", code: errCode }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!ct.includes("text/html")) {
            warnings.push(`Non-HTML content-type returned: ${ct}`);
        }

        const doc = new DOMParser().parseFromString(html, "text/html");
        if (!doc) {
            return new Response(JSON.stringify({ error: "Failed to parse HTML" }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const getMeta = (prop: string) =>
            strip(doc.querySelector(`meta[property='${prop}']`)?.getAttribute("content") ||
                doc.querySelector(`meta[name='${prop}']`)?.getAttribute("content"));

        const getLink = (rel: string) =>
            doc.querySelector(`link[rel~='${rel}']`)?.getAttribute("href");

        // ---- Extraction Priority (V6.5) ----
        const name = getMeta("og:title") || getMeta("twitter:title") || strip(doc.querySelector("title")?.textContent) || "";
        const tagline = getMeta("og:description") || getMeta("twitter:description") || getMeta("description") || "";

        // Helper to get largest icon if no OG image
        // (Simplified: just grab the first valid large-looking icon or OG)
        let image_url =
            absolutize(finalUrl, getMeta("og:image")) ||
            absolutize(finalUrl, getMeta("twitter:image")) ||
            absolutize(finalUrl, getLink("image_src"));

        if (!image_url) {
            // Fallback: Apple Touch Icon (usually high res)
            const appleIcon = absolutize(finalUrl, getLink("apple-touch-icon"));
            if (appleIcon && !isBadHeroImage(appleIcon)) image_url = appleIcon;
        }

        // Favicon logic
        const favicon_url =
            absolutize(finalUrl, getLink("icon")) ||
            absolutize(finalUrl, getLink("shortcut icon")) ||
            absolutize(finalUrl, "/favicon.ico");

        if (!name) warnings.push("No title found.");

        // Special Case: Cloudflare / 403
        // If we got a 200 OK via fetch but parsed NOTHING useful (no title, no description), 
        // it might be a soft-block (CAPTCHA page).
        if (!name && !tagline && html.includes("Challenge")) {
            return new Response(JSON.stringify({
                site_url: finalUrl,
                warnings: ["SCRAPE_BLOCKED"],
                code: "SCRAPE_BLOCKED"
            }), { headers: { ...corsHeaders, "content-type": "application/json" } });
        }
        if (!image_url) warnings.push("No hero image found.");

        const out: ScrapeResult = {
            site_url: finalUrl,
            name,
            tagline,
            image_url,
            favicon_url,
            warnings,
        };

        return new Response(JSON.stringify(out), {
            headers: { ...corsHeaders, "content-type": "application/json" },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
