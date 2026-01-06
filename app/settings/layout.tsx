import { AuthenticatedLayout } from '@/(components)/layout/authenticated-layout';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticatedLayout title="Settings" subtitle="Manage your account settings">
      {children}
    </AuthenticatedLayout>
  );
}
