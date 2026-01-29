-- Migration: 20260124150000_publishing_truth
-- Description: Slugs and Visibility Invariants

-- 1. SCHEMA UPDATES
ALTER TABLE public.jams 
ADD COLUMN IF NOT EXISTS is_listed BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS listed_at TIMESTAMPTZ;

-- Index for Feed Stability
CREATE INDEX IF NOT EXISTS idx_jams_listed_feed 
ON public.jams (is_listed, status, published_at DESC) 
WHERE status = 'published' AND is_listed = TRUE;

-- 2. TIGHTEN POLICIES
-- Only show published/listed jams in general feed
DROP POLICY IF EXISTS \"Public can view published jams\" ON public.jams;
CREATE POLICY \"Public can view listed jams\" 
ON public.jams FOR SELECT 
USING (
    (status = 'published' AND is_listed = TRUE) 
    OR (auth.uid() = creator_id)
);
