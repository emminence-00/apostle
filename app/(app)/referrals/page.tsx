'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useApiFetch } from '@/lib/client/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ReferredRow } from '@/lib/types';
import { Copy, Check, Loader2 } from 'lucide-react';

type MeResponse = {
  user: { referral_code: string };
  referrals: ReferredRow[];
};

export default function ReferralsPage() {
  const { user: privyUser, authenticated } = usePrivy();
  const apiFetch = useApiFetch();
  const [refCode, setRefCode] = useState('');
  const [referrals, setReferrals] = useState<ReferredRow[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authenticated || !privyUser) return;

    async function loadData() {
      try {
        await apiFetch('/api/sync-user', { method: 'POST' });
        const data = await apiFetch<MeResponse>('/api/me');
        setRefCode(data.user.referral_code ?? '');
        setReferrals(data.referrals);
        setTotalEarned(data.referrals.reduce((sum, item) => sum + item.fee_earned, 0));
      } catch (err) {
        console.error('[referrals] Could not load partners data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authenticated, privyUser, apiFetch]);

  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${refCode}`
      : `https://apostle.firm/?ref=${refCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-8">
      {/* Page header */}
      <div className="border-b border-[var(--border)] pb-5 sm:pb-6">
        <h1 className="text-[24px] font-medium text-[var(--text-primary)]">Partners</h1>
        <p className="text-[12px] text-[var(--text-secondary)] mt-1">
          Earn 10% of deposit fees from referrals.
        </p>
      </div>

      {/* Stats + link in one card */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-3 mb-5 sm:flex sm:items-center sm:gap-8 sm:mb-4">
          <div className="min-w-0">
            <p className="text-[11px] text-[var(--text-secondary)] sm:text-[12px]">Referred traders</p>
            <p className="text-[18px] tabular-nums font-medium text-[var(--text-primary)] mt-0.5 sm:text-[22px]">
              {referrals.length}
            </p>
          </div>
          <div className="hidden w-px h-8 bg-[var(--border)] sm:block" />
          <div className="min-w-0">
            <p className="text-[11px] text-[var(--text-secondary)] sm:text-[12px]">Commission rate</p>
            <p className="text-[18px] tabular-nums font-medium text-[var(--text-primary)] mt-0.5 sm:text-[22px]">
              10%
            </p>
          </div>
          <div className="hidden w-px h-8 bg-[var(--border)] sm:block" />
          <div className="min-w-0">
            <p className="text-[11px] text-[var(--text-secondary)] sm:text-[12px]">Total earned</p>
            <p className="text-[18px] tabular-nums font-medium text-[var(--positive)] mt-0.5 sm:text-[22px]">
              ${formatCurrency(totalEarned)}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-[12px] text-[var(--text-secondary)] mb-2">
            Your referral link
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 min-w-0 px-3 py-2 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--bg)] font-mono text-[12px] text-[var(--text-secondary)] focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            />
            <Button
              id="btn-copy-referral"
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              {copied
                ? <><Check className="w-3.5 h-3.5" /> Copied</>
                : <><Copy className="w-3.5 h-3.5" /> Copy</>
              }
            </Button>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
            You earn 10% of the 2% deposit fee paid by each referred trader.
          </p>
        </div>
      </Card>

      {/* Referral table */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3.5 border-b border-[var(--border)] sm:px-5">
          <h2 className="text-[14px] font-medium text-[var(--text-primary)]">Referred traders</h2>
        </div>
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 text-[var(--text-muted)] animate-spin" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-5">
            <p className="text-[13px] text-[var(--text-muted)]">No referrals yet.</p>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">Share your link to start earning.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--border)] sm:hidden">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[12px] text-[var(--text-primary)]">
                      {r.referred_email ?? r.referred_wallet ?? 'Anonymous'}
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{formatDate(r.created_at)}</p>
                  </div>
                  <p className="tabular-nums shrink-0 font-mono text-[13px] font-medium text-[var(--positive)]">
                    +${formatCurrency(r.fee_earned)}
                  </p>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[480px] text-[13px]">
                <thead className="border-b border-[var(--border)]">
                  <tr>
                    <th className="text-left px-5 py-3 text-[12px] text-[var(--text-secondary)] font-medium">User</th>
                    <th className="text-left px-5 py-3 text-[12px] text-[var(--text-secondary)] font-medium">Joined</th>
                    <th className="text-right px-5 py-3 text-[12px] text-[var(--text-secondary)] font-medium">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="px-5 h-12 text-[var(--text-secondary)] font-mono text-[12px] truncate max-w-[200px]">
                        {r.referred_email ?? r.referred_wallet ?? 'Anonymous'}
                      </td>
                      <td className="px-5 h-12 text-[var(--text-secondary)]">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="px-5 h-12 text-right tabular-nums font-mono font-medium text-[var(--positive)]">
                        +${formatCurrency(r.fee_earned)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
