import { AuthenticatedLayout } from '@/(components)/layout/authenticated-layout';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
