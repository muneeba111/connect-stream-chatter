create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null,
  price_id text,
  product_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  environment text not null default 'sandbox',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_env_idx on public.subscriptions(user_id, environment);

alter table public.subscriptions enable row level security;

create policy "Users view own subscriptions" on public.subscriptions
  for select to authenticated using (auth.uid() = user_id);

create trigger update_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at_column();

create or replace function public.has_active_subscription(_user_id uuid, _environment text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.subscriptions
    where user_id = _user_id
      and environment = _environment
      and status in ('active','trialing','past_due')
      and (current_period_end is null or current_period_end > now())
  );
$$;

alter publication supabase_realtime add table public.subscriptions;