import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Check Feature Flag
    const { data: flag } = await supabase.from('feature_flags').select('enabled').eq('key', 'billing_enabled').maybeSingle()
    if (flag && !flag.enabled) {
      return new Response(JSON.stringify({ ok: true, enabled: false }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 2. Auth Check
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Unauthorized')

    // 3. Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { priceId, successUrl, cancelUrl } = await req.json()

    // 4. Get or Create Customer
    let { data: billingCustomer } = await supabase
      .from('billing_customers')
      .select('stripe_customer_id')
      .eq('profile_id', user.id)
      .maybeSingle()

    let stripeCustomerId = billingCustomer?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { profile_id: user.id }
      })
      stripeCustomerId = customer.id
      await supabase.from('billing_customers').insert({
        profile_id: user.id,
        stripe_customer_id: stripeCustomerId
      })
    }

    // 5. Create Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { profile_id: user.id }
    })

    // 6. Audit Log
    await supabase.from('billing_audit_log').insert({
      profile_id: user.id,
      action: 'checkout_session_created',
      meta: { session_id: session.id, price_id: priceId }
    })

    return new Response(JSON.stringify({ ok: true, enabled: true, url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[Billing] Checkout Error:', error.message)
    return new Response(JSON.stringify({ 
      ok: true, enabled: true, url: null, errorCode: "CHECKOUT_FAILED" 
    }), {
      status: 200, // Fail-open attitude: we return ok:true but with url:null
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
