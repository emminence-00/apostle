'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import MobileBar from '@/components/dashboard/MobileBar';
import { Loader2 } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex items-center gap-2.5">
          <Loader2 className="w-4 h-4 text-[var(--text-muted)] animate-spin" />
          <p className="text-[13px] text-[var(--text-muted)]">Loading…</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <DashboardSidebar />
      <div className="min-w-0 flex-1">
        <MobileBar />
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
