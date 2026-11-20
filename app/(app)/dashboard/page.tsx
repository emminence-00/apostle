'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState, useCallback } from 'react';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DepositModal from '@/components/dashboard/DepositModal';
import WithdrawModal from '@/components/dashboard/WithdrawModal';
import { useApiFetch } from '@/lib/client/api';
import {
  formatCurrency,
  formatDate,
  truncateAddress,
  isWithdrawalUnlocked,
  getDaysUntilUnlock,
  getCycleMaturityDate,
  getCycleProgressPercent,
} from '@/lib/utils';
import type { User, Deposit, ReferredRow, DepositDisplayConfig } from '@/lib/types';
import { Loader2, Copy, Check, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

type MeResponse = {
  user: User;
  deposits: Deposit[];
  withdrawals: unknown[];
  referrals: ReferredRow[];
  config: DepositDisplayConfig;
};

export default function DashboardPage() {
  const { user: privyUser, authenticated } = usePrivy();
  const apiFetch = useApiFetch();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [depositConfig, setDepositConfig] = useState<DepositDisplayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const fetchData = useCallback(async () => {
    if (!privyUser) return;

    try {
      const referralCode =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('ref')
          : null;
      await apiFetch('/api/sync-user', {
        method: 'POST',
        body: JSON.stringify({ referralCode }),
      });

      const data = await apiFetch<MeResponse>('/api/me');
      setDbUser(data.user);
      setDeposits(data.deposits);
      setDepositConfig(data.config);
      setTosAccepted(data.user.tos_accepted ?? false);
      setLoadError('');
    } catch (err) {
      console.error('[dashboard] fetchData error:', err);
      setLoadError(err instanceof Error ? err.message : 'Could not load your account');
    } finally {
      setLoading(false);
    }
  }, [privyUser, apiFetch]);

  useEffect(() => {
    if (authenticated && privyUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
  }, [authenticated, privyUser, fetchData]);

  const confirmedDeposits = deposits.filter((d) => d.status === 'confirmed');
  const totalDeposited = confirmedDeposits.reduce((s, d) => s + d.amount, 0);
  const activeDeposit = confirmedDeposits.find((d) => !isWithdrawalUnlocked(d.created_at));
  const activeDepositAmount = activeDeposit ? activeDeposit.amount : 0;
  const daysLeftInCycle = activeDeposit ? getDaysUntilUnlock(activeDeposit.created_at) : 0;
  const cycleProgress = activeDeposit ? getCycleProgressPercent(activeDeposit.created_at) : 0;
  const cycleMaturity = activeDeposit ? getCycleMaturityDate(activeDeposit.created_at) : '';
  const availableBalance = confirmedDeposits
    .filter((d) => isWithdrawalUnlocked(d.created_at))
    .reduce((s, d) => s + d.amount, 0);
  const lockedBalance = totalDeposited - availableBalance;

  const handleTosAccept = async (): Promise<boolean> => {
    try {
      await apiFetch('/api/user/tos', { method: 'POST' });
      setTosAccepted(true);
      return true;
    } catch (err) {
      console.error('[dashboard] Could not save terms acceptance:', err);
      return false;
    }
  };

  const walletDisplay =
    privyUser?.wallet?.address ??
    privyUser?.linkedAccounts?.find((a) => a.type === 'wallet')?.address ??
    privyUser?.email?.address ??
    '';

  const copyAddr = () => {
    if (walletDisplay) {
      navigator.clipboard.writeText(walletDisplay);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="flex items-center gap-2.5">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
          <p className="text-[13px] text-[var(--text-muted)]">Loading…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <Card className="p-6">
          <p className="text-[14px] font-medium text-[var(--text-primary)]">Could not load your account</p>
          <p className="mt-2 text-[13px] text-[var(--text-secondary)]">{loadError}</p>
          <Button className="mt-5" onClick={() => fetchData()}>Try again</Button>
        </Card>
      </div>
    );
  }

  const stats = [
    { label: 'Total deposited', value: `$${formatCurrency(totalDeposited)}`, sub: 'USDC' },
    { label: 'In cycle', value: `$${formatCurrency(lockedBalance)}`, sub: 'Locked' },
    { label: 'Available', value: `$${formatCurrency(availableBalance)}`, sub: 'Ready to withdraw' },
    {
      label: 'Cycle closes',
      value: activeDeposit ? cycleMaturity : '—',
      sub: activeDeposit ? `${daysLeftInCycle}d remaining` : 'No active cycle',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-8">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center sm:pb-6">
        <div>
          <h1 className="text-[24px] font-medium leading-tight text-[var(--text-primary)]">Overview</h1>
          {walletDisplay && (
            <div className="mt-1 flex items-center gap-2">
              <span className="mono text-[12px] text-[var(--text-muted)]">
                {truncateAddress(walletDisplay, 10, 6)}
              </span>
              <button
                type="button"
                onClick={copyAddr}
                aria-label="Copy address"
                title="Copy address"
                className="text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--text-secondary)]"
              >
                {copiedAddr
                  ? <Check className="h-3 w-3 text-[var(--positive)]" />
                  : <Copy className="h-3 w-3" />}
              </button>
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button id="btn-deposit" className="w-full sm:w-auto" onClick={() => setDepositOpen(true)}>
            <ArrowDownLeft aria-hidden="true" />
            Deposit USDC
          </Button>
          <Button
            id="btn-withdraw"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setWithdrawOpen(true)}
            disabled={availableBalance === 0}
          >
            <ArrowUpRight aria-hidden="true" />
            Withdraw
          </Button>
        </div>
      </div>

      {deposits.length > 0 ? (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--border)] lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0 bg-[var(--surface)] p-4 sm:p-5">
              <p className="text-[11px] text-[var(--text-secondary)] sm:text-[12px]">{stat.label}</p>
              <p className="tabular-nums mt-2 text-[17px] font-medium leading-tight text-[var(--text-primary)] sm:text-[24px] sm:leading-none">
                {stat.value}
              </p>
              <p className="mt-2 text-[11px] text-[var(--text-muted)] sm:text-[12px]">{stat.sub}</p>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-5 sm:p-6">
          <p className="text-[14px] font-medium text-[var(--text-primary)]">No deposits yet</p>
          <p className="mt-2 max-w-md text-[14px] leading-6 text-[var(--text-secondary)]">
            Deposit USDC to start a 14-day trading cycle. Funds are pooled and traded; capital is at risk.
          </p>
          <Button id="btn-empty-deposit" className="mt-5" onClick={() => setDepositOpen(true)}>
            <ArrowDownLeft aria-hidden="true" />
            Deposit USDC
          </Button>
        </Card>
      )}

      {activeDeposit && (
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
            <div>
              <p className="text-[12px] text-[var(--text-muted)]">Current cycle</p>
              <p className="mt-1 text-[20px] font-medium text-[var(--text-primary)]">
                {cycleProgress}% complete
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 sm:gap-x-10 sm:gap-y-4">
              <div>
                <p className="text-[12px] text-[var(--text-secondary)]">Closes</p>
                <p className="mt-1 text-[14px] text-[var(--text-primary)]">{cycleMaturity} UTC</p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--text-secondary)]">In cycle</p>
                <p className="tabular-nums mt-1 text-[14px] text-[var(--text-primary)]">
                  ${formatCurrency(activeDepositAmount)} USDC
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[repeat(14,minmax(0,1fr))] gap-0.5 sm:mt-6 sm:gap-1" aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => {
              const day = index + 1;
              const completed = Math.max(0, Math.min(14, Math.ceil((cycleProgress / 100) * 14)));
              return (
                <span
                  key={day}
                  className={`h-1.5 rounded-full ${
                    day <= completed
                      ? 'bg-[var(--accent)]'
                      : 'bg-[var(--track)]'
                  }`}
                />
              );
            })}
          </div>
          <div className="mono mt-2 flex justify-between text-[11px] text-[var(--text-muted)]">
            <span>Deposit</span>
            <span>Settlement</span>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3.5 sm:px-5 sm:py-4">
          <h2 className="text-[14px] font-medium text-[var(--text-primary)]">Deposits</h2>
          <Link
            href="/transactions"
            className="text-[12px] text-[var(--accent)] transition-colors duration-150 hover:underline underline-offset-2"
          >
            View all transactions
          </Link>
        </div>
        {deposits.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-5">
            <p className="text-[13px] text-[var(--text-muted)]">No deposits yet.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--border)] sm:hidden">
              {deposits.slice(0, 6).map((d) => (
                <div key={d.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="tabular-nums font-mono text-[13px] font-medium text-[var(--text-primary)]">
                      ${formatCurrency(d.amount)}
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                      {formatDate(d.created_at)} · {isWithdrawalUnlocked(d.created_at) ? 'Completed' : 'In cycle'}
                    </p>
                  </div>
                  <Badge status={d.status} className="shrink-0" />
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[560px] text-[13px]">
                <thead className="border-b border-[var(--border)]">
                  <tr>
                    <th scope="col" className="px-5 py-3 text-left text-[12px] font-medium text-[var(--text-secondary)]">Date</th>
                    <th scope="col" className="px-5 py-3 text-right text-[12px] font-medium text-[var(--text-secondary)]">Amount</th>
                    <th scope="col" className="px-5 py-3 text-left text-[12px] font-medium text-[var(--text-secondary)]">Cycle</th>
                    <th scope="col" className="px-5 py-3 text-left text-[12px] font-medium text-[var(--text-secondary)]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {deposits.slice(0, 6).map((d) => (
                    <tr key={d.id} className="h-12 transition-colors duration-150 hover:bg-[var(--surface-hover)]">
                      <td className="px-5 text-[var(--text-secondary)]">{formatDate(d.created_at)}</td>
                      <td className="tabular-nums px-5 text-right font-mono font-medium text-[var(--text-primary)]">
                        ${formatCurrency(d.amount)}
                      </td>
                      <td className="px-5 text-[var(--text-secondary)]">
                        {isWithdrawalUnlocked(d.created_at) ? 'Completed' : 'In cycle'}
                      </td>
                      <td className="px-5"><Badge status={d.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {dbUser && (
        <>
          <DepositModal
            open={depositOpen}
            onClose={() => {
              setDepositOpen(false);
              fetchData();
            }}
            tosAccepted={tosAccepted}
            onTosAccept={handleTosAccept}
            hasActiveDeposit={!!activeDeposit}
            activeDepositDaysLeft={daysLeftInCycle}
            config={depositConfig}
          />
          <WithdrawModal
            open={withdrawOpen}
            onClose={() => {
              setWithdrawOpen(false);
              fetchData();
            }}
            availableBalance={availableBalance}
          />
        </>
      )}
    </div>
  );
}
