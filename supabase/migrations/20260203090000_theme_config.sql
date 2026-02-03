alter table public.jams
  add column if not exists theme_id text,
  add column if not exists theme_config jsonb;
