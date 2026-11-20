import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import PrivyProvider from '@/components/providers/PrivyProvider';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const themeScript = `try{var t=localStorage.getItem('apostle-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){}`;

export const metadata: Metadata = {
  title: 'Apostle — 14-day USDC trading cycles',
  description:
    'Deposit USDC into 14-day trading cycles and follow each position through settlement.',
  keywords: ['crypto', 'trading', 'USDC', 'apostle'],
  openGraph: {
    title: 'Apostle — 14-day USDC trading cycles',
    description: 'Deposit USDC into 14-day trading cycles and follow each position to settlement.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <PrivyProvider>{children}</PrivyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
