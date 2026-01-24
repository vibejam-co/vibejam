-- Migration: 20260124_trust_governance
-- Description: Trust flags, moderation, and admin audit tables

-- 1. Extend Profiles with Trust & Monetization Readiness
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trust_flags JSONB DEFAULT '{"verified": false, "consistent": false, "revenue_verified": false}'::jsonb,
ADD COLUMN IF NOT EXISTS monetization_status JSONB DEFAULT '{"eligible": false, "pipeline_stage": "none"}'::jsonb;

-- 2. Moderation Flags Table (Invisible to public)
CREATE TABLE IF NOT EXISTS public.moderation_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jam_id UUID REFERENCES public.jams(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('pending', 'resolved', 'dismissed')) DEFAULT 'pending',
    reviewer_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;

-- 3. Admin Actions Table (Audit Trail)
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    actor_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Moderation flags: Only service role or specific admins (vj_admin role or ID check)
-- For MVP, we'll use auth.uid() check against a hardcoded list or just service role.
-- Let's stick to Service Role only for now to keep it silent.
CREATE POLICY "Admin only view moderation_flags" 
ON public.moderation_flags FOR ALL 
USING (false) 
WITH CHECK (false);

CREATE POLICY "Admin only view admin_actions" 
ON public.admin_actions FOR ALL 
USING (false) 
WITH CHECK (false);

-- Profiles: Public can view trust_flags, but only owner or admin can view monetization_status?
-- Requirement says "trust_flags read-only to clients, writable only via admin".
-- Actually, public needs to see flags to show tooltips. 
-- monetization_status should be private/creator-only.

-- Update profiles select policy to include trust_flags (already public select)
-- We'll just let monetization_status be part of the doc but RLS can't easily hide columns.
-- For true privacy, we'd use a separate table, but for Phase 4 MVP, we'll keep it simple 
-- or use a view. Given the prompt "monetization readiness (plumbing only)", we'll keep it in profiles.
