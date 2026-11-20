'use client';

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function PrivyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <BasePrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme,
          accentColor: '#256e5b',
          logo: '/logo.svg',
          landingHeader: 'Log in to Apostle',
        },
        loginMethods: ['email', 'wallet'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </BasePrivyProvider>
  );
}
