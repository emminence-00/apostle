# Apostle go-live guide

This is the checklist for taking Apostle from this workspace to a public, production deployment.

## Current status

- The Next.js app is hardened: Privy access tokens are verified server-side, all ledger access goes through authenticated API routes, and deposits are verified on-chain before being credited.
- The Supabase project in `.env.local` already has these migrations applied: `001_initial`, `002_secure_access`, `003_revoke_rls_auto_enable`, `004_index_referred_by`.
- Supabase advisories are clean except for the expected `RLS enabled no policy` notices on the four ledger tables. That is intentional: no browser role can read or write these tables.
- Nothing is committed, pushed, or deployed yet. There is no git remote configured.

## 1. Prerequisites

You need:

- A Vercel account.
- A git remote (GitHub, GitLab, or Bitbucket).
- A Privy **production** app (not the development app).
- The Supabase project already configured in `.env.local`.
- An RPC endpoint for the deposit chain.
- The correct USDC contract address on that chain.
- The Apostle trading wallet address that will receive deposits.
- A production domain and DNS access.
- Legal/compliance sign-off before accepting real funds.

## 2. Supabase database

The migrations live in `supabase/migrations/`. Apply them in this order only on a fresh project:

1. `001_initial.sql` — creates `users`, `deposits`, `withdrawals`, `referrals`.
2. `002_secure_access.sql` — removes browser access and adds atomic deposit/withdrawal functions.
3. `003_revoke_rls_auto_enable.sql` — revokes browser access to Supabase's event-trigger helper.
4. `004_index_referred_by.sql` — indexes the self-referencing foreign key.

Apply with the Supabase SQL editor, Supabase CLI, or the Supabase MCP tool.

### Verify the database

Run these checks in the Supabase SQL editor:

```sql
-- All four tables must have RLS enabled.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('users', 'deposits', 'withdrawals', 'referrals');

-- This must return no rows. No browser policies are allowed.
select * from pg_policies where schemaname = 'public';

-- This must return no rows. anon/authenticated must have no table grants.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in ('users', 'deposits', 'withdrawals', 'referrals');

-- These must return only postgres and service_role.
select proname, proacl
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('create_verified_deposit', 'request_withdrawal', 'rls_auto_enable');

-- The transaction hash must be unique.
select indexdef
from pg_indexes
where schemaname = 'public'
  and indexname = 'deposits_tx_hash_unique';

-- This must return no rows. Every foreign key must be indexed.
select conrelid::regclass as table_name, a.attname as fk_column
from pg_constraint c
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
where c.contype = 'f'
  and c.connamespace = 'public'::regnamespace
  and not exists (
    select 1 from pg_index i
    where i.indrelid = c.conrelid and a.attnum = any(i.indkey)
  );
```

Run `get_advisors` or `supabase db advisors` after deployment. The `RLS enabled no policy` info notices are expected.

## 3. Environment variables

Copy `.env.local.example` as the source of truth. Set these in **Vercel → Project Settings → Environment Variables** for Production (and Preview if you want preview deploys to work).

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Yes | Public. From Privy dashboard. |
| `PRIVY_APP_SECRET` | Yes | Secret. Server-only. Used to verify access tokens. |
| `PRIVY_JWT_VERIFICATION_KEY` | No | Only set if you need a pinned verification key instead of Privy JWKS. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Secret. Never expose to the browser. |
| `DEPOSIT_CHAIN_ID` | Yes | Numeric chain ID, e.g. `137` for Polygon. |
| `DEPOSIT_RPC_URL` | Yes | Server-side RPC URL for that chain. |
| `USDC_CONTRACT_ADDRESS` | Yes | Native USDC contract on that chain. |
| `APOSTLE_TRADING_WALLET` | Yes | Wallet that receives deposits. Must match what the UI shows. |
| `MIN_DEPOSIT_USDC` | Yes | Minimum accepted deposit. |
| `ALLOW_UNVERIFIED_DEPOSITS` | No | **Never set in production.** Local development only. |

Notes:

- Do **not** set `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The app no longer uses a browser Supabase client.
- Any `NEXT_PUBLIC_*` variable is sent to the browser. Never put a secret in one.
- `DEPOSIT_CHAIN_ID`, `DEPOSIT_RPC_URL`, `USDC_CONTRACT_ADDRESS` and `APOSTLE_TRADING_WALLET` must all refer to the same network. A mismatch will cause deposits to fail closed.
- Use Node.js 22 in Vercel project settings.

## 4. Privy configuration

1. Open the [Privy dashboard](https://dashboard.privy.io/) and select the **production** app.
2. Add your production origins under **App Settings → Domains** / allowed origins. Add both:
   - `https://apostle.firm`
   - `https://www.apostle.firm`
3. Add Vercel preview URLs only if you want preview deployments to authenticate.
4. Confirm the login methods you want (email and/or wallets).
5. Copy the production app ID and app secret into Vercel.
6. Do not put development credentials in Production.

## 5. Deploy

1. Add a git remote and commit the work:

   ```bash
   git remote add origin <your-repo-url>
   git add .
   git commit -m "Harden Apostle for production"
   git push -u origin main
   ```

2. In Vercel, choose **Add New → Project** and import the repository.
3. Framework should be detected as Next.js. Build command: `pnpm build`. Output: auto-detected.
4. Set Node.js version to 22.
5. Add all environment variables from section 3.
6. Click **Deploy**.
7. Add your custom domain under **Project Settings → Domains** and point DNS at Vercel.
8. Re-check Privy allowed origins after the domain is live.

## 6. Post-deploy verification

Set your domain:

```bash
BASE=https://apostle.firm
```

Public pages and assets should return `200`:

```bash
for p in / /dashboard /transactions /referrals /icon.svg /logo.svg; do
  printf '%s ' "$p"
  curl -s -o /dev/null -w '%{http_code}\n' "$BASE$p"
done
```

API routes must reject unauthenticated requests with `401`:

```bash
for p in /api/me /api/sync-user /api/deposit /api/withdraw /api/user/tos; do
  m=GET
  case "$p" in /api/me) ;; *) m=POST ;; esac
  printf '%s ' "$p"
  curl -s -o /dev/null -w '%{http_code}\n' -X "$m" -H 'Content-Type: application/json' -d '{}' "$BASE$p"
done
```

Then test the full product flow with a small real deposit:

1. Sign in with a wallet linked in Privy.
2. Accept the terms. The `users.tos_accepted` row should become `true`.
3. Open the deposit modal. It should show the configured network, USDC contract context and destination wallet from `/api/me`.
4. Send a small amount of USDC on the configured network to the destination wallet.
5. Paste the transaction hash and confirm.
6. Confirm the deposit appears in the dashboard and transactions page with the amount derived from the on-chain log, not from the browser.
7. Try to paste the same transaction hash again. It must be rejected as already recorded.
8. After the 14-day cycle, request a withdrawal. Confirm outstanding requests cannot be double-spent.

Check Vercel **Runtime Logs** and Supabase **Logs** for errors during the test.

## 7. Monitoring and operations

- Enable Vercel log drains or at least keep Runtime Logs available.
- Run Supabase Advisors after each schema change.
- Enable Supabase daily backups; verify a restore target exists.
- Add alerting for:
  - API `5xx` rate.
  - Privy verification failures.
  - Deposit RPC errors or timeouts.
  - Repeated duplicate transaction hash attempts.
- Apply rate limiting at Vercel/edge for the API routes.
- Keep the RPC provider funded and monitor its uptime. Consider a failover endpoint.
- Keep the trading wallet private key under a proper custody process; it is not stored in this app.
- Reconcile Supabase `confirmed` deposits against on-chain transfers on a schedule.

## 8. Scaling notes

- The service-role client is server-only; never move it into a client component.
- Indexes already cover the per-user ledger queries and all foreign keys.
- `create_verified_deposit` and `request_withdrawal` lock only the user row and do not make external calls, so they stay short.
- If request volume grows, add rate limiting and a queue rather than relaxing database constraints.
- Move the two `SECURITY DEFINER` functions to a non-exposed schema only if you also update the RPC calls and re-test thoroughly.

## 9. Rollback

- Application rollback: redeploy the previous Vercel deployment.
- Database rollback: do **not** re-enable browser grants or permissive RLS policies. A safe rollback is to restore a known-good Supabase backup, then re-apply migrations `002`–`004`.
- If deposits are failing, leave them failing closed. Do not enable `ALLOW_UNVERIFIED_DEPOSITS` in production.

## 10. Before accepting real funds

This code removes the main technical shortcuts, but it is not a substitute for:

- Legal and regulatory review.
- Terms of service and risk disclosures reviewed by counsel.
- KYC/AML process where required.
- Custody and key-management policy for the trading wallet.
- Accounting and tax treatment of deposits, fees and referral payouts.
