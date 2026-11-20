import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn('h-6 w-6', className)}
    >
      <path
        d="M5 27 16 5 27 27"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path d="M10.5 19h11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      <path d="M3 27h5M24 27h5M14 5h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" />
    </svg>
  );
}

export default function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <LogoMark className={cn('text-[var(--accent)]', markClassName)} />
      <span
        data-word="postle"
        className="nav-wordmark text-[18px] font-normal leading-none tracking-[-0.01em] text-[var(--text-primary)]"
      >
        postle
      </span>
    </span>
  );
}
