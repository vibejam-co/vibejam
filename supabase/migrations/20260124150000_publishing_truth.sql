-- Migration: 20260124150000_publishing_truth
-- Description: Define canonical live contract with is_listed and hardened RLS

-- 1. SCHEMA UPDATES
ALTER TABLE public.jams 
ADD COLUMN IF NOT EXISTS is_listed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS listed_at TIMESTAMPTZ;

-- 2. INDICES
CREATE INDEX IF NOT EXISTS idx_jams_listed_status ON public.jams (is_listed, status, published_at DESC);

-- 3. RLS UPDATES
-- We need to ensure that public 'SELECT' only sees Jams that are published AND listed.
-- The existing policy "Published jams are viewable by everyone" needs to be tightened.

DROP POLICY IF EXISTS "Published jams are viewable by everyone" ON public.jams;

CREATE POLICY "Live jams are viewable by everyone" 
ON public.jams FOR SELECT USING (
    (status = 'published' AND is_listed = true) OR (auth.uid() = creator_id)
);

-- Note: Owners can always see their own listed or unlisted jams.
