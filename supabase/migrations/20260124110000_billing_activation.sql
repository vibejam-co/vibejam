-- Migration: 20260124110000_billing_activation
-- Description: Core billing tables, entitlements, and administrative kill-switches (Phase 10)

-- 1. BILLING CUSTOMERS
CREATE TABLE IF NOT EXISTS public.billing_customers (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL, -- active, trialing, past_due, canceled, incomplete
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    price_id TEXT,
    product_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_profile_status ON public.subscriptions (profile_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions (stripe_subscription_id);

-- 3. PAYMENTS (Audit-grade individual charges)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    stripe_event_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    stripe_invoice_id TEXT,
    amount_cents INT,
    currency TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    meta JSONB DEFAULT '{}'::jsonb
);

-- 4. ENTITLEMENTS (Flattened read-optimized truth)
CREATE TABLE IF NOT EXISTS public.entitlements (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_pro BOOLEAN NOT NULL DEFAULT FALSE,
    source TEXT NOT NULL DEFAULT 'none', -- stripe, manual, none
    valid_until TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    meta JSONB DEFAULT '{}'::jsonb
);

-- 5. BILLING AUDIT LOG
CREATE TABLE IF NOT EXISTS public.billing_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    stripe_event_id TEXT,
    action TEXT NOT NULL, -- checkout_session_created, webhook_processed, etc.
    meta JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_billing_audit_profile ON public.billing_audit_log (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_audit_action ON public.billing_audit_log (action, created_at DESC);

-- 6. FEATURE FLAGS / KILL SWITCHES
CREATE TABLE IF NOT EXISTS public.feature_flags (
    key TEXT PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    meta JSONB DEFAULT '{}'::jsonb
);

-- SEED FLAGS
INSERT INTO public.feature_flags (key, enabled) VALUES 
('billing_enabled', FALSE),
('billing_webhooks_enabled', FALSE)
ON CONFLICT (key) DO NOTHING;

-- 7. RLS POLICIES

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- 7.1 Select own-only policies
CREATE POLICY "Users can view own billing customer" ON public.billing_customers FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can view own entitlements" ON public.entitlements FOR SELECT USING (auth.uid() = profile_id);

-- 7.2 Service-only write policies (implicit fallback to Service Role)
-- Explicitly denying all public/auth mutations
CREATE POLICY "No public customer mutations" ON public.billing_customers FOR ALL USING (FALSE);
CREATE POLICY "No public subscription mutations" ON public.subscriptions FOR ALL USING (FALSE);
CREATE POLICY "No public payment mutations" ON public.payments FOR ALL USING (FALSE);
CREATE POLICY "No public entitlement mutations" ON public.entitlements FOR ALL USING (FALSE);

-- 7.3 Audit log: Service Role only
CREATE POLICY "Service role only audit read" ON public.billing_audit_log FOR ALL USING (FALSE);

-- 7.4 Feature flags: Service Role only (Client access via Edge Functions)
CREATE POLICY "Service role only flags access" ON public.feature_flags FOR ALL USING (FALSE);
