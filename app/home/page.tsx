'use client';
import { useMe } from '@/(hooks)/useMe';

export default function Home() {
  const { me } = useMe();
  console.log({ me });
  return <div>Home</div>;
}
