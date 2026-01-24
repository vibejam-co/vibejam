import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

serve(async (req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        const signature = req.headers.get('stripe-signature')
        if (!signature) throw new Error('Missing stripe-signature')

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
            apiVersion: '2022-11-15',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const body = await req.text()
        const event = stripe.webhooks.constructEvent(
            body,
            signature,
            Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
        )

        // 1. Check Feature Flag
        const { data: flag } = await supabase.from('feature_flags').select('enabled').eq('key', 'billing_webhooks_enabled').maybeSingle()
        if (flag && !flag.enabled) {
            console.warn('[Billing] Webhook received but processing is disabled via kill switch.')
            return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200 })
        }

        // 2. Idempotency Check
        const { data: existing } = await supabase
            .from('billing_audit_log')
            .select('id')
            .eq('stripe_event_id', event.id)
            .maybeSingle()

        if (existing) {
            return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200 })
        }

        // 3. Process Events
        let profileId: string | null = null

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session
            profileId = session.metadata?.profile_id

            if (profileId) {
                // Record payment
                await supabase.from('payments').insert({
                    profile_id: profileId,
                    stripe_event_id: event.id,
                    amount_cents: session.amount_total,
                    currency: session.currency,
                    status: 'succeeded',
                    meta: { session_id: session.id }
                })
            }
        }

        if (event.type.startsWith('customer.subscription.')) {
            const subscription = event.data.object as Stripe.Subscription
            const { data: customer } = await supabase
                .from('billing_customers')
                .select('profile_id')
                .eq('stripe_customer_id', subscription.customer)
                .maybeSingle()

            profileId = customer?.profile_id

            if (profileId) {
                const isPro = ['active', 'trialing'].includes(subscription.status)
                const validUntil = new Date(subscription.current_period_end * 1000).toISOString()

                // Update Subscriptions Table
                await supabase.from('subscriptions').upsert({
                    profile_id: profileId,
                    stripe_subscription_id: subscription.id,
                    status: subscription.status,
                    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                    current_period_end: validUntil,
                    cancel_at_period_end: subscription.cancel_at_period_end,
                    price_id: subscription.items.data[0]?.price.id,
                    product_id: subscription.items.data[0]?.price.product as string
                }, { onConflict: 'stripe_subscription_id' })

                // Update Entitlements (Truth Source)
                await supabase.from('entitlements').upsert({
                    profile_id: profileId,
                    is_pro: isPro,
                    source: 'stripe',
                    valid_until: validUntil,
                    updated_at: new Date().toISOString()
                })
            }
        }

        // 4. Final Audit
        await supabase.from('billing_audit_log').insert({
            profile_id: profileId,
            stripe_event_id: event.id,
            action: 'webhook_processed',
            meta: { type: event.type }
        })

        return new Response(JSON.stringify({ ok: true }), { status: 200 })

    } catch (err) {
        console.error('[Billing] Webhook Error:', err.message)
        // Always return 200 to Stripe to avoid retries on logic errors, but log it
        await supabase.from('billing_audit_log').insert({
            action: 'webhook_failed',
            meta: { error: err.message }
        })
        return new Response(JSON.stringify({ ok: true, error: err.message }), { status: 200 })
    }
})
