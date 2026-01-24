import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, payload: unknown) {
    return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", ...corsHeaders } });
}

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json(405, { ok: false, error: "METHOD_NOT_ALLOWED" });

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get user from JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await userClient.auth.getUser();
    const uid = u?.user?.id ?? null;

    if (!uid) return json(401, { ok: false, error: "UNAUTHORIZED" });

    let body: any = {};
    try { body = await req.json(); } catch { }

    const subscriptionId = body?.subscriptionId;
    if (!subscriptionId) return json(200, { ok: false, error: "MISSING_SUBSCRIPTION_ID" });

    const sb = createClient(url, serviceKey);

    // Verify subscription belongs to user
    const { data: subscription, error: fetchError } = await sb
        .from("subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .eq("user_id", uid)
        .maybeSingle();

    if (fetchError || !subscription) {
        return json(200, { ok: false, error: "SUBSCRIPTION_NOT_FOUND" });
    }

    if (subscription.status === "canceled") {
        return json(200, { ok: false, error: "ALREADY_CANCELED" });
    }

    // Cancel subscription (will remain active until period end)
    const { error: updateError } = await sb
        .from("subscriptions")
        .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);

    if (updateError) {
        return json(200, { ok: false, error: "CANCEL_FAILED" });
    }

    // Audit log
    await sb.from("billing_audit_log").insert({
        action_type: "subscription_cancel",
        user_id: uid,
        target_type: "subscription",
        target_id: subscriptionId,
        metadata: { plan_id: subscription.plan_id, period_end: subscription.current_period_end },
    });

    return json(200, {
        ok: true,
        subscription: {
            id: subscriptionId,
            status: "canceled",
            active_until: subscription.current_period_end,
        },
    });
});
