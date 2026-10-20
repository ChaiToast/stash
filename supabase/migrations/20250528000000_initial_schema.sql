-- STASH initial schema
-- Phase 1: Database foundation

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.post_category as enum (
  'RECIPE',
  'WORKOUT',
  'BOOK',
  'MOVIE',
  'SHOW',
  'LIFE_ADVICE',
  'PRODUCT',
  'TRAVEL',
  'AESTHETIC',
  'UNCATEGORIZED'
);

create type public.user_plan as enum (
  'free',
  'lifetime_solo',
  'pro'
);

-- ---------------------------------------------------------------------------
-- Users (extends auth.users)
-- ---------------------------------------------------------------------------

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  plan public.user_plan not null default 'free',
  posts_synced integer not null default 0 check (posts_synced >= 0),
  streak_days integer not null default 0 check (streak_days >= 0),
  last_active timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.users is 'STASH user profiles linked to Supabase Auth';

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  ig_url text not null,
  caption text,
  image_alt text,
  category public.post_category not null default 'UNCATEGORIZED',
  confidence double precision not null default 0 check (confidence >= 0 and confidence <= 1),
  title text,
  structured_data jsonb not null default '{}'::jsonb,
  is_done boolean not null default false,
  user_category_override public.post_category,
  tags text[] not null default '{}',
  notes text,
  synced_at timestamptz not null default now(),
  ig_saved_at timestamptz,
  thumbnail_url text,
  source_account text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_user_ig_url_unique unique (user_id, ig_url)
);

comment on table public.posts is 'Instagram saved posts classified and stored for a user';

-- ---------------------------------------------------------------------------
-- Collections
-- ---------------------------------------------------------------------------

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  is_public boolean not null default false,
  share_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collections_user_slug_unique unique (user_id, share_slug)
);

comment on table public.collections is 'User-curated groupings of posts, optionally public';

-- ---------------------------------------------------------------------------
-- Collection ↔ Post join table
-- ---------------------------------------------------------------------------

create table public.collection_posts (
  collection_id uuid not null references public.collections (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, post_id)
);

comment on table public.collection_posts is 'Many-to-many link between collections and posts';

-- ---------------------------------------------------------------------------
-- Activity log
-- ---------------------------------------------------------------------------

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.activity_log is 'Audit trail for sync, classification, export, and user actions';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index users_email_idx on public.users (email);
create index users_last_active_idx on public.users (last_active desc);

create index posts_user_id_idx on public.posts (user_id);
create index posts_user_category_idx on public.posts (user_id, category);
create index posts_user_is_done_idx on public.posts (user_id, is_done);
create index posts_user_synced_at_idx on public.posts (user_id, synced_at desc);
create index posts_user_ig_saved_at_idx on public.posts (user_id, ig_saved_at desc nulls last);
create index posts_tags_gin_idx on public.posts using gin (tags);
create index posts_structured_data_gin_idx on public.posts using gin (structured_data);
create index posts_search_idx on public.posts using gin (
  to_tsvector(
    'english',
    coalesce(title, '') || ' ' ||
    coalesce(caption, '') || ' ' ||
    coalesce(notes, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
  )
);

create index collections_user_id_idx on public.collections (user_id);
create index collections_public_slug_idx on public.collections (share_slug) where is_public = true;

create index collection_posts_post_id_idx on public.collection_posts (post_id);

create index activity_log_user_created_idx on public.activity_log (user_id, created_at desc);
create index activity_log_action_idx on public.activity_log (action);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create trigger collections_set_updated_at
before update on public.collections
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.refresh_user_posts_synced()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set posts_synced = (
    select count(*)::integer
    from public.posts
    where user_id = coalesce(new.user_id, old.user_id)
  )
  where id = coalesce(new.user_id, old.user_id);

  return coalesce(new, old);
end;
$$;

create trigger posts_refresh_user_count_insert
after insert on public.posts
for each row execute function public.refresh_user_posts_synced();

create trigger posts_refresh_user_count_delete
after delete on public.posts
for each row execute function public.refresh_user_posts_synced();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.collections enable row level security;
alter table public.collection_posts enable row level security;
alter table public.activity_log enable row level security;

-- users
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- posts
create policy "Users can view own posts"
  on public.posts for select
  using (auth.uid() = user_id);

create policy "Users can insert own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on public.posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- collections
create policy "Users can view own collections"
  on public.collections for select
  using (auth.uid() = user_id or is_public = true);

create policy "Users can insert own collections"
  on public.collections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own collections"
  on public.collections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own collections"
  on public.collections for delete
  using (auth.uid() = user_id);

-- collection_posts
create policy "Users can view collection posts they own or public collections"
  on public.collection_posts for select
  using (
    exists (
      select 1
      from public.collections c
      where c.id = collection_posts.collection_id
        and (c.user_id = auth.uid() or c.is_public = true)
    )
  );

create policy "Users can insert into own collections"
  on public.collection_posts for insert
  with check (
    exists (
      select 1
      from public.collections c
      where c.id = collection_posts.collection_id
        and c.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.posts p
      where p.id = collection_posts.post_id
        and p.user_id = auth.uid()
    )
  );

create policy "Users can delete from own collections"
  on public.collection_posts for delete
  using (
    exists (
      select 1
      from public.collections c
      where c.id = collection_posts.collection_id
        and c.user_id = auth.uid()
    )
  );

-- activity_log
create policy "Users can view own activity"
  on public.activity_log for select
  using (auth.uid() = user_id);

create policy "Users can insert own activity"
  on public.activity_log for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Helper: log activity (callable from Edge Functions via service role)
-- ---------------------------------------------------------------------------

create or replace function public.log_activity(
  p_user_id uuid,
  p_action text,
  p_metadata jsonb default '{}'::jsonb
)
returns public.activity_log
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.activity_log;
begin
  insert into public.activity_log (user_id, action, metadata)
  values (p_user_id, p_action, p_metadata)
  returning * into result;

  return result;
end;
$$;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant execute on function public.log_activity(uuid, text, jsonb) to authenticated, service_role;
