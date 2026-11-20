# Apostle

Apostle is a private trading firm for USDC deposits. Depositors connect a wallet, send USDC to the master pool for a 14-day cycle, follow the cycle in the dashboard, and withdraw their share at settlement. Partners can refer depositors and track fee payouts.

## Stack

- Next.js 16 App Router, React 19, Tailwind CSS 4
- Privy for wallet and email authentication
- Supabase for users, deposits, withdrawals and referrals

## Getting started

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `pnpm dev` — development server
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — lint

## Structure

- `app/(marketing)` — public site
- `app/(app)` — authenticated dashboard, transactions and partners
- `app/api` — user sync, deposit and withdrawal endpoints
- `components` — UI, marketing, dashboard and providers
- `supabase/migrations` — database schema

## Production setup

See [GO_LIVE.md](./GO_LIVE.md) for the full deployment checklist.

1. Apply `supabase/migrations/001_initial.sql`, `002_secure_access.sql`, `003_revoke_rls_auto_enable.sql`, then `004_index_referred_by.sql`, in order. Migration 002 removes all browser access to the ledger and adds atomic deposit/withdrawal functions.
2. Set every variable in `.env.local.example` in your hosting environment. The browser never receives the Supabase service-role key or Privy app secret.
3. Configure Privy with your production domain as an allowed origin. Use `@privy-io/node` to verify access tokens on every API route.
4. Set `DEPOSIT_CHAIN_ID`, `DEPOSIT_RPC_URL`, `USDC_CONTRACT_ADDRESS` and `APOSTLE_TRADING_WALLET` to the same network. Deposits are credited only after an on-chain USDC transfer from a wallet linked to the authenticated Privy account is verified.
5. Legal and compliance review is required before accepting real funds.
