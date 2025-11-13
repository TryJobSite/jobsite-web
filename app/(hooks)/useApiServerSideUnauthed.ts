import { createClient, Middleware } from '@/utils/createApiClient';
import { OmitRecursively } from '@/utils/types';
import { cookies, headers } from 'next/headers';
import { paths } from '../../apiDocs';
import { EnvStore } from '../../typedEnvs';

export const useApiServerSideUnauthed = () => {
  //eslint-disable-next-line  @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const api = createClient<OmitRecursively<paths, 'header' | 'cookie'>>({
    baseUrl: EnvStore.ClientEnvs.NEXT_PUBLIC_API,
    credentials: 'include',

    fetch,
  });
  const myMiddleware: Middleware = {
    async onRequest(req: Request) {
      const sessionCookie = (await cookies()).get('session')?.value;
      if (sessionCookie) {
        req.headers.set('Authorization', `Bearer ${sessionCookie}`);
      }
      const nextHeaders = await headers();
      const cookie = await cookies();
      req.headers.set('Cookie', cookie.toString());
      const forwardedFor = nextHeaders.get('x-forwarded-for');
      const xForwardedFor = forwardedFor ? forwardedFor?.split?.(',')?.[0]?.trim?.() : null;
      const xRealIp = nextHeaders.get('x-real-ip');
      if (xForwardedFor || xRealIp) req.headers.set('x-next-ssr-client-ip', xForwardedFor || xRealIp!);

      // if u change this, make sure to also change on parseIp in api, and also in AWS ACL rate limit
      // scope down statement so we dont rate limit our vercel SSR/ server actions
      req.headers.set('x-trusted-secret-client-ip', 'mySuperSecretRandomString');
      return req;
    },
    async onResponse(res: Response) {
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          const json = await res.clone().json();
          console.log('Error:', res.status, json);
          throw json;
        } else {
          const txt = await res.clone().text();
          console.log('Error:', res.status, txt);
          throw new Error(`Error ${res.status}. We're sorry, something went wrong. Please try again later.`);
        }
      }
      return res;
    },
  };
  api.use(myMiddleware);
  return { api };
};
