'use client';
import { useMe } from '@/(hooks)/useMe';
import { useApi } from '@/(hooks)/useApi';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Button } from '@/(components)/shadcn/ui/button';
import { Copy, Gift, AlertCircle, ArrowRight, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { paths } from '../../apiDocs';
import { signIn, signOut, useSession } from 'next-auth/react';

type Job =
  paths['/jobs']['get']['responses']['200']['content']['application/json']['responseObject']['jobs'][number];
type ChangeOrder =
  paths['/jobs/changeorders/{jobId}']['get']['responses']['200']['content']['application/json']['responseObject']['changeOrders'][number];

export default function Home() {
  const { data: session } = useSession();
  const { me } = useMe();
  const { api } = useApi();
  const [copied, setCopied] = useState(false);
  const referralCode = me?.user?.referralCode;

  const { data: jobsData } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await api.GET('/jobs', {});
      const jobs = response.data?.responseObject?.jobs || [];
      return jobs as Job[];
    },
  });

  const changeOrdersQueries = useQueries({
    queries:
      jobsData?.map((job) => ({
        queryKey: ['changeOrders', job.jobId],
        queryFn: async () => {
          try {
            const response = await api.GET('/jobs/changeorders/{jobId}', {
              params: {
                path: {
                  jobId: job.jobId,
                },
              },
            });
            const changeOrders = (response.data?.responseObject?.changeOrders || []) as ChangeOrder[];
            return changeOrders.map((co) => ({ ...co, jobTitle: job.title, jobNumber: job.jobNumber }));
          } catch (error: any) {
            if (error?.statusCode === 404) {
              return [];
            }
            throw error;
          }
        },
        enabled: !!jobsData && jobsData.length > 0,
      })) || [],
  });

  const pendingChangeOrders = useMemo(() => {
    const allChangeOrders = changeOrdersQueries
      .flatMap((query) => query.data || [])
      .filter((co: ChangeOrder & { jobTitle: string; jobNumber: string | null }) => !co.customerNotified);
    return allChangeOrders;
  }, [changeOrdersQueries]);

  const isLoadingChangeOrders = changeOrdersQueries.some((query) => query.isLoading);

  const handleCopyReferralCode = async () => {
    if (referralCode) {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {referralCode && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-slate-900">Refer & Earn $100</h3>
                </div>
                <p className="mb-4 text-slate-600">
                  Share your referral code and earn{' '}
                  <span className="font-semibold text-primary">$100 credit</span> for each successful
                  referral!
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 rounded-md border-2 border-primary/30 bg-white px-4 py-2 font-mono
                      text-lg font-semibold text-slate-900"
                  >
                    {referralCode}
                  </div>
                  <Button onClick={handleCopyReferralCode} variant="outline" size="lg" className="shrink-0">
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoadingChangeOrders ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-slate-500">Loading change orders...</div>
          </CardContent>
        </Card>
      ) : pendingChangeOrders.length > 0 ? (
        <Card className="border-2 border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-900">
                Pending Customer Notifications ({pendingChangeOrders.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-yellow-800">
              You have {pendingChangeOrders.length} change order{pendingChangeOrders.length !== 1 ? 's' : ''}{' '}
              that need to be notified to customers.
            </p>
            <div className="space-y-3">
              {pendingChangeOrders
                .slice(0, 5)
                .map((changeOrder: ChangeOrder & { jobTitle: string; jobNumber: string | null }) => {
                  const total = changeOrder.lineItems.reduce((sum, item) => sum + (item.price || 0), 0);
                  return (
                    <div
                      key={changeOrder.changeOrderId}
                      className="flex items-center justify-between rounded-md border border-yellow-200
                        bg-white p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">
                          {changeOrder.jobTitle}
                          {changeOrder.jobNumber && (
                            <span className="ml-2 text-sm text-slate-500">#{changeOrder.jobNumber}</span>
                          )}
                        </div>
                        <div className="text-sm text-slate-600">
                          Change Order #{changeOrder.changeOrderId.slice(-8)} • {formatCurrency(total)}
                        </div>
                      </div>
                      <Link href={`/jobs/${changeOrder.jobId}`}>
                        <Button size="sm" variant="outline">
                          View
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
            </div>
            {pendingChangeOrders.length > 5 && (
              <p className="mt-4 text-sm text-yellow-800">
                +{pendingChangeOrders.length - 5} more change order
                {pendingChangeOrders.length - 5 !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-2 border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-slate-700" />
              <CardTitle>Google Email Integration</CardTitle>
            </div>
            {(me as any)?.user?.googleConnected ? (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <XCircle className="h-4 w-4" />
                Not Connected
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-600">
            Connect your Google account to send emails directly from your account. This allows you to notify
            customers about change orders and other important updates.
          </p>
          <div>
            {!session ? (
              <button onClick={() => signIn('google')}>Sign in with Google</button>
            ) : (
              <div>
                <p>Signed in as {session.user?.email}</p>
                <button onClick={() => signOut()}>Sign out</button>
              </div>
            )}
          </div>
          {/* )} */}
        </CardContent>
      </Card>

      <div>
        Welcome, {me?.user?.firstName} with {me?.company?.companyName}
      </div>
    </div>
  );
}
