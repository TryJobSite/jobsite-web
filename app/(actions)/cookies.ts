'use server';
import dayjs from 'dayjs';
import { cookies } from 'next/headers';

export const clearCookie = async (cookieName: string) => {
  'use server';
  (await cookies()).set(cookieName, '', {
    expires: dayjs().subtract(10, 'year').toDate(),
    domain: '.tryjobsite.com',
    path: '/',
  });
  (await cookies()).delete(cookieName);
};

export const setCookie = async (cookieName: string, value: string) => {
  'use server';
  (await cookies()).set(cookieName, value);
};
export const getCookies = async (cookieName: string) => {
  'use server';
  return (await cookies()).get(cookieName);
};
