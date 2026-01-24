import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { standardResponse, normalizeError } from '../_shared/response.ts'

// Plan entitlements mapping
const PLAN_ENTITLEMENTS: Record<string, string[]> = {
    pro: ["analytics_advanced", "historical_data", "priority_support"],
    plus: ["analytics_advanced", "historical_data", "priority_support", "early_access", "enhanced_profile"],
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    try {
        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )
        const { data: { user } } = await authClient.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { planId } = await req.json()
        if (!planId || !PLAN_ENTITLEMENTS[planId]) {
            return standardResponse({ ok: false, error: "INVALID_PLAN" }, 400);
        }

        // Check for existing active subscription
        const { data: existing } = await adminClient
            .from("subscriptions")
            .select("id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();

        if (existing) {
            return standardResponse({ ok: false, error: "ALREADY_SUBSCRIBED" }, 400);
        }

        // Create subscription
        const periodStart = new Date();
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const { data: subscription, error: subError } = await adminClient
            .from("subscriptions")
            .insert({
                user_id: user.id,
                plan_id: planId,
                status: "active",
                billing_provider: "manual", // No Stripe integration yet
                current_period_start: periodStart.toISOString(),
                current_period_end: periodEnd.toISOString(),
            })
            .select("*")
            .single();

        if (subError || !subscription) {
            return standardResponse({ ok: false, error: "SUBSCRIPTION_FAILED" }, 500);
        }

        // Grant entitlements for this plan
        const entitlements = PLAN_ENTITLEMENTS[planId].map((key) => ({
            user_id: user.id,
            entitlement_key: key,
            source: "subscription",
            source_id: subscription.id,
            expires_at: periodEnd.toISOString(),
        }));

        await adminClient.from("entitlements").insert(entitlements);

        // Audit log
        await adminClient.from("billing_audit_log").insert({
            action_type: "subscription_create",
            user_id: user.id,
            target_type: "subscription",
            target_id: subscription.id,
            metadata: { plan_id: planId, entitlements: PLAN_ENTITLEMENTS[planId] },
        });

        return standardResponse({ ok: true, subscription, entitlements: PLAN_ENTITLEMENTS[planId] })
    } catch (error) {
        return standardResponse(normalizeError(error), 400)
    }
})
