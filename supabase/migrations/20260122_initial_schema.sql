
-- Migration: 20260122_initial_schema
-- Description: Initial schema for VibeJam v12.2 (Profiles, Jams, Bookmarks, Follows, Signals, Leaderboards)

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    handle TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    type TEXT CHECK (type IN ('user', 'creator')) DEFAULT 'creator',
    bio TEXT,
    x_url TEXT,
    github_url TEXT,
    website_url TEXT,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    bookmarks_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. JAMS
CREATE TABLE IF NOT EXISTS public.jams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    name TEXT,
    tagline TEXT,
    description TEXT,
    category TEXT,
    team_type TEXT CHECK (team_type IN ('solo', 'team')) DEFAULT 'solo',
    website_url TEXT NOT NULL,
    app_url TEXT,
    socials JSONB DEFAULT '{}'::jsonb,
    vibe_tools TEXT[] DEFAULT '{}'::text[],
    tech_stack TEXT[] DEFAULT '{}'::text[],
    mrr_bucket TEXT,
    mrr_value NUMERIC,
    mrr_visibility TEXT CHECK (mrr_visibility IN ('public', 'hidden')) DEFAULT 'hidden',
    media JSONB DEFAULT '{"heroImageUrl":null,"imageUrls":[],"videoEmbedUrl":null,"faviconUrl":null,"ogImageUrl":null,"screenshotUrl":null}'::jsonb,
    stats JSONB DEFAULT '{"upvotes":0,"views":0,"bookmarks":0,"commentsCount":0}'::jsonb,
    rank JSONB DEFAULT '{"scoreTrending":0,"scoreRevenue":0,"scoreNewest":0}'::jsonb,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jams_status_published_at ON public.jams (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_jams_creator_updated_at ON public.jams (creator_id, updated_at DESC);

ALTER TABLE public.jams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published jams are viewable by everyone" 
ON public.jams FOR SELECT USING (
    status = 'published' OR auth.uid() = creator_id
);

CREATE POLICY "Users can insert own jams" 
ON public.jams FOR INSERT WITH CHECK (
    auth.uid() = creator_id AND status = 'draft'
);

CREATE POLICY "Users can update own jams" 
ON public.jams FOR UPDATE USING (
    auth.uid() = creator_id
);


-- 3. BOOKMARKS
CREATE TABLE IF NOT EXISTS public.bookmarks (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    jam_id UUID REFERENCES public.jams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, jam_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bookmarks" 
ON public.bookmarks FOR ALL USING (auth.uid() = user_id);


-- 4. FOLLOWS
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone" 
ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" 
ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" 
ON public.follows FOR DELETE USING (auth.uid() = follower_id);


-- 5. SIGNALS DEDUPE
CREATE TABLE IF NOT EXISTS public.signals_dedupe (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- No RLS needed for signals_dedupe as it's accessed via Service Role in Edge Functions, 
-- but good practice to enable and not add policies (deny all default).
ALTER TABLE public.signals_dedupe ENABLE ROW LEVEL SECURITY;


-- 6. LEADERBOARDS
CREATE TABLE IF NOT EXISTS public.leaderboards (
    scope TEXT PRIMARY KEY,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    time_window JSONB,
    items JSONB
);

ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboards are viewable by everyone" 
ON public.leaderboards FOR SELECT USING (true);
-- No insert/update/delete policies for client; managed by Edge Functions.
