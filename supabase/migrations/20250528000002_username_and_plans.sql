-- Username for public collection URLs + plan metadata helpers

alter table public.users
add column if not exists username text;

create unique index if not exists users_username_unique_idx
  on public.users (username)
  where username is not null;

create or replace function public.slugify_username(source text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      lower(split_part(coalesce(source, ''), '@', 1)),
      '[^a-z0-9]+',
      '-',
      'g'
    ),
    ''
  );
$$;

create or replace function public.ensure_user_username()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  suffix integer := 0;
begin
  if new.username is not null and new.username <> '' then
    return new;
  end if;

  base := public.slugify_username(new.email);
  if base is null then
    base := 'user';
  end if;

  candidate := base;

  while exists (
    select 1
    from public.users u
    where u.username = candidate
      and u.id <> new.id
  ) loop
    suffix := suffix + 1;
    candidate := base || '-' || suffix::text;
  end loop;

  new.username := candidate;
  return new;
end;
$$;

drop trigger if exists users_ensure_username on public.users;

create trigger users_ensure_username
before insert or update on public.users
for each row execute function public.ensure_user_username();

update public.users
set username = public.slugify_username(email)
where username is null;

-- Backfill usernames with collision handling
do $$
declare
  rec record;
  base text;
  candidate text;
  suffix integer;
begin
  for rec in
    select id, email
    from public.users
    where username is null
  loop
    base := coalesce(public.slugify_username(rec.email), 'user');
    candidate := base;
    suffix := 0;

    while exists (
      select 1 from public.users u where u.username = candidate and u.id <> rec.id
    ) loop
      suffix := suffix + 1;
      candidate := base || '-' || suffix::text;
    end loop;

    update public.users set username = candidate where id = rec.id;
  end loop;
end;
$$;

alter table public.users
alter column username set not null;
