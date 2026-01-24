import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, payload: unknown) {
    return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", ...corsHeaders } });
}

const EXPOSURE_TYPES = ["sponsored_carousel", "boost_slot"];
const MAX_DURATION_HOURS = 168; // 7 days max
const MIN_DURATION_HOURS = 1;

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

    const jamId = body?.jamId;
    const exposureType = body?.exposureType;
    const durationHours = Number(body?.durationHours) || 24;

    if (!jamId) return json(200, { ok: false, error: "MISSING_JAM_ID" });
    if (!EXPOSURE_TYPES.includes(exposureType)) {
        return json(200, { ok: false, error: "INVALID_EXPOSURE_TYPE" });
    }
    if (durationHours < MIN_DURATION_HOURS || durationHours > MAX_DURATION_HOURS) {
        return json(200, { ok: false, error: "INVALID_DURATION" });
    }

    const sb = createClient(url, serviceKey);

    // Verify jam ownership
    const { data: jam } = await sb
        .from("jams")
        .select("id, creator_id, name")
        .eq("id", jamId)
        .maybeSingle();

    if (!jam) return json(200, { ok: false, error: "JAM_NOT_FOUND" });
    if (jam.creator_id !== uid) return json(200, { ok: false, error: "NOT_JAM_OWNER" });

    // Check for active exposure on this jam
    const { data: existingExposure } = await sb
        .from("paid_exposures")
        .select("id")
        .eq("jam_id", jamId)
        .eq("is_active", true)
        .gt("ends_at", new Date().toISOString())
        .maybeSingle();

    if (existingExposure) {
        return json(200, { ok: false, error: "ALREADY_ACTIVE_EXPOSURE" });
    }

    // Calculate cost (placeholder - in production, integrate with Stripe)
    const costPerHour = 100; // $1 per hour in cents
    const amountCents = durationHours * costPerHour;

    // Create payment record (simulated success)
    const { data: payment, error: paymentError } = await sb
        .from("payments")
        .insert({
            user_id: uid,
            amount_cents: amountCents,
            currency: "usd",
            payment_type: "boost",
            provider: "manual",
            status: "succeeded",
            metadata: { jam_id: jamId, exposure_type: exposureType, duration_hours: durationHours },
        })
        .select("*")
        .single();

    if (paymentError || !payment) {
        return json(200, { ok: false, error: "PAYMENT_FAILED" });
    }

    // Create paid exposure
    const startsAt = new Date();
    const endsAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    const { data: exposure, error: exposureError } = await sb
        .from("paid_exposures")
        .insert({
            jam_id: jamId,
            creator_id: uid,
            exposure_type: exposureType,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            payment_id: payment.id,
            is_active: true,
        })
        .select("*")
        .single();

    if (exposureError || !exposure) {
        return json(200, { ok: false, error: "EXPOSURE_FAILED" });
    }

    // Audit log
    await sb.from("billing_audit_log").insert({
        action_type: "paid_exposure_create",
        user_id: uid,
        target_type: "paid_exposure",
        target_id: exposure.id,
        metadata: {
            jam_id: jamId,
            jam_name: jam.name,
            exposure_type: exposureType,
            duration_hours: durationHours,
            amount_cents: amountCents,
            payment_id: payment.id,
        },
    });

    return json(200, {
        ok: true,
        exposure: {
            id: exposure.id,
            type: exposureType,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
        },
        payment: {
            id: payment.id,
            amount_cents: amountCents,
        },
    });
});
