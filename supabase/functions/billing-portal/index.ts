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

    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Unauthorized')

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { data: billingCustomer } = await supabase
      .from('billing_customers')
      .select('stripe_customer_id')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (!billingCustomer?.stripe_customer_id) {
       return new Response(JSON.stringify({ ok: true, url: null }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const { returnUrl } = await req.json()

    const session = await stripe.billingPortal.sessions.create({
      customer: billingCustomer.stripe_customer_id,
      return_url: returnUrl || Deno.env.get('SITE_URL') || 'http://localhost:3000',
    })

    return new Response(JSON.stringify({ ok: true, url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ ok: true, url: null }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
