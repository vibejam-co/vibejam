-- Migration: 20260124154500_query_layer_hardening
-- Description: Privacy and Slug System

-- Add is_private and slug for deterministic queries and trust-safe filtering

-- 1. SCHEMA UPDATES
ALTER TABLE public.jams 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug for performance and safety
CREATE UNIQUE INDEX IF NOT EXISTS idx_jams_slug ON public.jams (slug) WHERE slug IS NOT NULL;

-- 2. PERFORMANCE INDEXES
-- Index for Profile -> Products (creator_id + status + is_private + published_at/id composite)
CREATE INDEX IF NOT EXISTS idx_jams_creator_published_stable 
ON public.jams (creator_id, status, is_private, published_at DESC, id DESC);

-- Index for Discover/Homepage (is_listed + status + is_private + published_at/id composite)
CREATE INDEX IF NOT EXISTS idx_jams_discover_published_stable 
ON public.jams (is_listed, status, is_private, published_at DESC, id DESC);
