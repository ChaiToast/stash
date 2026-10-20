-- Ensure log_activity cannot write on behalf of other users.
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
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized activity log';
  end if;

  insert into public.activity_log (user_id, action, metadata)
  values (p_user_id, p_action, p_metadata)
  returning * into result;

  return result;
end;
$$;
