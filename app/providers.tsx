'use client';

import useAnalytics from '@/utils/analytics';
import TokenRefresher from '@/utils/tokenRefresh';
import { AppProgressProvider } from '@bprogress/next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { CookiesProvider } from 'react-cookie';
import { IntercomProvider } from 'react-use-intercom';
import theme from './theme/theme';
import { RouteHelper } from './utils/routeHelper';
import { SessionProvider } from 'next-auth/react';
dayjs.extend(advancedFormat); // extend functionality of dayjs globally

export const queryClient = new QueryClient();

export function Providers({ children, session }: { children: React.ReactNode; session: any }) {
  const pathname = usePathname();
  const { init } = useAnalytics();
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .grecaptcha-badge {
        visibility: ${
          pathname.startsWith('/signup') || pathname.startsWith('/login')
            ? 'visible !important'
            : 'hidden !important'
        };
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [pathname]);
  useEffect(() => {
    if (pathname === RouteHelper.UnAuthed.Login) {
      queryClient.clear();
    }
  }, [pathname]);

  useEffect(() => {
    init();
  }, []);

  return (
    <SessionProvider session={session}>
      {/* // <ReCaptchaProvider
    //   reCaptchaKey={RECAPTCHA_KEY}
    //   useEnterprise
    //   className={!pathname.startsWith('/signup') ? 'hide-grecaptcha' : 'hide-grecaptcha'}
    // > */}
      <AppProgressProvider color="#DA2F16" height={'6px'}>
        <CookiesProvider defaultSetOptions={{ path: '/' }}>
          <QueryClientProvider client={queryClient}>
            <IntercomProvider appId={'x6l0svm8'}>
              <TokenRefresher>{children}</TokenRefresher>
            </IntercomProvider>
          </QueryClientProvider>
        </CookiesProvider>
      </AppProgressProvider>
      {/* // </ReCaptchaProvider> */}
    </SessionProvider>
  );
}
