'use client';

import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const STEPS = [
  {
    number: '01',
    title: 'Connect a wallet',
    description: 'Sign in with email or a Web3 wallet through Privy.',
  },
  {
    number: '02',
    title: 'Deposit USDC',
    description: 'Send USDC to the Apostle master pool for the next 14-day cycle.',
  },
  {
    number: '03',
    title: 'Follow the cycle',
    description: 'Track your deposit and its settlement date in the dashboard.',
  },
  {
    number: '04',
    title: 'Withdraw at settlement',
    description: 'Once the cycle closes, your share becomes available to withdraw.',
  },
];

const PHASES = [
  { label: 'Deposit recorded', value: 'Day 01' },
  { label: 'Cycle open', value: 'Days 01–14' },
  { label: 'Settlement', value: 'Day 14' },
];

export default function HowItWorks() {
  const { authenticated, login } = usePrivy();
  const router = useRouter();

  const handleAction = () => {
    if (authenticated) {
      router.push('/dashboard');
    } else {
      login();
    }
  };

  return (
    <section id="how-it-works" className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-[1280px] gap-16 px-6 py-24 lg:grid-cols-2 lg:gap-20 lg:py-32">
        <div>
          <p className="text-[13px] text-[var(--text-muted)]">How it works</p>
          <h2 className="mt-4 max-w-lg text-[36px] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)] sm:text-[40px]">
            From deposit to settlement in four steps
          </h2>
          <p className="mt-5 max-w-[480px] text-[15px] leading-6 text-[var(--text-secondary)]">
            Each deposit starts its own 14-day cycle. You can follow it in the dashboard from start to settlement.
          </p>

          <ol className="mt-10 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {STEPS.map((step) => (
              <li key={step.number} className="grid grid-cols-[32px_1fr] gap-4 py-5">
                <span className="mono pt-1 text-[12px] tabular-nums text-[var(--text-muted)]">{step.number}</span>
                <div>
                  <h3 className="text-[14px] font-medium text-[var(--text-primary)]">{step.title}</h3>
                  <p className="mt-1 text-[14px] leading-6 text-[var(--text-secondary)]">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:pt-6">
          <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg)] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[20px] font-medium text-[var(--text-primary)]">Cycle timeline</h3>
                <p className="mt-1 text-[13px] text-[var(--text-secondary)]">How a 14-day deposit is accounted for</p>
              </div>
              <span className="mono text-[12px] text-[var(--text-muted)]">Example</span>
            </div>

            <div className="mt-10">
              <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1" aria-hidden="true">
                {Array.from({ length: 14 }, (_, index) => (
                  <span
                    key={index}
                    className={`h-2 rounded-full ${index === 0 || index === 13 ? 'bg-[var(--accent)]' : 'bg-[var(--track-filled)]'}`}
                  />
                ))}
              </div>
              <div className="mono mt-3 flex justify-between text-[11px] text-[var(--text-muted)]">
                <span>Day 01</span>
                <span>Day 14</span>
              </div>
            </div>

            <div className="mt-10 divide-y divide-[var(--border)] border-t border-[var(--border)]">
              {PHASES.map((phase) => (
                <div key={phase.label} className="flex items-center justify-between gap-4 py-4 text-[14px]">
                  <span className="text-[var(--text-secondary)]">{phase.label}</span>
                  <span className="mono text-[12px] tabular-nums text-[var(--text-primary)]">{phase.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-[var(--border)] pt-5">
              <p className="text-[13px] leading-6 text-[var(--text-muted)]">
                Withdrawals open once the cycle settles. Funds are pooled and traded; capital is at risk.
              </p>
              <Button className="mt-5 w-full" onClick={handleAction}>
                {authenticated ? 'Open dashboard' : 'Connect wallet'}
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
