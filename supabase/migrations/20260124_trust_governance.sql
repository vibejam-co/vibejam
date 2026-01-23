
-- Migration: 20260124_trust_governance
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trust_flags JSONB DEFAULT '{"verified": false, "consistent": false, "revenue_verified": false}'::jsonb,
ADD COLUMN IF NOT EXISTS monetization_status JSONB DEFAULT '{"eligible": false, "pipeline_stage": "none"}'::jsonb;

CREATE TABLE IF NOT EXISTS public.moderation_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jam_id UUID REFERENCES public.jams(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    reviewer_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;

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
