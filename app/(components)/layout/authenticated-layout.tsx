import { Sidebar } from './sidebar';
import { redirect } from 'next/navigation';
import { useApiServerSide } from '@/(hooks)/useApiServerSide';

export async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
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
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* <PageHeader title={title} subtitle={subtitle} action={action} /> */}
        <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
