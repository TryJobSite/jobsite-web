import { Outfit } from 'next/font/google';
import React from 'react';
import './customs.css';
import './globals.css';
import { Providers } from './providers';
import { Button } from '@/(components)/shadcn/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Job Site',
  description: 'Construction Management Software',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-helvetica text-lg">
      <body
        style={{
          height: '100vh',
          backgroundColor: 'white',
          width: '100vw',
          maxWidth: '1080px',
          margin: '0 auto',
        }}
      >
        {/* <meta name="apple-itunes-app" content="app-id=6501969335" /> */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              Job Site
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
              <a href="/#product" className="transition-colors hover:text-slate-600">
                Product
              </a>
              <a href="/#pricing" className="transition-colors hover:text-slate-600">
                Pricing
              </a>
              <a href="/#about" className="transition-colors hover:text-slate-600">
                About
              </a>
            </nav>
            <div className="hidden items-center gap-3 md:flex">
              <Button variant="ghost" asChild>
                <a href="#pricing">View Pricing</a>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </header>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
