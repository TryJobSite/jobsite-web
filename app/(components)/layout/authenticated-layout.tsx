import { Sidebar } from './sidebar';
import { redirect } from 'next/navigation';
import { useApiServerSide } from '@/(hooks)/useApiServerSide';
import { AuthenticatedContent } from './authenticated-content';

export async function AuthenticatedLayout({
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
  const { api } = useApiServerSide();
  let me: any = null;
  let redirectToLogin = false;
  try {
    const req = await api.GET('/me', {});
    me = req.data?.responseObject;
  } catch (error: any) {
    if (error?.statusCode === 401) redirectToLogin = true;
  }
  if (redirectToLogin) return redirect('/login?force');
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <AuthenticatedContent title={title} subtitle={subtitle} action={action}>
        {children}
      </AuthenticatedContent>
    </div>
  );
}
