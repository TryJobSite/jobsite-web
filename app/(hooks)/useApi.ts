import { Middleware, createClient } from '@/utils/createApiClient';
import { OmitRecursively } from '@/utils/types';
import { paths } from '../../apiDocs';
import { EnvStore } from '../../typedEnvs';
const noReload = ['/login', '/plaid-auth'];
//eslint-disable-next-line  @typescript-eslint/ban-ts-comment
//@ts-ignore
const api = createClient<OmitRecursively<paths, 'header' | 'cookie'>>({
  baseUrl: EnvStore.ClientEnvs.NEXT_PUBLIC_API,
  credentials: 'include',
  fetch,
});

const myMiddleware: Middleware = {
  async onResponse(res: Response) {
    if (res.status === 401) {
      await fetch('/api/logout', {
        method: 'POST',
      });
      // Reload page on 401's except for 401 response on failed login
      if (!noReload.some((x) => window.location.pathname.startsWith(x))) {
        window.location.href = '/login';
      }
    }
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
export const useApi = () => ({ api });
