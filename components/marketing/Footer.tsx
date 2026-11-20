'use client';

import Link from 'next/link';
import Logo from '@/components/ui/Logo';

const LINKS = [
  { href: '#cycles', label: 'Cycles' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#partners', label: 'Partners' },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-10 text-[13px] text-[var(--text-secondary)] md:flex-row md:items-center md:justify-between lg:px-10">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Apostle home">
            <Logo markClassName="h-5 w-5" className="gap-1.5" />
          </Link>
          <span className="text-[12px] text-[var(--text-muted)]">© {new Date().getFullYear()}</span>
        </div>

        <nav className="flex flex-wrap items-center gap-6">
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

        <span className="text-[12px] text-[var(--text-muted)]">14-day trading cycles</span>
      </div>
    </footer>
  );
}
