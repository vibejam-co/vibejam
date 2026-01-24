import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, payload: unknown) {
    return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", ...corsHeaders } });
}

// Admin-only function for granting entitlements manually
serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json(405, { ok: false, error: "METHOD_NOT_ALLOWED" });

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, serviceKey);

    let body: any = {};
    try { body = await req.json(); } catch { }

    const userId = body?.userId;
    const entitlementKey = body?.entitlementKey;
    const expiresAt = body?.expiresAt ?? null;
    const source = body?.source ?? "grant";

    if (!userId || !entitlementKey) {
        return json(200, { ok: false, error: "MISSING_FIELDS" });
    }

    // Verify user exists
    const { data: profile } = await sb
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

    if (!profile) {
        return json(200, { ok: false, error: "USER_NOT_FOUND" });
    }

    // Check for existing entitlement
    const { data: existing } = await sb
        .from("entitlements")
        .select("id")
        .eq("user_id", userId)
        .eq("entitlement_key", entitlementKey)
        .maybeSingle();

    if (existing) {
        // Update expiration if already exists
        await sb
            .from("entitlements")
            .update({ expires_at: expiresAt })
            .eq("id", existing.id);

        await sb.from("billing_audit_log").insert({
            action_type: "entitlement_extend",
            user_id: userId,
            target_type: "entitlement",
            target_id: existing.id,
            metadata: { entitlement_key: entitlementKey, expires_at: expiresAt },
        });

        return json(200, { ok: true, action: "extended", entitlement_id: existing.id });
    }

    // Create new entitlement
    const { data: entitlement, error } = await sb
        .from("entitlements")
        .insert({
            user_id: userId,
            entitlement_key: entitlementKey,
            source,
            expires_at: expiresAt,
        })
        .select("*")
        .single();

    if (error || !entitlement) {
        return json(200, { ok: false, error: "GRANT_FAILED" });
    }

    // Audit log
    await sb.from("billing_audit_log").insert({
        action_type: "entitlement_grant",
        user_id: userId,
        target_type: "entitlement",
        target_id: entitlement.id,
        metadata: { entitlement_key: entitlementKey, source, expires_at: expiresAt },
    });

    return json(200, { ok: true, action: "granted", entitlement });
});
