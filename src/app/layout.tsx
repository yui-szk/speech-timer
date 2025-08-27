import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Speech Timer',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
} 