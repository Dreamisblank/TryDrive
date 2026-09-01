-- TryDrive schema.
--
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run. It is safe to re-run; every statement is guarded.
--
-- Row-level security is on for both tables and every policy is scoped to
-- auth.uid(), so a signed-in user can only ever read or write their own rows.
-- The anon key shipped to the browser therefore can't be used to read anyone
-- else's data.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  nickname          text,
  full_name         text,
  date_of_birth     date,
  gender            text,
  phone             text,

  -- What a rental desk actually needs.
  licence_number    text,
  licence_country   text,
  licence_expiry    date,

  -- Some firms ask for a passport as secondary ID on pickup.
  passport_number   text,
  passport_country  text,
  passport_expiry   date,

  -- 'light' | 'dark' | 'system' | 'auto'  ('auto' = follow local sunset)
  theme text not null default 'auto',

  notify_booking_email boolean not null default true,
  notify_price_alerts  boolean not null default true,
  notify_marketing     boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
-- Mirrors what we send to RentSyst so a user can see their own history.
-- RentSyst has no "list all bookings" endpoint, so this is our own record.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  booking_ref       text not null,          -- RentSyst booking_id, e.g. "ZJYUYN"
  rentsyst_client_id bigint,
  vehicle_id        bigint,
  vehicle_name      text,
  pickup_location   text,
  pickup_datetime   timestamptz,
  return_datetime   timestamptz,
  insurance_name    text,
  total_price       numeric(10, 2),
  currency          text,
  cabinet_url       text,

  created_at timestamptz not null default now()
);

create index if not exists bookings_user_id_created_at_idx
  on public.bookings (user_id, created_at desc);

alter table public.bookings enable row level security;

drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own" on public.bookings
  for select using (auth.uid() = user_id);

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Give every new user a profile row automatically
-- ---------------------------------------------------------------------------
-- Seeded from whatever the OAuth provider gave us, so a Google sign-in
-- arrives with a name already filled in.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, full_name, phone)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill anyone who signed up before this script was run.
insert into public.profiles (id, nickname, full_name, phone)
select
  u.id,
  coalesce(
    u.raw_user_meta_data ->> 'name',
    u.raw_user_meta_data ->> 'full_name',
    split_part(coalesce(u.email, ''), '@', 1)
  ),
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name'
  ),
  u.phone
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Keep updated_at honest
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Account deletion
-- ---------------------------------------------------------------------------
-- Lets a signed-in user delete themselves without the app needing the
-- service_role key (which must never reach the browser). Deleting the
-- auth.users row cascades to profiles and bookings.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
