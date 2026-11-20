-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Users ───────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id              uuid primary key default gen_random_uuid(),
  privy_id        text not null unique,
  email           text,
  wallet_address  text,
  referral_code   text not null unique,
  referred_by     uuid references public.users(id) on delete set null,
  tos_accepted    boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ─── Deposits ─────────────────────────────────────────────────────────────────
create table if not exists public.deposits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  amount      numeric(18, 6) not null check (amount > 0),
  tx_hash     text,
  status      text not null default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  created_at  timestamptz not null default now()
);

-- ─── Withdrawals ──────────────────────────────────────────────────────────────
create table if not exists public.withdrawals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  amount        numeric(18, 6) not null check (amount > 0),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'processed', 'rejected')),
  unlocks_at    timestamptz not null,
  requested_at  timestamptz not null default now(),
  processed_at  timestamptz
);

-- ─── Referrals ────────────────────────────────────────────────────────────────
create table if not exists public.referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references public.users(id) on delete cascade,
  referred_id  uuid not null unique references public.users(id) on delete cascade,
  fee_earned   numeric(18, 6) not null default 0 check (fee_earned >= 0),
  bonus_paid   numeric(18, 6) not null default 0 check (bonus_paid >= 0),
  created_at   timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.users       enable row level security;
alter table public.deposits    enable row level security;
alter table public.withdrawals enable row level security;
alter table public.referrals   enable row level security;

-- Drop legacy policies if present
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "deposits_select_own" on public.deposits;
drop policy if exists "deposits_insert_own" on public.deposits;
drop policy if exists "withdrawals_select_own" on public.withdrawals;
drop policy if exists "withdrawals_insert_own" on public.withdrawals;
drop policy if exists "referrals_select_referrer" on public.referrals;

-- Allow read & write (Authentication & access control are managed via Privy & service client API routes)
create policy "users_select_policy" on public.users for select using (true);
create policy "users_insert_policy" on public.users for insert with check (true);
create policy "users_update_policy" on public.users for update using (true);

create policy "deposits_select_policy" on public.deposits for select using (true);
create policy "deposits_insert_policy" on public.deposits for insert with check (true);

create policy "withdrawals_select_policy" on public.withdrawals for select using (true);
create policy "withdrawals_insert_policy" on public.withdrawals for insert with check (true);

create policy "referrals_select_policy" on public.referrals for select using (true);
create policy "referrals_insert_policy" on public.referrals for insert with check (true);
create policy "referrals_update_policy" on public.referrals for update using (true);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists deposits_user_id_idx    on public.deposits(user_id);
create index if not exists withdrawals_user_id_idx on public.withdrawals(user_id);
create index if not exists referrals_referrer_idx  on public.referrals(referrer_id);
create index if not exists users_referral_code_idx on public.users(referral_code);
