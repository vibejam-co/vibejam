-- Migration: 20260131120000_signals_comments
-- Description: Add signals (comments) for jams

CREATE TABLE IF NOT EXISTS public.jam_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jam_id UUID NOT NULL REFERENCES public.jams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.jam_signals(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jam_signals_jam_created ON public.jam_signals (jam_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jam_signals_parent ON public.jam_signals (parent_id, created_at ASC);

ALTER TABLE public.jam_signals ENABLE ROW LEVEL SECURITY;

-- Anyone can read signals for published, listed jams
CREATE POLICY "Signals are viewable for live jams" 
ON public.jam_signals FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.jams j
        WHERE j.id = jam_signals.jam_id
          AND j.status = 'published'
          AND j.is_listed = true
    )
);

-- Users can insert their own signals
CREATE POLICY "Users can insert own signals"
ON public.jam_signals FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update/delete their own signals
CREATE POLICY "Users can update own signals"
ON public.jam_signals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own signals"
ON public.jam_signals FOR DELETE
USING (auth.uid() = user_id);
