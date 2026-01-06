import { AuthenticatedLayout } from '@/(components)/layout/authenticated-layout';
import { CustomersHeaderAction } from './customers-header-action';

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticatedLayout
      title="Customers"
      subtitle="Manage and view all your customers"
      action={<CustomersHeaderAction />}
    >
      {children}
    </AuthenticatedLayout>
  );
}
