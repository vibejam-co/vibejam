-- Migration: 20260126_aura_badge_system
-- Description: Canonical Aura + Badge System (Source of Truth)

-- 1. BADGE DEFINITIONS (The Rules)
CREATE TABLE IF NOT EXISTS public.badge_definitions (
    id TEXT PRIMARY KEY, -- e.g. 'founding_creator'
    tier INT NOT NULL CHECK (tier BETWEEN 1 AND 10),
    category TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- { name, description, icon, aura_color }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

-- Everyone can read badge definitions
CREATE POLICY "Badge definitions are public" 
ON public.badge_definitions FOR SELECT USING (true);

-- Only service role can manage definitions
CREATE POLICY "Service role manages badge definitions" 
ON public.badge_definitions 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');


-- 2. EARNED BADGES (The Source of Truth)
CREATE TABLE IF NOT EXISTS public.profile_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES public.badge_definitions(id) ON DELETE RESTRICT,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT NOT NULL, -- 'system_event', 'admin', 'migration'
    UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_badges_user ON public.profile_badges(user_id);

ALTER TABLE public.profile_badges ENABLE ROW LEVEL SECURITY;

-- Public can see who has what badge
CREATE POLICY "Earned badges are public" 
ON public.profile_badges FOR SELECT USING (true);

-- Only service role can award badges (NO CLIENT WRITES)
CREATE POLICY "Service role manages earned badges" 
ON public.profile_badges 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');


-- 3. AUDIT LOG (Immutable History)
CREATE TABLE IF NOT EXISTS public.badge_award_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    badge_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'AWARD', 'REVOKE'
    reason TEXT,
    actor TEXT NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.badge_award_log ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write logs (Internal Audit)
CREATE POLICY "Service role manages logs" 
ON public.badge_award_log 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');


-- 4. SYNC TRIGGER (The Brain)
-- Updates profiles.badges cache whenever profile_badges changes

CREATE OR REPLACE FUNCTION public.sync_profile_badges()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    badges_json JSONB;
BEGIN
    -- Determine user_id based on operation
    IF (TG_OP = 'DELETE') THEN
        target_user_id := OLD.user_id;
    ELSE
        target_user_id := NEW.user_id;
    END IF;

    -- Construct the JSON cache
    -- Select earned badges, join with definitions, sort by tier desc
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'type', b.badge_id,
            'tier', d.tier,
            'category', d.category,
            'data', d.metadata,
            'earned_at', b.awarded_at
        ) ORDER BY d.tier DESC, b.awarded_at DESC
    ), '[]'::jsonb)
    INTO badges_json
    FROM public.profile_badges b
    JOIN public.badge_definitions d ON b.badge_id = d.id
    WHERE b.user_id = target_user_id;

    -- Update the profile cache silently
    -- We do NOT change updated_at to avoid triggering client side optimistic update conflicts unnecessarily
    UPDATE public.profiles
    SET badges = badges_json
    WHERE id = target_user_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger
DROP TRIGGER IF EXISTS on_badge_change ON public.profile_badges;
CREATE TRIGGER on_badge_change
AFTER INSERT OR UPDATE OR DELETE ON public.profile_badges
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_badges();


-- 5. TAMPER PROTECTION (The Guard)
-- Prevent clients from manually editing profiles.badges

CREATE OR REPLACE FUNCTION public.protect_profile_badges()
RETURNS TRIGGER AS $$
BEGIN
    -- If the operation is NOT coming from service_role (e.g. from the sync trigger or admin function)
    -- AND the badges field is changing...
    IF (auth.role() != 'service_role') AND (NEW.badges IS DISTINCT FROM OLD.badges) THEN
        -- Revert changes to badges field only
        NEW.badges := OLD.badges;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind Trigger to Profiles
DROP TRIGGER IF EXISTS protect_badges_column ON public.profiles;
CREATE TRIGGER protect_badges_column
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_badges();
