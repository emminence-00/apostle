-- Index the self-referencing FK so CASCADE deletes and referral lookups do not
-- require a sequential scan of the users table.
create index if not exists users_referred_by_idx on public.users (referred_by);
