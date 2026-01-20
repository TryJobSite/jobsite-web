import React from 'react';
import './customs.css';
import './globals.css';
import { Providers } from './providers';

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
          maxWidth: '1440px',
          margin: '0 auto',
        }}
      >
        {/* <meta name="apple-itunes-app" content="app-id=6501969335" /> */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
