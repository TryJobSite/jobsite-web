'use client';
import useAppRouter from '@/(hooks)/useAppRouter';
import { useMe } from '@/(hooks)/useMe';
import { redirect } from 'next/navigation';

export default function Home() {
  const { me } = useMe();
  return (
    <div>
      Welcome, {me?.user?.firstName} with {me?.company?.companyName}
    </div>
  );
}
