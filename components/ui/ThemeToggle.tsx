'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      title="Toggle color theme"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-btn)] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
    >
      <Sun className="theme-icon-sun h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      <Moon className="theme-icon-moon h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
