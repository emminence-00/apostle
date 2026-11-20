'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { cn, truncateAddress } from '@/lib/utils';
import { LayoutDashboard, History, Users, LogOut } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: History },
  { href: '/referrals', label: 'Partners', icon: Users },
];

function navLinkClass(active: boolean) {
  return cn(
    'flex h-9 items-center gap-3 rounded-[var(--radius-btn)] px-3 text-[14px] transition-colors duration-150',
    active
      ? 'bg-[var(--surface-hover)] font-medium text-[var(--text-primary)]'
      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
  );
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = usePrivy();

  const walletAddress =
    user?.wallet?.address ??
    user?.linkedAccounts?.find((a) => a.type === 'wallet')?.address ??
    '';

  return (
    <aside className="sticky top-0 z-30 hidden h-screen w-60 shrink-0 flex-col justify-between border-r border-[var(--border)] bg-[var(--bg)] md:flex">
      <div>
        <div className="flex h-16 items-center border-b border-[var(--border)] px-4">
          <Link href="/" aria-label="Apostle home">
            <Logo markClassName="h-5 w-5" className="gap-1.5" />
          </Link>
        </div>

        <nav className="mt-4 space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={navLinkClass(active)}>
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-[var(--border)] p-3">
        {walletAddress && (
          <div className="px-3 pb-3">
            <p className="text-[12px] text-[var(--text-muted)]">Connected</p>
            <p className="mono mt-1 truncate text-[12px] text-[var(--text-secondary)]">
              {truncateAddress(walletAddress, 8, 6)}
            </p>
          </div>
        )}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            className="flex h-9 flex-1 items-center gap-2 rounded-[var(--radius-btn)] px-3 text-[14px] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
