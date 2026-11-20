'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useApiFetch } from '@/lib/client/api';
import {
  formatCurrency,
  formatDateTime,
  getExplorerUrl,
  truncateAddress,
} from '@/lib/utils';
import type { Deposit, Withdrawal } from '@/lib/types';
import { ArrowDownLeft, ArrowUpRight, ExternalLink, Loader2 } from 'lucide-react';

interface CombinedTx {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: string;
  date: string;
  tx_hash?: string | null;
  chain_id?: number | null;
  wallet_address?: string | null;
}

type MeResponse = { deposits: Deposit[]; withdrawals: Withdrawal[] };

export default function TransactionsPage() {
  const { user: privyUser, authenticated } = usePrivy();
  const apiFetch = useApiFetch();
  const [transactions, setTransactions] = useState<CombinedTx[]>([]);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authenticated || !privyUser) return;

    async function loadTx() {
      try {
        const data = await apiFetch<MeResponse>('/api/me');
        const formattedDeps: CombinedTx[] = data.deposits.map((d) => ({
          id: d.id,
          type: 'deposit',
          amount: d.amount,
          status: d.status,
          date: d.created_at,
          tx_hash: d.tx_hash,
          chain_id: d.chain_id,
        }));

        const formattedWiths: CombinedTx[] = data.withdrawals.map((w) => ({
          id: w.id,
          type: 'withdrawal',
          amount: w.amount,
          status: w.status,
          date: w.requested_at,
          wallet_address: w.destination_address ?? null,
        }));

        setTransactions(
          [...formattedDeps, ...formattedWiths].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );
      } catch (err) {
        console.error('[transactions] Could not load ledger:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTx();
  }, [authenticated, privyUser, apiFetch]);

  const filtered = transactions.filter(
    (tx) => filter === 'all' || tx.type === filter
  );

  const tabs: { key: 'all' | 'deposit' | 'withdrawal'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'deposit', label: 'Deposits' },
    { key: 'withdrawal', label: 'Withdrawals' },
  ];

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5 sm:pb-6">
        <div>
          <h1 className="text-[24px] font-medium text-[var(--text-primary)]">Transactions</h1>
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">
            All deposits and withdrawals.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex w-full items-center gap-1 p-1 border border-[var(--border)] rounded-[var(--radius-btn)] bg-[var(--surface)] sm:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              id={`filter-${tab.key}`}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 px-3 py-1.5 rounded-[var(--radius-tag)] text-[12px] font-medium transition-colors sm:flex-none ${
                filter === tab.key
                  ? 'bg-[var(--surface-hover)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-5 h-5 text-[var(--text-muted)] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[13px] text-[var(--text-muted)]">No transactions found.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--border)] sm:hidden">
              {filtered.map((tx) => (
                <div key={tx.id} className="px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {tx.type === 'deposit' ? (
                        <ArrowDownLeft className="w-3.5 h-3.5 text-[var(--positive)] shrink-0" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                      )}
                      <span className="truncate text-[13px] text-[var(--text-primary)] capitalize">{tx.type}</span>
                      <Badge status={tx.status} className="shrink-0" />
                    </div>
                    <p className="tabular-nums shrink-0 font-mono text-[13px] font-medium text-[var(--text-primary)]">
                      ${formatCurrency(tx.amount)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-[var(--text-secondary)]">
                    <span>{formatDateTime(tx.date)}</span>
                    {tx.tx_hash ? (
                      <a
                        href={getExplorerUrl(tx.chain_id, tx.tx_hash)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex shrink-0 items-center gap-1 font-mono text-[var(--accent)] hover:underline underline-offset-2"
                      >
                        {truncateAddress(tx.tx_hash, 6, 4)}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : tx.wallet_address ? (
                      <span className="shrink-0 font-mono">{truncateAddress(tx.wallet_address, 6, 4)}</span>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[680px] text-[13px]">
                <thead className="border-b border-[var(--border)]">
                  <tr>
                    <th className="text-left px-5 py-3 text-[12px] text-[var(--text-secondary)] font-medium">Type</th>
                    <th className="text-right px-5 py-3 text-[12px] text-[var(--text-secondary)] font-medium">Amount</th>
                    <th className="text-left px-5 py-3 text-[12px] text-[var(--text-secondary)] font-medium">Status</th>
                    <th className="text-left px-5 py-3 text-[12px] text-[var(--text-secondary)] font-medium">Timestamp</th>
                    <th className="text-left px-5 py-3 text-[12px] text-[var(--text-secondary)] font-medium">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="px-5 h-12">
                        <div className="flex items-center gap-2">
                          {tx.type === 'deposit' ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-[var(--positive)] shrink-0" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                          )}
                          <span className="text-[var(--text-primary)] capitalize">{tx.type}</span>
                        </div>
                      </td>
                      <td className="px-5 h-12 text-right font-mono tabular-nums font-medium text-[var(--text-primary)]">
                        ${formatCurrency(tx.amount)}
                      </td>
                      <td className="px-5 h-12">
                        <Badge status={tx.status} />
                      </td>
                      <td className="px-5 h-12 text-[var(--text-secondary)]">
                        {formatDateTime(tx.date)}
                      </td>
                      <td className="px-5 h-12 font-mono text-[12px]">
                        {tx.tx_hash ? (
                          <a
                            href={getExplorerUrl(tx.chain_id, tx.tx_hash)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[var(--accent)] hover:underline underline-offset-2"
                          >
                            {truncateAddress(tx.tx_hash)}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : tx.wallet_address ? (
                          <span className="text-[var(--text-secondary)]">{truncateAddress(tx.wallet_address)}</span>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
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
