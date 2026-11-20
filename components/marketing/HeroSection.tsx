'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const NAV_SERIES = [100, 100.4, 100.2, 101.1, 101.8, 101.5, 102.3];
const CHART = { width: 640, height: 176, pad: 12 };
const CYCLE_DAYS = 14;
const EXAMPLE_DAY = 8;

function bounds(values: number[]) {
  const min = Math.min(...values) - 0.3;
  const max = Math.max(...values) + 0.3;
  return { min, max, span: max - min || 1 };
}

function pointX(index: number) {
  return CHART.pad + (index / (NAV_SERIES.length - 1)) * (CHART.width - 2 * CHART.pad);
}

function pointY(value: number) {
  const { min, span } = bounds(NAV_SERIES);
  return CHART.pad + (1 - (value - min) / span) * (CHART.height - 2 * CHART.pad);
}

function linePath() {
  return NAV_SERIES.map((value, index) =>
    `${index === 0 ? 'M' : 'L'} ${pointX(index).toFixed(1)} ${pointY(value).toFixed(1)}`
  ).join(' ');
}

function areaPath() {
  return `${linePath()} L ${pointX(NAV_SERIES.length - 1).toFixed(1)} ${CHART.height} L ${CHART.pad} ${CHART.height} Z`;
}

function axisLabels() {
  const { min, max } = bounds(NAV_SERIES);
  return [max, (min + max) / 2, min].map((value) => value.toFixed(2));
}

export default function HeroSection() {
  const { authenticated, login } = usePrivy();
  const router = useRouter();

  const handleLaunch = () => {
    if (authenticated) {
      router.push('/dashboard');
    } else {
      login();
    }
  };

  return (
    <>
      <section id="cycles" className="bg-[var(--bg)]">
        <div className="mx-auto max-w-[1200px] px-6 pt-24 pb-20 text-center lg:pt-32 lg:pb-24">
          <p className="mono text-[12px] tracking-[0.08em] text-[var(--text-muted)]">
            Private trading firm · USDC
          </p>
          <h1
            data-word="Apostle"
            className="hero-wordmark mt-6 text-[clamp(4rem,12vw,10rem)] font-normal leading-[0.88] tracking-[-0.065em] text-[var(--text-primary)]"
          >
            Apostle
          </h1>
          <div className="mx-auto mt-8 flex h-[2px] max-w-[360px] gap-1" aria-hidden="true">
            {Array.from({ length: CYCLE_DAYS }, (_, index) => {
              const day = index + 1;
              return (
                <span
                  key={day}
                  className={`h-full flex-1 rounded-full ${
                    day === EXAMPLE_DAY
                      ? 'bg-[var(--accent)]'
                      : day < EXAMPLE_DAY
                        ? 'bg-[var(--track-filled)]'
                        : 'bg-[var(--track)]'
                  }`}
                />
              );
            })}
          </div>
          <p className="mx-auto mt-8 max-w-[760px] text-[clamp(1.25rem,2.4vw,1.75rem)] leading-[1.3] tracking-[-0.02em] text-[var(--text-primary)]">
            One USDC pool, 14-day cycles.
          </p>
          <p className="mx-auto mt-4 max-w-[620px] text-[16px] leading-7 text-[var(--text-secondary)]">
            Deposit into the master pool, follow the cycle, and withdraw your share at settlement.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" onClick={handleLaunch}>
              {authenticated ? 'Open dashboard' : 'Connect wallet'}
              <ArrowRight aria-hidden="true" />
            </Button>
            <Link
              href="#statement"
              className="text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
            >
              View cycle statement
            </Link>
          </div>
          <p className="mt-8 text-[12px] text-[var(--text-muted)]">
            Capital is at risk. Returns are not guaranteed.
          </p>
        </div>
      </section>

      <section id="statement" aria-label="Cycle statement" className="border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-10 lg:py-16">
          <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mono text-[12px] text-[var(--text-muted)]">Master pool · USDC</p>
                <h2 className="mt-2 text-[20px] font-medium text-[var(--text-primary)]">Cycle statement</h2>
                <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                  Example cycle · day {EXAMPLE_DAY} of {CYCLE_DAYS}
                </p>
              </div>
              <span className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                Cycle open
              </span>
            </div>

            <div className="mt-8 flex items-baseline justify-between gap-4">
              <p className="text-[13px] text-[var(--text-secondary)]">Illustrative NAV</p>
              <p className="mono text-[12px] tabular-nums text-[var(--text-muted)]">
                NAV {NAV_SERIES[NAV_SERIES.length - 1].toFixed(2)} USDC
              </p>
            </div>

            <div className="mt-4 grid grid-cols-[44px_1fr] gap-3">
              <div className="mono flex h-40 flex-col justify-between py-3 text-right text-[11px] tabular-nums text-[var(--text-muted)] sm:h-44">
                {axisLabels().map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div>
                <div className="relative h-40 border-b border-[var(--border)] sm:h-44">
                  <svg
                    viewBox={`0 0 ${CHART.width} ${CHART.height}`}
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="Illustrative net asset value trend across a 14-day cycle"
                    className="absolute inset-0 h-full w-full"
                  >
                    {[CHART.pad, CHART.height / 3, (CHART.height * 2) / 3, CHART.height - CHART.pad].map((y) => (
                      <line
                        key={y}
                        x1={CHART.pad}
                        x2={CHART.width - CHART.pad}
                        y1={y}
                        y2={y}
                        stroke="var(--chart-grid)"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                    <path d={areaPath()} fill="var(--chart-area)" />
                    <path
                      d={linePath()}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={pointX(NAV_SERIES.length - 1)}
                      cy={pointY(NAV_SERIES[NAV_SERIES.length - 1])}
                      r="4"
                      fill="var(--accent)"
                      stroke="var(--surface)"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
                <div className="mono mt-2 flex justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Day 01</span>
                  <span>Day 07</span>
                  <span>Day 14</span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--border)] pt-5">
              <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1" aria-hidden="true">
                {Array.from({ length: CYCLE_DAYS }, (_, index) => {
                  const day = index + 1;
                  return (
                    <span
                      key={day}
                      className={`h-1.5 rounded-full ${
                        day === EXAMPLE_DAY
                          ? 'bg-[var(--accent)]'
                          : day < EXAMPLE_DAY
                            ? 'bg-[var(--track-filled)]'
                            : 'bg-[var(--track)]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 divide-x divide-[var(--border)] border-t border-[var(--border)] pt-5 text-[12px]">
              <div>
                <p className="text-[var(--text-muted)]">Deposit asset</p>
                <p className="mono mt-1 text-[14px] text-[var(--text-primary)]">USDC</p>
              </div>
              <div className="pl-4">
                <p className="text-[var(--text-muted)]">Cycle length</p>
                <p className="mono mt-1 text-[14px] tabular-nums text-[var(--text-primary)]">14 days</p>
              </div>
              <div className="pl-4">
                <p className="text-[var(--text-muted)]">Execution</p>
                <p className="mt-1 text-[14px] text-[var(--text-primary)]">Master pool</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
