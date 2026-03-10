'use client';
import { useMe } from '@/(hooks)/useMe';
import { useApi } from '@/(hooks)/useApi';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Button } from '@/(components)/shadcn/ui/button';
import { Copy, Gift, AlertCircle, ArrowRight, Mail, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Job } from '@/jobs/[jobId]/(components)/types';

export default function Home() {
  const { me, refresh } = useMe();
  const { api } = useApi();
  const [copied, setCopied] = useState(false);
  const referralCode = me?.user?.referralCode;

  const { data, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await api.GET('/jobs', {});
      const jobs = response.data?.responseObject?.jobs || [];
      return jobs as Job[];
    },
  });

  const activeJobs = data?.filter((job) => job.status === 'in-progress');

  // Calculate stats
  const stats = useMemo(() => {
    if (!data) return { activeCount: 0, totalValue: 0, completedThisYear: 0 };

    const activeCount = data.filter((job) => job.status === 'in-progress').length;

    const totalValue = data.reduce((sum, job) => {
      const value = (job as any).price ?? 0;
      return sum + (value || 0);
    }, 0);

    const currentYear = new Date().getFullYear();
    const completedThisYear = data.filter((job) => {
      if (job.status !== 'completed') return false;
      if (!job.actualEndDate) return false;
      const endDate = new Date(job.actualEndDate);
      return endDate.getFullYear() === currentYear;
    }).length;

    return { activeCount, totalValue, completedThisYear };
  }, [data]);

  const handleCopyReferralCode = async () => {
    if (referralCode) {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: Job['status']): string => {
    const colors: Record<string, string> = {
      planned: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
      'on-hold': 'bg-slate-100 text-slate-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const formatStatus = (status: string): string => {
    return status
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleJobClick = (job: Job) => {
    window.location.href = `/jobs/${job.jobId}`;
  };

  const handleConnectGoogle = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      'http://localhost:8080/auth/google',
      'google-oauth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    if (!popup) return;
    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval);
        refresh();
      }
    }, 500);
  };

  // const connect = () => {
  //   window.location.href = 'http://localhost:8080/auth/google';
  // };
  return (
    <div className="space-y-6 p-6">
      {/* Stats Card */}
      {!isLoading && data && (
        <Card>
          <CardHeader>
            <CardTitle>Job Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col">
                <div className="text-sm text-slate-500">Active Jobs</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">{stats.activeCount}</div>
              </div>
              <div className="flex flex-col">
                <div className="text-sm text-slate-500">Total Value</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">
                  {formatCurrency(stats.totalValue)}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="text-sm text-slate-500">Completed This Year</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">{stats.completedThisYear}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* {referralCode && (
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
      )} */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-slate-500">Loading jobs...</div>
          </CardContent>
        </Card>
      ) : activeJobs && activeJobs.length > 0 ? (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Current Jobs: ({activeJobs.length})</CardTitle>
              <Link href="/jobs">
                <Button size="sm" variant="outline">
                  View All Jobs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeJobs.map((job: Job) => (
                <Card
                  key={job.jobId}
                  className="flex cursor-pointer flex-col transition-shadow hover:shadow-md"
                  onClick={() => handleJobClick(job)}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        {job.jobNumber && (
                          <CardDescription className="mt-1">Job #{job.jobNumber}</CardDescription>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                          job.status )}`}
                      >
                        {formatStatus(job.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col space-y-3 p-4">
                    {job.description && (
                      <p className="line-clamp-2 text-sm text-slate-600">{job.description}</p>
                    )}

                    <div className="space-y-2 text-sm">
                      {job.price !== null && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Price:</span>
                          <span className="font-medium">{formatCurrency(job.price)}</span>
                        </div>
                      )}

                      {job.estimatedStartDate && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Est. Start:</span>
                          <span>{formatDate(job.estimatedStartDate)}</span>
                        </div>
                      )}

                      {job.estimatedEndDate && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Est. End:</span>
                          <span>{formatDate(job.estimatedEndDate)}</span>
                        </div>
                      )}

                      {job.actualStartDate && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Actual Start:</span>
                          <span>{formatDate(job.actualStartDate)}</span>
                        </div>
                      )}

                      {job.actualEndDate && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Actual End:</span>
                          <span>{formatDate(job.actualEndDate)}</span>
                        </div>
                      )}

                      {(job.addressLine1 || job.city || job.state) && (
                        <div
                          className="mt-4 flex flex-row justify-between gap-2 border-t border-slate-200 pt-4"
                        >
                          <div className="mb-1 text-xs text-slate-500">Address:</div>
                          <div className="align-end text-xs">
                            {job.addressLine1 && <div>{job.addressLine1}</div>}
                            {job.addressLine2 && <div>{job.addressLine2}</div>}
                            {(job.city || job.state || job.postalCode) && (
                              <div>{[job.city, job.state, job.postalCode].filter(Boolean).join(', ')}</div>
                            )}
                            {job.country && <div>{job.country}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-auto ml-auto w-50 border-1 border-[#388AE4]"
                    >
                      View Job Details
                      <ChevronRight className="ml-auto" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-slate-200">
          <CardContent className="p-6">
            <div className="text-slate-500">No active jobs found.</div>
          </CardContent>
        </Card>
      )}
      {/* <Card className="border-2 border-slate-200">
        <CardContent className="p-6">
          <Button onClick={sendTestEmail} variant="outline">
            Send Test Email
          </Button>
        </CardContent>
      </Card> */}

      {!me?.user?.linkedGoogleAccount && (
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
              <Button onClick={handleConnectGoogle}>Connect Google</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
