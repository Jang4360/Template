create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null,
  status text not null check (status in ('active', 'cancelled', 'expired')),
  toss_customer_key text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id text not null unique,
  payment_key text,
  amount numeric not null,
  status text not null check (status in ('READY', 'DONE', 'CANCELLED', 'FAILED')),
  method text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null,
  status text not null check (status in ('pending', 'in_progress', 'resolved', 'closed')),
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiry_replies (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create trigger set_inquiries_updated_at
before update on public.inquiries
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_replies enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id);

create policy "subscriptions_select_own"
on public.subscriptions for select
using (auth.uid() = user_id);

create policy "payments_select_own"
on public.payments for select
using (auth.uid() = user_id);

create policy "inquiries_select_own_or_admin"
on public.inquiries for select
using (
  auth.uid() = user_id
  or (auth.jwt() ->> 'role') = 'admin'
);

create policy "inquiries_insert_own_or_admin"
on public.inquiries for insert
with check (
  auth.uid() = user_id
  or (auth.jwt() ->> 'role') = 'admin'
);

create policy "inquiries_update_admin"
on public.inquiries for update
using ((auth.jwt() ->> 'role') = 'admin');

create policy "inquiry_replies_select_party_or_admin"
on public.inquiry_replies for select
using (
  (auth.jwt() ->> 'role') = 'admin'
  or exists (
    select 1
    from public.inquiries i
    where i.id = inquiry_id
      and i.user_id = auth.uid()
  )
);

create policy "inquiry_replies_insert_party_or_admin"
on public.inquiry_replies for insert
with check (
  (auth.jwt() ->> 'role') = 'admin'
  or exists (
    select 1
    from public.inquiries i
    where i.id = inquiry_id
      and i.user_id = auth.uid()
  )
);
