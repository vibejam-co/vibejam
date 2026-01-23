
-- Migration: 20260122_initial_schema
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    handle TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    type TEXT CHECK (type IN ('user', 'creator')) DEFAULT 'creator',
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.jams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    name TEXT,
    tagline TEXT,
    website_url TEXT NOT NULL,
    media JSONB DEFAULT '{"heroImageUrl":null,"faviconUrl":null}'::jsonb,
    stats JSONB DEFAULT '{"upvotes":0,"views":0,"bookmarks":0}'::jsonb,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.jams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published jams are viewable by everyone" ON public.jams FOR SELECT USING (status = 'published' OR auth.uid() = creator_id);
CREATE POLICY "Users can insert own jams" ON public.jams FOR INSERT WITH CHECK (auth.uid() = creator_id);
