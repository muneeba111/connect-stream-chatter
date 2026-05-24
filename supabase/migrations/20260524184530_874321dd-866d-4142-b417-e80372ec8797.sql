
-- profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles viewable by authenticated users"
  on public.profiles for select to authenticated using (true);
create policy "Users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = user_id);
create policy "Users insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = user_id);

-- timestamp trigger
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- auto-create profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- rooms
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  topic text,
  category text not null default 'General',
  created_at timestamptz not null default now()
);
alter table public.rooms enable row level security;
create policy "Rooms readable by authenticated"
  on public.rooms for select to authenticated using (true);

-- messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;

create policy "Messages readable by authenticated"
  on public.messages for select to authenticated using (true);
create policy "Users insert own messages"
  on public.messages for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete own messages"
  on public.messages for delete to authenticated using (auth.uid() = user_id);

create index idx_messages_room_created on public.messages(room_id, created_at);

-- realtime
alter publication supabase_realtime add table public.messages;

-- seed rooms
insert into public.rooms (name, topic, category) values
  ('Vinyl Collector''s Lounge','Spinning records, swapping pressings.','Music'),
  ('Urban Gardening & Hydroponics','From balcony tomatoes to deep-water lettuce.','Lifestyle'),
  ('Late Night Mechanical Keyboards','Switches, keycaps, and the perfect thock.','Tech'),
  ('AI & The Future of Work','Tools, jobs, ethics, and everything in between.','Tech'),
  ('Lo-Fi Study Hall','Quiet co-working with chill beats.','Focus'),
  ('Late Night Cinema','Tonight: neo-noir classics.','Entertainment');
