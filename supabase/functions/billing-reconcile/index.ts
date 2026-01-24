import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, payload: unknown) {
    return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", ...corsHeaders } });
}

// Scheduled reconciliation function - cleans up expired subscriptions/entitlements/exposures
serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json(405, { ok: false, error: "METHOD_NOT_ALLOWED" });

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, serviceKey);

    const now = new Date().toISOString();
    const results: any = {
        subscriptions_expired: 0,
        entitlements_expired: 0,
        exposures_deactivated: 0,
    };

    // 1. Expire canceled subscriptions past their period end
    const { data: expiredSubs } = await sb
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("status", "canceled")
        .lt("current_period_end", now)
        .select("id");

    results.subscriptions_expired = expiredSubs?.length ?? 0;

    // 2. Delete expired entitlements
    const { data: expiredEntitlements } = await sb
        .from("entitlements")
        .delete()
        .lt("expires_at", now)
        .not("expires_at", "is", null)
        .select("id");

    results.entitlements_expired = expiredEntitlements?.length ?? 0;

    // 3. Deactivate ended paid exposures
    const { data: endedExposures } = await sb
        .from("paid_exposures")
        .update({ is_active: false })
        .eq("is_active", true)
        .lt("ends_at", now)
        .select("id");

    results.exposures_deactivated = endedExposures?.length ?? 0;

    // Audit log
    if (results.subscriptions_expired > 0 || results.entitlements_expired > 0 || results.exposures_deactivated > 0) {
        await sb.from("billing_audit_log").insert({
            action_type: "billing_reconcile",
            user_id: null,
            target_type: "system",
            target_id: null,
            metadata: results,
        });
    }

    return json(200, { ok: true, reconciled: results });
});
