-- Migration: 20260130130000_backfill_listed
-- Description: Backfill published jams to be listed and set published_at if missing

UPDATE public.jams
SET is_listed = true
WHERE status = 'published'
  AND (is_listed IS NULL OR is_listed = false);

UPDATE public.jams
SET published_at = COALESCE(published_at, updated_at, created_at, NOW())
WHERE status = 'published'
  AND published_at IS NULL;

UPDATE public.jams
SET listed_at = COALESCE(listed_at, published_at, NOW())
WHERE status = 'published'
  AND listed_at IS NULL;
