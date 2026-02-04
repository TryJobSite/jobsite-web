'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/(hooks)/useApi';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/(components)/shadcn/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/(components)/shadcn/ui/breadcrumb';
import { PageHeader } from '@/(components)/layout/page-header';
import { Breadcrumb } from '@/(components)/shadcn/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { BidDetailsUpdateModal } from './(components)/bid-details-update-modal';
import { BidLineItemsCard } from './(components)/bid-line-items-card';
import { SendBidEmailModal } from './(components)/send-bid-email-modal';

type BidStatus = 'in-progress' | 'sent-to-client' | 'bid-won' | 'bid-lost';

type Bid = {
  bidId: string;
  companyId: string;
  customerId: string;
  title: string;
  description: string | null;
  status: BidStatus;
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  price: number | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  lineItems: Array<{
    description: string;
    price?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    contractor?: string | null;
  }>;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  customer?: {
    customerId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

function formatDate(dateString: string | null | undefined): string {
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
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'Not set';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatStatus(status: BidStatus): string {
  return status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getStatusColor(status: BidStatus): string {
  const colors: Record<BidStatus, string> = {
    'in-progress': 'bg-yellow-100 text-yellow-800',
    'sent-to-client': 'bg-blue-100 text-blue-800',
    'bid-won': 'bg-emerald-100 text-emerald-800',
    'bid-lost': 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-slate-100 text-slate-800';
}

function formatDateOnlyForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

function formatBudgetForInput(budget: number | null | undefined): string {
  if (budget === null || budget === undefined) return '';
  return budget.toFixed(2);
}

const bidDetailsUpdateSchema = z.object({
  description: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
  status: z.enum(['in-progress', 'sent-to-client', 'bid-won', 'bid-lost']),
  price: z.string(),
  estimatedStartDate: z.string().optional(),
  estimatedEndDate: z.string().optional(),
  notes: z.string(),
});

type BidDetailsUpdateFormData = z.infer<typeof bidDetailsUpdateSchema>;

export default function BidDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { api } = useApi();
  const queryClient = useQueryClient();
  const bidId = params.bidId as string;

  const [isBidDetailsUpdateOpen, setIsBidDetailsUpdateOpen] = useState(false);
  const [isSendBidEmailModalOpen, setIsSendBidEmailModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bidDetailsUpdateForm = useForm<BidDetailsUpdateFormData>({
    resolver: zodResolver(bidDetailsUpdateSchema),
    defaultValues: {
      description: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      status: 'in-progress',
      price: '',
      estimatedStartDate: '',
      estimatedEndDate: '',
      notes: '',
    },
  });

  const { data: bidsData, isLoading } = useQuery({
    queryKey: ['bids'],
    queryFn: async () => {
      const response = await api.GET('/bids', {});
      const bids = response.data?.responseObject?.bids || [];
      return bids as unknown as Bid[];
    },
  });

  const bid = bidsData?.find((b) => b.bidId === bidId);

  // Populate form when bid data is available
  useEffect(() => {
    if (bid) {
      bidDetailsUpdateForm.reset({
        description: bid.description || '',
        addressLine1: bid.addressLine1 || '',
        addressLine2: bid.addressLine2 || '',
        city: bid.city || '',
        state: bid.state || '',
        postalCode: bid.postalCode || '',
        country: bid.country || '',
        status: bid.status,
        price: formatBudgetForInput(bid.price),
        estimatedStartDate: formatDateOnlyForInput(bid.estimatedStartDate),
        estimatedEndDate: formatDateOnlyForInput(bid.estimatedEndDate),
        notes: bid.notes || '',
      });
    }
  }, [bid, bidDetailsUpdateForm]);

  const onSubmitUpdateBidDetails = async (data: BidDetailsUpdateFormData) => {
    if (!bid) return;
    setIsSubmitting(true);
    try {
      const formatDateToISO = (dateStr: string | undefined) => {
        if (!dateStr || dateStr === '') return null;
        return new Date(dateStr + 'T00:00:00').toISOString();
      };

      await api.PATCH('/bids/{bidId}', {
        params: {
          path: {
            bidId: bid.bidId,
          },
        },
        body: {
          description: data.description || null,
          addressLine1: data.addressLine1 || null,
          addressLine2: data.addressLine2 || null,
          city: data.city || null,
          state: data.state || null,
          postalCode: data.postalCode || null,
          country: data.country || null,
          status: data.status,
          price: data.price ? parseFloat(data.price) : null,
          estimatedStartDate: formatDateToISO(data.estimatedStartDate) as string | null | undefined,
          estimatedEndDate: formatDateToISO(data.estimatedEndDate) as string | null | undefined,
          notes: data.notes || null,
        } as any,
      });
      setIsBidDetailsUpdateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['bids'] });
    } catch (error) {
      console.error('Update bid error:', error);
      alert('Failed to update bid. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsSentToClient = () => {
    setIsSendBidEmailModalOpen(true);
  };

  const handleSendBidToClient = async () => {
    if (!bid) return;
    setIsSubmitting(true);
    try {
      await api.PATCH('/bids/{bidId}', {
        params: {
          path: {
            bidId: bid.bidId,
          },
        },
        body: {
          status: 'sent-to-client',
        } as any,
      });
      setIsSendBidEmailModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['bids'] });
    } catch (error) {
      console.error('Update bid status error:', error);
      alert('Failed to update bid status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsBidWon = async () => {
    if (!bid) return;
    setIsSubmitting(true);
    try {
      const res = await api.POST('/bids/bid-won/{bidId}', {
        params: {
          path: {
            bidId: bid.bidId,
          },
        },
      });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      const jobId = (res?.data?.responseObject?.job as any)?.jobId;
      if (jobId) {
        router.push(`/jobs/${jobId}`);
      }
    } catch (error) {
      console.error('Mark bid as won error:', error);
      alert('Failed to mark bid as won. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsBidLost = async () => {
    if (!bid) return;
    setIsSubmitting(true);
    try {
      await api.PATCH('/bids/{bidId}', {
        params: {
          path: {
            bidId: bid.bidId,
          },
        },
        body: {
          status: 'bid-lost',
        } as any,
      });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
    } catch (error) {
      console.error('Mark bid as lost error:', error);
      alert('Failed to mark bid as lost. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-slate-500">Loading bid...</div>
      </div>
    );
  }

  if (!bid) {
    return (
      <div className="space-y-6">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">Bid not found.</div>
      </div>
    );
  }

  const totalLineItemsPrice = bid.lineItems.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <>
      <PageHeader
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/bids">Bids</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Bid Details</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        subtitle={
          <>
            <span className="text-lg">{bid.title}</span>
            <span className={`ml-2 rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(bid.status)}`}>
              {formatStatus(bid.status)}
            </span>
          </>
        }
        action={
          <div className="flex items-center gap-2">
            {bid.status === 'in-progress' && (
              <Button size="sm" variant="default" onClick={handleMarkAsSentToClient} disabled={isSubmitting}>
                Send Bid to Client
              </Button>
            )}
            {bid.status === 'sent-to-client' && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleMarkAsBidWon}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Mark as Won
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAsBidLost}
                  disabled={isSubmitting}
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  Mark as Lost
                </Button>
              </>
            )}
          </div>
        }
      />
      <div className="space-y-6 p-6">
        <Card className="min-w-[400px] flex-1">
          <CardHeader>
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <div className="flex-1">
                <div className="text-sm text-slate-500">Customer</div>
                <div className="flex-1 text-lg font-medium">
                  {bid.customer ? `${bid.customer.firstName} ${bid.customer.lastName}` : 'No customer'}
                </div>
              </div>
              <div className="flex-2">
                <div className="text-sm text-slate-500">Address</div>
                <div>
                  {[bid.addressLine1, bid.addressLine2, bid.city, bid.state, bid.postalCode, bid.country]
                    .filter(Boolean)
                    .join(' ')}
                </div>
              </div>
              <div className="flex flex-1 items-center justify-end">
                {bid.status !== 'bid-won' && bid.status !== 'bid-lost' && (
                  <Button size="sm" variant="default" onClick={() => setIsBidDetailsUpdateOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Update Bid Details
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex flex-1 gap-2">
                <div className="flex-1">
                  <div className="mb-4 border-l border-slate-200 pl-2">
                    <div className="text-sm text-slate-500">Price</div>
                    <div>{formatCurrency(bid.price)}</div>
                  </div>
                  <div className="border-l border-slate-200 pl-2">
                    <div className="text-sm text-slate-500">Est. Start Date</div>
                    <div>{formatDate(bid.estimatedStartDate)}</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-4 border-l border-slate-200 pl-2">
                    <div className="text-sm text-slate-500">Est. End Date</div>
                    <div>{formatDate(bid.estimatedEndDate)}</div>
                  </div>
                  {bid.notes && (
                    <div className="border-l border-slate-200 pl-2">
                      <div className="text-sm text-slate-500">Notes</div>
                      <div>{bid.notes}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-4 h-full border-l border-slate-200 pl-2">
                  <div className="text-sm text-slate-500">Description</div>
                  <div>{bid.description || 'No description'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items Card */}
        <BidLineItemsCard bidId={bidId} bid={bid} />

        <BidDetailsUpdateModal
          open={isBidDetailsUpdateOpen}
          onOpenChange={setIsBidDetailsUpdateOpen}
          isSubmitting={isSubmitting}
          bidDetailsForm={bidDetailsUpdateForm}
          onSubmit={onSubmitUpdateBidDetails}
        />

        <SendBidEmailModal
          open={isSendBidEmailModalOpen}
          onOpenChange={setIsSendBidEmailModalOpen}
          bid={bid}
          onSend={handleSendBidToClient}
          isSubmitting={isSubmitting}
        />
      </div>
    </>
  );
}
