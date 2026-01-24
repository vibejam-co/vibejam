-- 2.1 Search Infrastructure (V3 - Mapping Table)

-- Create a separate search index table for flexibility
create table if not exists public.jam_search_index (
  jam_id uuid primary key references public.jams(id) on delete cascade,
  search_tsv tsvector,
  updated_at timestamptz default now()
);

create index if not exists idx_jam_search_tsv on public.jam_search_index using gin (search_tsv);

-- Trigger to sync search index
create or replace function public.sync_jam_search_index()
returns trigger as $$
declare
  v_tsv tsvector;
begin
  -- Only index published and non-hidden jams
  if NEW.status = 'published' and NEW.is_hidden = false then
    v_tsv := 
      setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(NEW.tagline, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(NEW.category, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(NEW.website_url, '')), 'D') ||
      setweight(to_tsvector('english', coalesce(NEW.vibe_tools::text, '')), 'D') ||
      setweight(to_tsvector('english', coalesce(NEW.tech_stack::text, '')), 'D');
      
    insert into public.jam_search_index (jam_id, search_tsv, updated_at)
    values (NEW.id, v_tsv, now())
    on conflict (jam_id) do update 
    set search_tsv = EXCLUDED.search_tsv, updated_at = now();
  else
    delete from public.jam_search_index where jam_id = NEW.id;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger tr_sync_jam_search_index
after insert or update of name, tagline, category, status, is_hidden, vibe_tools, tech_stack
on public.jams
for each row execute function public.sync_jam_search_index();

-- Populate existing items
insert into public.jam_search_index (jam_id, search_tsv)
select 
  id,
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(tagline, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(category, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(website_url, '')), 'D') ||
  setweight(to_tsvector('english', coalesce(vibe_tools::text, '')), 'D') ||
  setweight(to_tsvector('english', coalesce(tech_stack::text, '')), 'D')
from public.jams
where status = 'published' and is_hidden = false
on conflict (jam_id) do update set search_tsv = EXCLUDED.search_tsv;

-- Add status/visibility/recency index for discovery
create index if not exists idx_jams_discovery_active 
on public.jams (status, is_hidden, published_at desc);

-- 2.2 Lightweight Search Events
create table if not exists public.search_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  query text not null,
  results_count integer default 0,
  actor_id uuid references public.profiles(id),
  session_hash text
);

alter table public.search_events enable row level security;

-- RPC for Search with Ranking join
create or replace function public.search_jams_v1(p_query text, p_limit integer default 20, p_cursor text default null)
returns table (
  id uuid,
  name text,
  tagline text,
  category text,
  website_url text,
  media jsonb,
  stats jsonb,
  vibe_tools jsonb,
  tech_stack jsonb,
  published_at timestamptz,
  creator jsonb,
  rank_score float4
) as $$
begin
  return query
  select 
    j.id,
    j.name,
    j.tagline,
    j.category,
    j.website_url,
    j.media,
    j.stats,
    j.vibe_tools,
    j.tech_stack,
    j.published_at,
    jsonb_build_object(
      'name', p.display_name,
      'avatar', p.avatar_url,
      'handle', p.handle,
      'type', p.type
    ) as creator,
    ts_rank_cd(s.search_tsv, plainto_tsquery('english', p_query)) as rank_score
  from public.jams j
  join public.jam_search_index s on j.id = s.jam_id
  left join public.profiles p on j.creator_id = p.id
  where s.search_tsv @@ plainto_tsquery('english', p_query)
    -- Hidden/Status logic already handled by trigger/index table, but being safe:
    and j.status = 'published'
    and j.is_hidden = false
  order by rank_score desc, j.published_at desc
  limit p_limit;
end;
$$ language plpgsql security definer;
