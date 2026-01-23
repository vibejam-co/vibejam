
-- VibeJam v12.2 Canonical Schema
-- Targets: Supabase/PostgreSQL

-- Profiles table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jams table
CREATE TABLE IF NOT EXISTS public.jams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  one_liner TEXT,
  category TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT DEFAULT 'image',
  mrr TEXT DEFAULT '$0',
  is_revenue_public BOOLEAN DEFAULT TRUE,
  tech_stack TEXT[] DEFAULT '{}',
  vibe_tools TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic RLS Policies (Draft)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Jams are viewable by everyone" ON public.jams
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create jams" ON public.jams
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
