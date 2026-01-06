import { AuthenticatedLayout } from '@/(components)/layout/authenticated-layout';
import { JobsHeaderAction } from './jobs-header-action';

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticatedLayout title="Jobs" subtitle="Manage and view all your jobs" action={<JobsHeaderAction />}>
      {children}
    </AuthenticatedLayout>
  );
}
