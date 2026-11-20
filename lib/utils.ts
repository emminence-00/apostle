import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CYCLE_DURATION_DAYS = 14;
export const WITHDRAWAL_LOCK_DAYS = 14;

export const PLATFORM_FEE_RATE = 0.02;    // 2% deposit fee
export const REFERRAL_BONUS_RATE = 0.10;  // 10% of deposit fee

export function formatCurrency(val: number): string {
  return val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncateAddress(addr: string, start = 6, end = 4): string {
  if (!addr) return '';
  if (addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

export function isWithdrawalUnlocked(depositDateIso: string): boolean {
  const depTime = new Date(depositDateIso).getTime();
  const lockPeriodMs = CYCLE_DURATION_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() >= depTime + lockPeriodMs;
}

export function getDaysUntilUnlock(depositDateIso: string): number {
  const depTime = new Date(depositDateIso).getTime();
  const lockPeriodMs = CYCLE_DURATION_DAYS * 24 * 60 * 60 * 1000;
  const unlockTime = depTime + lockPeriodMs;
  const diffMs = unlockTime - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getCycleMaturityDate(depositDateIso: string): string {
  const depTime = new Date(depositDateIso).getTime();
  const maturityMs = depTime + CYCLE_DURATION_DAYS * 24 * 60 * 60 * 1000;
  return formatDate(new Date(maturityMs).toISOString());
}

const EXPLORERS: Record<number, string> = {
  1: 'https://etherscan.io',
  137: 'https://polygonscan.com',
  8453: 'https://basescan.org',
  42161: 'https://arbiscan.io',
  10: 'https://optimistic.etherscan.io',
  11155111: 'https://sepolia.etherscan.io',
};

export function getExplorerUrl(chainId: number | null | undefined, txHash: string): string {
  const base = EXPLORERS[chainId ?? 0] ?? 'https://polygonscan.com';
  return `${base}/tx/${txHash}`;
}

export function getCycleProgressPercent(depositDateIso: string): number {
  const depTime = new Date(depositDateIso).getTime();
  const totalDurationMs = CYCLE_DURATION_DAYS * 24 * 60 * 60 * 1000;
  const elapsedMs = Date.now() - depTime;
  if (elapsedMs <= 0) return 0;
  if (elapsedMs >= totalDurationMs) return 100;
  return Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));
}
