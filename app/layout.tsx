import './globals.css';
import type { Metadata, Viewport } from 'next';
import { PwaRegister } from '@/components/PwaRegister';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'App Generator — Build apps from a prompt',
  description: 'A metadata-driven application runtime. Describe an app, get a working app.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
