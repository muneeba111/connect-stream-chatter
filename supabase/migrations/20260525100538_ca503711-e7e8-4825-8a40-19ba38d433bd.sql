CREATE OR REPLACE FUNCTION public.get_or_create_conversation(_other uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
declare
  me uuid := auth.uid();
  ua uuid;
  ub uuid;
  cid uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if _other = me then raise exception 'cannot DM yourself'; end if;
  if me < _other then ua := me; ub := _other; else ua := _other; ub := me; end if;
  select id into cid from public.conversations where user_a = ua and user_b = ub;
  if cid is null then
    insert into public.conversations (user_a, user_b) values (ua, ub) returning id into cid;
  end if;
  return cid;
end; $function$;