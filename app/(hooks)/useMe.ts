import { RouteHelper, validAuthedOrUnauthedRegex, validUnauthedRegex } from '@/utils/routeHelper';
import { UserData } from '@/utils/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { paths } from '../../apiDocs';
import { useApi } from './useApi';

type ClientType = paths['/me']['get']['responses']['200']['content']['application/json']['responseObject'];
/**
 * Returns the current client user. If the user is not logged in, it will return undefined.
 */
export const useMe = (props?: { clientInfo: ClientType }) => {
  const pathname = usePathname();
  const { api } = useApi();
  const router = useRouter();
  const refresh = () => {
    router.refresh();
  };
  const dontQuery =
    (Object.values(RouteHelper.UnAuthed) as ReadonlyArray<string | (() => string)>).some(
      (x) => typeof x === 'string' && pathname.startsWith(x)
    ) ||
    [...validUnauthedRegex, ...validAuthedOrUnauthedRegex].some((r) => r.test(pathname)) ||
    pathname === '/';

  const { data: me, refetch } = useQuery({
    queryKey: ['meQuery'],
    enabled: !dontQuery,
    initialData: props?.clientInfo,
    placeholderData: (p) => p,
    staleTime: 300000,
    queryFn: async () => {
      const me = await api.GET('/me', {});
      return me?.data?.responseObject ?? undefined;
    },
  });
  const queryClient = useQueryClient();

  return {
    // Assert that the client is not undefined as middleware will redirect to /login if it is
    // eslint-disable-next-line
    me: me ?? props?.clientInfo ?? me!,
    setClient: (updatedClientData: Partial<UserData> & { attribution?: string }) =>
      queryClient.setQueryData<ClientType>(
        ['meQuery'],
        (prev) =>
          ({
            ...prev,
            ...updatedClientData!,
          }) as ClientType
      ),
    logout: async () => {
      const res = await api.POST('/logout', {});
      if (res.data?.success) {
        queryClient.clear();
        queryClient.removeQueries({
          queryKey: ['meQuery'],
        });
        router.refresh();
        router.push('/login');
      } else {
        alert('Logout failed. Please try again.');
      }
    },
    /**
     * Refresh using router.refresh()
     */
    refresh,
    /**
     * Refresh using classic client side request and setting the user
     */
    clientRefresh: refetch,
  };
};
