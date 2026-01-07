import { AuthenticatedLayout } from '@/(components)/layout/authenticated-layout';

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
