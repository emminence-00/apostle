'use client';

import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const REFERRALS = [
  { id: '0x7A…4C21', deposit: '10,000 USDC', status: 'Settled' },
  { id: '0x9E…18B0', deposit: '8,000 USDC', status: 'Cycle open' },
  { id: '0x3F…D902', deposit: '6,000 USDC', status: 'Settled' },
];

const DETAILS = [
  {
    number: '01',
    title: 'Share your partner link',
    description: 'Invite depositors to Apostle using a link tied to your partner account.',
  },
  {
    number: '02',
    title: 'Track referred deposits',
    description: 'See each referral, its deposit and its cycle status in one ledger.',
  },
  {
    number: '03',
    title: 'Follow fee payouts',
    description: 'Payouts come from platform fees on referred deposits and appear in your console.',
  },
];

export default function ReferralSection() {
  const { authenticated, login } = usePrivy();
  const router = useRouter();

  const handleAction = () => {
    if (authenticated) {
      router.push('/referrals');
    } else {
      login();
    }
  };

  return (
    <section id="partners" className="border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto grid max-w-[1280px] gap-16 px-6 py-24 lg:grid-cols-2 lg:gap-20 lg:py-32">
        <div>
          <p className="text-[13px] text-[var(--text-muted)]">Partners</p>
          <h2 className="mt-4 max-w-lg text-[36px] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)] sm:text-[40px]">
            Refer depositors, track the payout ledger
          </h2>
          <p className="mt-5 max-w-[480px] text-[15px] leading-6 text-[var(--text-secondary)]">
            Invite capital to Apostle. Referral volume and fee payouts are listed in your partner console.
          </p>

          <div className="mt-10 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {DETAILS.map((detail) => (
              <div key={detail.number} className="grid grid-cols-[32px_1fr] gap-4 py-5">
                <span className="mono pt-1 text-[12px] tabular-nums text-[var(--text-muted)]">{detail.number}</span>
                <div>
                  <h3 className="text-[14px] font-medium text-[var(--text-primary)]">{detail.title}</h3>
                  <p className="mt-1 text-[14px] leading-6 text-[var(--text-secondary)]">{detail.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Button className="mt-8" onClick={handleAction}>
            Get partner link
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[20px] font-medium text-[var(--text-primary)]">Partner ledger</h3>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Example cycle activity</p>
            </div>
            <span className="mono text-[12px] text-[var(--text-muted)]">3 referrals</span>
          </div>

          <div className="mt-8 overflow-hidden rounded-[12px] border border-[var(--border)]">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[var(--surface-hover)] text-[var(--text-muted)]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-[12px] font-medium">Referral</th>
                  <th scope="col" className="px-4 py-3 text-right text-[12px] font-medium">Deposit</th>
                  <th scope="col" className="px-4 py-3 text-right text-[12px] font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {REFERRALS.map((referral) => (
                  <tr key={referral.id}>
                    <td className="mono px-4 py-4 text-[var(--text-primary)]">{referral.id}</td>
                    <td className="mono px-4 py-4 text-right tabular-nums text-[var(--text-secondary)]">{referral.deposit}</td>
                    <td className="px-4 py-4 text-right text-[var(--text-muted)]">{referral.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-5 text-[14px]">
            <span className="text-[var(--text-secondary)]">Referred deposits</span>
            <span className="mono tabular-nums text-[var(--text-primary)]">24,000 USDC</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 text-[14px]">
            <span className="text-[var(--text-secondary)]">Next payout</span>
            <span className="text-[var(--text-primary)]">Cycle settlement</span>
          </div>
        </div>
      </div>
    </section>
  );
}
