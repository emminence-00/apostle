'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { LayoutDashboard, History, Users, LogOut } from 'lucide-react';
import Logo, { LogoMark } from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: History },
  { href: '/referrals', label: 'Partners', icon: Users },
];

export default function MobileBar() {
  const pathname = usePathname();
  const { logout } = usePrivy();

  return (
    <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)] md:hidden">
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <Link href="/" aria-label="Apostle home" className="shrink-0">
          <LogoMark className="h-5 w-5 text-[var(--accent)] sm:hidden" />
          <Logo markClassName="h-5 w-5" className="hidden gap-1.5 sm:inline-flex" />
        </Link>

        <nav className="flex shrink-0 items-center gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-[var(--radius-btn)] transition-colors duration-150',
                  active
                    ? 'bg-[var(--surface-hover)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)]'
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </Link>
            );
          })}
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-btn)] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-hover)]"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  );
}
