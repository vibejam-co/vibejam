-- Migration: 20260122_add_upvotes
-- Description: Add jam_upvotes table to support atomic toggling

CREATE TABLE IF NOT EXISTS public.jam_upvotes (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    jam_id UUID REFERENCES public.jams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, jam_id)
);

ALTER TABLE public.jam_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own upvotes" 
ON public.jam_upvotes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Upvotes are viewable by everyone"
ON public.jam_upvotes FOR SELECT USING (true);
