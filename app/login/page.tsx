import React from 'react';
import LoginPageClient from './page.client';
import { PageProps } from '@/utils/pageProps';
import { useApiServerSide } from '@/(hooks)/useApiServerSide';
import { redirect } from 'next/navigation';

export default async function SignupServer(props: PageProps<[], ['referralCode', 'deep_link_value']>) {
  let hasAcc = false;
  const { api } = useApiServerSide();
  try {
    const me = await api.GET('/me', {});
    console.log({ me });
    hasAcc = !!me.data?.responseObject.user.userId;
  } catch (error) {
    console.log(error);
  }
  if (hasAcc) return redirect('/home');
  return <LoginPageClient />;
}
