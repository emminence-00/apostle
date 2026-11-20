'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';

const LINKS = [
  { href: '#cycles', label: 'Cycles' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#partners', label: 'Partners' },
];

export default function Navbar() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-6 lg:px-10">
        <Link href="/" aria-label="Apostle home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 text-[14px] text-[var(--text-secondary)] md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors duration-150 hover:text-[var(--text-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {ready && authenticated ? (
            <Button size="sm" onClick={() => router.push('/dashboard')}>
              <LayoutDashboard aria-hidden="true" />
              Dashboard
            </Button>
          ) : (
            <>
              <button
                type="button"
                onClick={login}
                className="hidden px-2 text-[14px] text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)] sm:inline"
              >
                Log in
              </button>
              <Button size="sm" onClick={login}>
                Connect wallet
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-btn)] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] md:hidden"
          >
            {menuOpen ? <X size={16} strokeWidth={1.5} /> : <Menu size={16} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="absolute inset-x-0 top-full border-b border-[var(--border)] bg-[var(--bg)] px-6 py-3 md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-[var(--radius-btn)] px-2 py-3 text-[14px] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
