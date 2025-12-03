'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/(hooks)/useApi';
import { useMe } from '@/(hooks)/useMe';
import { useToast } from '@chakra-ui/react';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function TokenRefresher({ children }: { children: React.ReactNode }) {
  const { api } = useApi();
  const router = useRouter();
  const hasPushed = useRef(false);
  const { me } = useMe();
  const toast = useToast({
    position: 'bottom',
    duration: 5000,
    isClosable: true,
  });

  async function refreshToken() {
    if (me) {
      try {
        await api.POST('/login-user/refresh', {});
        hasPushed.current = false;
      } catch (error) {
        if (hasPushed?.current) return;
        if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
          // currently gets undefined 'me' in root/layout component and breaks app if cookie doesn't exist.
          // alt solution -> in Provider useEffect on clientInfo // if (prev && !clientInfo) window.location.reload();
          hasPushed.current = true;
          router.push('/login');
          toast({
            title: 'Session expired. Please log in again.',
            status: 'error',
            duration: 10000,
            isClosable: true,
          });
        }
        console.log('error refreshing token', error);
      }
    }
    return {};
  }

  const resp = useQuery({
    queryKey: ['tokenRefresh'],
    queryFn: refreshToken,
    retry: 1,
    retryDelay: 30 * 1000,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: false,
  });

  return children;
}
