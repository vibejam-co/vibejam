import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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

// Match meta tags by property or name
function getMetaAll(html: string, key: string): string[] {
  const out: string[] = [];

  const propRe = new RegExp(
    `<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "gi",
  );
  const nameRe = new RegExp(
    `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "gi",
  );

  let m: RegExpExecArray | null;
  while ((m = propRe.exec(html))) out.push(m[1].trim());
  while ((m = nameRe.exec(html))) out.push(m[1].trim());

  // Also handle attribute order swapped (content before property/name)
  const propRe2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`,
    "gi",
  );
  const nameRe2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`,
    "gi",
  );
  while ((m = propRe2.exec(html))) out.push(m[1].trim());
  while ((m = nameRe2.exec(html))) out.push(m[1].trim());

  // de-dupe preserving order
  return [...new Set(out)];
}

function getMetaFirst(html: string, key: string): string | undefined {
  return getMetaAll(html, key)[0];
}

// Pull <title>…</title>
function getHtmlTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim();
}

// <link rel="..."> selectors (icons etc.)
function getLinkRelAll(html: string, relContains: string): string[] {
  const out: string[] = [];
  const re = new RegExp(
    `<link[^>]+rel=["'][^"']*${relContains}[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>`,
    "gi",
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(m[1].trim());

  // handle swapped attr order (href before rel)
  const re2 = new RegExp(
    `<link[^>]+href=["']([^"']+)["'][^>]+rel=["']^"']*${relContains}[^"']*["'][^>]*>`,
    "gi",
  );
  while ((m = re2.exec(html))) out.push(m[1].trim());

  return [...new Set(out)];
}

// Some sites give data: or svg; avoid those as hero images
function isBadHeroImage(url?: string) {
  if (!url) return true;
  const u = url.toLowerCase();
  if (u.startsWith("data:")) return true;
  if (u.endsWith(".svg")) return true; // often logos; optional: allow if you want
  return false;
}

async function fetchHtmlWithTimeout(url: string, timeoutMs = 8000) {
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
      },
    });

    const ct = res.headers.get("content-type") || "";
    const html = await res.text();

    return { res, ct, html };
  } finally {
    clearTimeout(t);
  }
}

serve(async (req) => {
  try {
    const { url } = await req.json().catch(() => ({}));
    if (!url) {
      return new Response(JSON.stringify({ error: "Missing url" }), { status: 400 });
    }

    const inputUrl = new URL(url).toString();
    const warnings: string[] = [];

    const { res, ct, html } = await fetchHtmlWithTimeout(inputUrl, 9000);

    if (!ct.includes("text/html")) {
      warnings.push(`Non-HTML content-type returned: ${ct}`);
    }

    // Normalize the final URL after redirects
    const finalUrl = res.url || inputUrl;

    // ---- Title/Description Ladder ----
    const ogTitle = strip(getMetaFirst(html, "og:title"));
    const twTitle = strip(getMetaFirst(html, "twitter:title"));
    const docTitle = strip(getHtmlTitle(html));

    const ogDesc = strip(getMetaFirst(html, "og:description"));
    const twDesc = strip(getMetaFirst(html, "twitter:description"));
    const metaDesc = strip(getMetaFirst(html, "description"));

    const name = ogTitle || twTitle || docTitle;
    const tagline = ogDesc || twDesc || metaDesc;

    if (!name) warnings.push("No title found (og:title/twitter:title/<title>).");
    if (!tagline) warnings.push("No description found (og:description/twitter:description/meta description).");

    // ---- Image Ladder (OG -> Twitter -> Icons) ----
    // Prefer OG image; some pages have multiple og:image; take first valid
    const ogImages = getMetaAll(html, "og:image").map((x) => absolutize(finalUrl, x));
    const twImages = getMetaAll(html, "twitter:image").map((x) => absolutize(finalUrl, x));

    let image_url =
      ogImages.find((u) => u && !isBadHeroImage(u)) ||
      twImages.find((u) => u && !isBadHeroImage(u));

    // Icon fallbacks (good for "no image scraped" cases)
    const appleIcons = getLinkRelAll(html, "apple-touch-icon").map((x) => absolutize(finalUrl, x));
    const icons = getLinkRelAll(html, "icon").map((x) => absolutize(finalUrl, x));

    const favicon_url =
      icons.find(Boolean) ||
      appleIcons.find(Boolean) ||
      absolutize(finalUrl, "/favicon.ico");

    if (!image_url) {
      // last-resort: use apple-touch-icon or icon as hero image
      image_url =
        appleIcons.find((u) => u && !isBadHeroImage(u)) ||
        icons.find((u) => u && !isBadHeroImage(u));

      warnings.push(
        "No og:image/twitter:image found. Falling back to site icon (consider screenshot fallback for richer covers).",
      );
    }

    const out: ScrapeResult = {
      site_url: finalUrl,
      name,
      tagline,
      image_url,
      favicon_url,
      warnings,
    };

    return new Response(JSON.stringify(out), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
