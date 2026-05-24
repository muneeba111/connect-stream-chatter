
-- Conversations: one row per unique pair of users (user_a < user_b for uniqueness)
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null,
  user_b uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_user_order check (user_a < user_b),
  constraint conversations_distinct check (user_a <> user_b),
  constraint conversations_unique_pair unique (user_a, user_b)
);

alter table public.conversations enable row level security;

create policy "Participants can view conversation"
on public.conversations for select to authenticated
using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Participants can create conversation"
on public.conversations for insert to authenticated
with check (auth.uid() = user_a or auth.uid() = user_b);

create index conversations_user_a_idx on public.conversations(user_a);
create index conversations_user_b_idx on public.conversations(user_b);

-- Direct messages
create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.direct_messages enable row level security;

create policy "Participants can view DMs"
on public.direct_messages for select to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = direct_messages.conversation_id
      and (auth.uid() = c.user_a or auth.uid() = c.user_b)
  )
);

create policy "Participants can send DMs"
on public.direct_messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.conversations c
    where c.id = direct_messages.conversation_id
      and (auth.uid() = c.user_a or auth.uid() = c.user_b)
  )
);

create policy "Senders can delete own DMs"
on public.direct_messages for delete to authenticated
using (auth.uid() = sender_id);

create index direct_messages_conversation_idx on public.direct_messages(conversation_id, created_at desc);

-- Bump conversation.updated_at when a message is sent
create or replace function public.touch_conversation_on_dm()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end; $$;

create trigger direct_messages_touch_conversation
after insert on public.direct_messages
for each row execute function public.touch_conversation_on_dm();

-- Get-or-create conversation helper
create or replace function public.get_or_create_conversation(_other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
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
end; $$;

-- Realtime
alter publication supabase_realtime add table public.direct_messages;
