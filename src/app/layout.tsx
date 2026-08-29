// ─────────────────────────────────────────────
//  REVIA — Root Layout
//  RTL, Arabic, Cinematic dark theme, Google Fonts
// ─────────────────────────────────────────────
import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '900'],
});

export const metadata: Metadata = {
  title: 'REVIA',
  description: 'تتبع وتقييم الأفلام، المسلسلات، والأنمي',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'REVIA',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body
        className="font-cairo antialiased min-h-dvh"
        style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
      >
        {children}
      </body>
    </html>
  );
}

