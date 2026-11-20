-- Secure the ledger. All application access now goes through verified API
-- routes using the service-role key; browser clients have no table access.

alter table public.deposits add column if not exists chain_id integer;

alter table public.users       enable row level security;
alter table public.deposits    enable row level security;
alter table public.withdrawals enable row level security;
alter table public.referrals   enable row level security;

-- Remove the permissive policies from 001_initial.sql. With RLS enabled and no
-- policies, anon/authenticated clients can read and write nothing.
drop policy if exists "users_select_policy"          on public.users;
drop policy if exists "users_insert_policy"          on public.users;
drop policy if exists "users_update_policy"          on public.users;
drop policy if exists "deposits_select_policy"       on public.deposits;
drop policy if exists "deposits_insert_policy"       on public.deposits;
drop policy if exists "withdrawals_select_policy"    on public.withdrawals;
drop policy if exists "withdrawals_insert_policy"    on public.withdrawals;
drop policy if exists "referrals_select_policy"      on public.referrals;
drop policy if exists "referrals_insert_policy"      on public.referrals;
drop policy if exists "referrals_update_policy"      on public.referrals;

revoke all on public.users       from anon, authenticated;
revoke all on public.deposits    from anon, authenticated;
revoke all on public.withdrawals from anon, authenticated;
revoke all on public.referrals   from anon, authenticated;

-- Supporting indexes for the per-user ledger views.
create index if not exists deposits_user_created_idx
  on public.deposits (user_id, created_at desc);
create index if not exists withdrawals_user_requested_idx
  on public.withdrawals (user_id, requested_at desc);
create index if not exists referrals_referrer_created_idx
  on public.referrals (referrer_id, created_at desc);

-- A transaction hash may only be recorded once. If historical duplicates
-- exist, clean them up first and re-run this migration.
do $$
begin
  if exists (
    select 1 from public.deposits
    where tx_hash is not null
    group by tx_hash
    having count(*) > 1
  ) then
    raise notice 'Skipping deposits_tx_hash_unique: duplicate tx_hash rows exist';
  else
    create unique index if not exists deposits_tx_hash_unique
      on public.deposits (tx_hash) where tx_hash is not null;
  end if;
end $$;

-- Atomic deposit insert: serializes per user and enforces one active 14-day
-- cycle inside the transaction, so concurrent requests cannot bypass the UI.
create or replace function public.create_verified_deposit(
  p_user_id uuid,
  p_amount numeric,
  p_tx_hash text,
  p_chain_id integer
)
returns public.deposits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.deposits;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid deposit amount';
  end if;
  if p_tx_hash is null or p_tx_hash = '' then
    raise exception 'Transaction hash is required';
  end if;

  perform 1 from public.users where id = p_user_id for update;

  if exists (
    select 1
      from public.deposits
     where user_id = p_user_id
       and status = 'confirmed'
       and created_at >= now() - interval '14 days'
  ) then
    raise exception 'A deposit is already in its 14-day cycle';
  end if;

  insert into public.deposits (user_id, amount, tx_hash, chain_id, status)
  values (p_user_id, p_amount, p_tx_hash, p_chain_id, 'confirmed')
  returning * into v_result;

  return v_result;
end;
$$;

-- Atomic withdrawal request: serializes per user, re-checks the unlocked
-- balance (minus outstanding withdrawal requests), and inserts in one statement.
create or replace function public.request_withdrawal(p_user_id uuid, p_amount numeric)
returns public.withdrawals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available numeric;
  v_result public.withdrawals;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid withdrawal amount';
  end if;

  -- Serialize concurrent withdrawal requests for the same user.
  perform 1 from public.users where id = p_user_id for update;

  select
    coalesce((
      select sum(amount)
        from public.deposits
       where user_id = p_user_id
         and status = 'confirmed'
         and created_at <= now() - interval '14 days'
    ), 0)
    - coalesce((
      select sum(amount)
        from public.withdrawals
       where user_id = p_user_id
         and status in ('pending', 'approved', 'processed')
    ), 0)
    into v_available;

  if v_available < p_amount then
    raise exception 'Insufficient unlocked balance';
  end if;

  insert into public.withdrawals (user_id, amount, status, unlocks_at)
  values (p_user_id, p_amount, 'pending', now() + interval '14 days')
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.create_verified_deposit(uuid, numeric, text, integer) from public, anon, authenticated;
grant execute on function public.create_verified_deposit(uuid, numeric, text, integer) to service_role;

revoke all on function public.request_withdrawal(uuid, numeric) from public, anon, authenticated;
grant execute on function public.request_withdrawal(uuid, numeric) to service_role;
