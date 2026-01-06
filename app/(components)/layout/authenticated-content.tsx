import { PageHeader } from './page-header';

export function AuthenticatedContent({
  children,
  title,
  subtitle,
  action,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <PageHeader title={title} subtitle={subtitle} action={action} />
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6">{children}</main>
    </div>
  );
}
