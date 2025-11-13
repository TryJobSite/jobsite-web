'use client';

import useAnalytics from '@/utils/analytics';
import TokenRefresher from '@/utils/tokenRefresh';
import { AppProgressProvider } from '@bprogress/next';
import { Box, ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { SessionProvider } from 'next-auth/react';
import { ReCaptchaProvider } from 'next-recaptcha-v3';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import React, { useEffect } from 'react';
import { CookiesProvider } from 'react-cookie';
import { IntercomProvider, useIntercom } from 'react-use-intercom';
// import { paths } from '../apiDocs';
// import { useApi } from './(hooks)/useApi';
// import { useGetMyAccounts } from './(hooks)/useGetMyAccounts';
// import { useIsBusinessCookie } from './(hooks)/useIsBusinessCookie';
// import { useMe } from './(hooks)/useMe';
import theme from './theme/theme';
import { RouteHelper, validAuthedOrUnauthedRegex, validUnauthedRegex } from './utils/routeHelper';
const RECAPTCHA_KEY = '6Ld1ZZ8rAAAAAMiyMLmD0yd-g4X7FjA91b7Hw535';
dayjs.extend(advancedFormat); // extend functionality of dayjs globally

export const queryClient = new QueryClient();
// const OtherProviders = ({ children, clientInfo }: { children: React.ReactNode; clientInfo: ClientType }) => {
//   const { setUserId } = useAnalytics();
//   const pathname = usePathname();
//   const { api } = useApi();
//   const { boot } = useIntercom();
//   const { me } = useMe(clientInfo ? { clientInfo } : undefined);
//   const { setIsBusinessCookie } = useIsBusinessCookie();
//   const { checkingAccountExists, securedCreditAccountExists, savingAccountExists } = useGetMyAccounts();

//   useEffect(() => {
//     if (pathname.startsWith('/business')) {
//       setIsBusinessCookie(true);
//     } else {
//       setIsBusinessCookie(false);
//     }
//   }, [pathname]);

//   // useEffect(() => {
//   //   if (me?.clientId) {
//   //     setUserId(me.clientId);
//   //     if (me?.clientId && me?.email && me?.firstName && process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
//   //       api
//   //         .GET('/me/intercom_hash', {
//   //           params: {
//   //             query: {
//   //               sdkType: 'WEB',
//   //             },
//   //           },
//   //         })
//   //         .then((res) => {
//   //           boot({
//   //             email: me.email,
//   //             userId: me.clientId,
//   //             name: me.firstName,
//   //             userHash: res.data?.responseObject.intercom_hash || '',
//   //             customAttributes: {
//   //               ...me,
//   //               has_checking: checkingAccountExists,
//   //               has_secured_credit: securedCreditAccountExists,
//   //               has_saving: savingAccountExists,
//   //             },
//   //           });
//   //         })
//   //         .catch((err) => {
//   //           console.log(err);
//   //         });
//   //     }
//   //   }
//   // }, [
//   //   me?.clientId,
//   //   me?.email,
//   //   me?.firstName,
//   //   checkingAccountExists,
//   //   securedCreditAccountExists,
//   //   savingAccountExists,
//   // ]);

//   if (
//     ((Object.values(RouteHelper.UnAuthed) as ReadonlyArray<string>).some((x) => pathname.startsWith(x)) ||
//       [...validUnauthedRegex, ...validAuthedOrUnauthedRegex].some((r) => r.test(pathname))) &&
//     !me
//   )
//     return children;
//   if (!me)
//     return (
//       <Box>
//         <Header />
//       </Box>
//     );
//   return children;
// };

const GTAG_ID = 'G-J68R149QPD';
const GTM_ID = 'GTM-WNMP9MDW';

// Add type declaration for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const GoogleAnalytics = () => {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args) {
      window.dataLayer.push(...args);
    };
    window.gtag('js', new Date());
    window.gtag('config', GTAG_ID);
  }, []);

  return (
    <>
      {/* Google Tag Manager (noscript) */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>

      {/* Google Tag Manager */}
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}
      </Script>

      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`} />
    </>
  );
};

export function Providers({ children }: { children: React.ReactNode }) {
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
    // <SessionProvider>
    <ReCaptchaProvider
      reCaptchaKey={RECAPTCHA_KEY}
      useEnterprise
      className={!pathname.startsWith('/signup') ? 'hide-grecaptcha' : 'hide-grecaptcha'}
    >
      <AppProgressProvider color="#DA2F16" height={'6px'}>
        <GoogleAnalytics />
        <CookiesProvider defaultSetOptions={{ path: '/' }}>
          <QueryClientProvider client={queryClient}>
            <ChakraProvider
              theme={theme}
              toastOptions={{ defaultOptions: { position: 'top', isClosable: true } }}
            >
              <IntercomProvider appId={'x6l0svm8'}>
                <TokenRefresher>
                  <Box
                    width="100%"
                    h={{ sm: pathname !== '/plaid-auth' ? '100%' : undefined }}
                    minH={'100vh'}
                    // bg="white"
                  >
                    {children}
                  </Box>
                </TokenRefresher>
              </IntercomProvider>
            </ChakraProvider>
          </QueryClientProvider>
        </CookiesProvider>
      </AppProgressProvider>
    </ReCaptchaProvider>
    // </SessionProvider>
  );
}

export default GoogleAnalytics;
