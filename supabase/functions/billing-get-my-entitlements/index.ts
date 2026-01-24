import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
       return new Response(JSON.stringify({ ok: true, entitlements: { is_pro: false } }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
       return new Response(JSON.stringify({ ok: true, entitlements: { is_pro: false } }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const { data: entitlements } = await supabase
      .from('entitlements')
      .select('is_pro, valid_until, source')
      .eq('profile_id', user.id)
      .maybeSingle()

    // check expiry
    const isPro = !!entitlements?.is_pro && (!entitlements.valid_until || new Date(entitlements.valid_until) > new Date())

    return new Response(JSON.stringify({ 
      ok: true, 
      entitlements: { 
        is_pro: isPro,
        source: entitlements?.source ?? 'none'
      } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ ok: true, entitlements: { is_pro: false } }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
