'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/(hooks)/useApi';
import { Button } from '@/(components)/shadcn/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/(components)/shadcn/ui/dialog';
import { Input } from '@/(components)/shadcn/ui/input';
import { Label } from '@/(components)/shadcn/ui/label';
import { ChevronRight, Plus } from 'lucide-react';
import { PageHeader } from '@/(components)/layout/page-header';

type BidStatus = 'in-progress' | 'sent-to-client' | 'bid-won' | 'bid-lost';

const bidStatuses: BidStatus[] = ['in-progress', 'sent-to-client', 'bid-won', 'bid-lost'];

const bidSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['in-progress', 'sent-to-client', 'bid-won', 'bid-lost']),
  estimatedStartDate: z.string().optional(),
  estimatedEndDate: z.string().optional(),
  price: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

type BidFormData = z.infer<typeof bidSchema>;

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

function getStatusColor(status: BidStatus): string {
  const colors = {
    'in-progress': 'bg-yellow-100 text-yellow-800',
    'sent-to-client': 'bg-blue-100 text-blue-800',
    'bid-won': 'bg-emerald-100 text-emerald-800',
    'bid-lost': 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-slate-100 text-slate-800';
}

function formatStatus(status: BidStatus): string {
  return status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function parsePriceFromInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
}

function BidsPageInner() {
  const { api } = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('openCreate') === 'true') {
      setIsCreateDialogOpen(true);
      window.history.replaceState(null, '', '/bids');
    }
  }, [searchParams]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createForm = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      status: 'in-progress' as const,
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['bids'],
    queryFn: async () => {
      const response = await api.GET('/bids', {});
      const bids = response.data?.responseObject?.bids || [];
      return bids as unknown as Bid[];
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.GET('/customers', {});
      const customers = response.data?.responseObject?.customers || [];
      return customers as unknown as Array<{
        customerId: string;
        firstName: string;
        lastName: string;
        email: string;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        state: string;
        postalCode: string;
        country?: string | null;
      }>;
    },
  });

  const bids = data || [];
  const customers = customersData || [];

  // Watch customerId to auto-populate address fields
  const selectedCustomerId = createForm.watch('customerId');

  useEffect(() => {
    if (selectedCustomerId && customers.length > 0) {
      const selectedCustomer = customers.find((c) => c.customerId === selectedCustomerId);
      if (selectedCustomer) {
        createForm.setValue('addressLine1', selectedCustomer.addressLine1 || '');
        createForm.setValue('addressLine2', selectedCustomer.addressLine2 || '');
        createForm.setValue('city', selectedCustomer.city || '');
        createForm.setValue('state', selectedCustomer.state || '');
        createForm.setValue('postalCode', selectedCustomer.postalCode || '');
        createForm.setValue('country', selectedCustomer.country || '');
      }
    }
  }, [selectedCustomerId, customers, createForm]);

  const handleBidClick = (bid: Bid) => {
    router.push(`/bids/${bid.bidId}`);
  };

  const onSubmitCreateBid = async (data: BidFormData) => {
    setIsSubmitting(true);
    try {
      const formatDateToISO = (dateStr: string | undefined) => {
        if (!dateStr) return undefined;
        return new Date(dateStr + 'T00:00:00').toISOString();
      };

      const response = await api.PUT('/bids', {
        body: {
          customerId: data.customerId,
          title: data.title,
          description: data.description || undefined,
          status: data.status,
          estimatedStartDate: formatDateToISO(data.estimatedStartDate),
          estimatedEndDate: formatDateToISO(data.estimatedEndDate),
          price: data.price ? parseFloat(data.price) : undefined,
          addressLine1: data.addressLine1 || undefined,
          addressLine2: data.addressLine2 || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          postalCode: data.postalCode || undefined,
          country: data.country || undefined,
        },
      });
      console.log('Create bid response:', response);
      const bidId = (response.data?.responseObject?.bid as any)?.bidId;
      setIsCreateDialogOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      if (bidId) {
        router.push(`/bids/${bidId}`);
      }
    } catch (error) {
      console.error('Create bid error:', error);
      alert('Failed to create bid. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group bids by status
  const groupedBids = {
    'in-progress': bids.filter((bid) => bid.status === 'in-progress'),
    'sent-to-client': bids.filter((bid) => bid.status === 'sent-to-client'),
    'bid-won': bids.filter((bid) => bid.status === 'bid-won'),
    'bid-lost': bids.filter((bid) => bid.status === 'bid-lost'),
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bids</h1>
          <p className="text-slate-600">Manage and view all your bids</p>
        </div>
        <div className="text-slate-500">Loading bids...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bids</h1>
          <p className="text-slate-600">Manage and view all your bids</p>
        </div>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          Failed to load bids. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Bids"
        subtitle="Manage and view all your bids"
        action={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Bid
          </Button>
        }
      />
      <div className="space-y-6 p-6">
        {bids.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">No bids found. Create your first bid to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* In Progress */}
            {groupedBids['in-progress'].length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold">In Progress</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {groupedBids['in-progress'].map((bid) => (
                    <Card
                      key={bid.bidId}
                      className="flex cursor-pointer flex-col transition-shadow hover:shadow-md"
                      onClick={() => handleBidClick(bid)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{bid.title}</CardTitle>
                            {bid.customer && (
                              <CardDescription className="mt-1">
                                {bid.customer.firstName} {bid.customer.lastName}
                              </CardDescription>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                              bid.status )}`}
                          >
                            {formatStatus(bid.status)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col space-y-3 p-4">
                        {bid.description && (
                          <p className="line-clamp-2 text-sm text-slate-600">{bid.description}</p>
                        )}

                        <div className="space-y-2 text-sm">
                          {bid.price !== null && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Price:</span>
                              <span className="font-medium">{formatCurrency(bid.price)}</span>
                            </div>
                          )}

                          {bid.estimatedStartDate && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Est. Start:</span>
                              <span>{formatDate(bid.estimatedStartDate)}</span>
                            </div>
                          )}

                          {bid.estimatedEndDate && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Est. End:</span>
                              <span>{formatDate(bid.estimatedEndDate)}</span>
                            </div>
                          )}

                          {(bid.addressLine1 || bid.city || bid.state) && (
                            <div
                              className="mt-4 flex flex-row justify-between gap-2 border-t border-slate-200
                                pt-4"
                            >
                              <div className="mb-1 text-xs text-slate-500">Address:</div>
                              <div className="align-end text-xs">
                                {bid.addressLine1 && <div>{bid.addressLine1}</div>}
                                {bid.addressLine2 && <div>{bid.addressLine2}</div>}
                                {(bid.city || bid.state || bid.postalCode) && (
                                  <div>
                                    {[bid.city, bid.state, bid.postalCode].filter(Boolean).join(', ')}
                                  </div>
                                )}
                                {bid.country && <div>{bid.country}</div>}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-auto ml-auto w-50 border-1 border-[#388AE4]"
                        >
                          View Bid Details
                          <ChevronRight className="ml-auto" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Sent to Client */}
            {groupedBids['sent-to-client'].length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold">Sent to Client</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {groupedBids['sent-to-client'].map((bid) => (
                    <Card
                      key={bid.bidId}
                      className="flex cursor-pointer flex-col transition-shadow hover:shadow-md"
                      onClick={() => handleBidClick(bid)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{bid.title}</CardTitle>
                            {bid.customer && (
                              <CardDescription className="mt-1">
                                {bid.customer.firstName} {bid.customer.lastName}
                              </CardDescription>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                              bid.status )}`}
                          >
                            {formatStatus(bid.status)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col space-y-3 p-4">
                        {bid.description && (
                          <p className="line-clamp-2 text-sm text-slate-600">{bid.description}</p>
                        )}

                        <div className="space-y-2 text-sm">
                          {bid.price !== null && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Price:</span>
                              <span className="font-medium">{formatCurrency(bid.price)}</span>
                            </div>
                          )}

                          {bid.estimatedStartDate && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Est. Start:</span>
                              <span>{formatDate(bid.estimatedStartDate)}</span>
                            </div>
                          )}

                          {bid.estimatedEndDate && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Est. End:</span>
                              <span>{formatDate(bid.estimatedEndDate)}</span>
                            </div>
                          )}

                          {(bid.addressLine1 || bid.city || bid.state) && (
                            <div
                              className="mt-4 flex flex-row justify-between gap-2 border-t border-slate-200
                                pt-4"
                            >
                              <div className="mb-1 text-xs text-slate-500">Address:</div>
                              <div className="align-end text-xs">
                                {bid.addressLine1 && <div>{bid.addressLine1}</div>}
                                {bid.addressLine2 && <div>{bid.addressLine2}</div>}
                                {(bid.city || bid.state || bid.postalCode) && (
                                  <div>
                                    {[bid.city, bid.state, bid.postalCode].filter(Boolean).join(', ')}
                                  </div>
                                )}
                                {bid.country && <div>{bid.country}</div>}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-auto ml-auto w-50 border-1 border-[#388AE4]"
                        >
                          View Bid Details
                          <ChevronRight className="ml-auto" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Bid Won */}
            {groupedBids['bid-won'].length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold">Bid Won</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {groupedBids['bid-won'].map((bid) => (
                    <Card
                      key={bid.bidId}
                      className="flex cursor-pointer flex-col transition-shadow hover:shadow-md"
                      onClick={() => handleBidClick(bid)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{bid.title}</CardTitle>
                            {bid.customer && (
                              <CardDescription className="mt-1">
                                {bid.customer.firstName} {bid.customer.lastName}
                              </CardDescription>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                              bid.status )}`}
                          >
                            {formatStatus(bid.status)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col space-y-3 p-4">
                        {bid.description && (
                          <p className="line-clamp-2 text-sm text-slate-600">{bid.description}</p>
                        )}

                        <div className="space-y-2 text-sm">
                          {bid.price !== null && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Price:</span>
                              <span className="font-medium">{formatCurrency(bid.price)}</span>
                            </div>
                          )}

                          {bid.estimatedStartDate && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Est. Start:</span>
                              <span>{formatDate(bid.estimatedStartDate)}</span>
                            </div>
                          )}

                          {bid.estimatedEndDate && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Est. End:</span>
                              <span>{formatDate(bid.estimatedEndDate)}</span>
                            </div>
                          )}

                          {(bid.addressLine1 || bid.city || bid.state) && (
                            <div
                              className="mt-4 flex flex-row justify-between gap-2 border-t border-slate-200
                                pt-4"
                            >
                              <div className="mb-1 text-xs text-slate-500">Address:</div>
                              <div className="align-end text-xs">
                                {bid.addressLine1 && <div>{bid.addressLine1}</div>}
                                {bid.addressLine2 && <div>{bid.addressLine2}</div>}
                                {(bid.city || bid.state || bid.postalCode) && (
                                  <div>
                                    {[bid.city, bid.state, bid.postalCode].filter(Boolean).join(', ')}
                                  </div>
                                )}
                                {bid.country && <div>{bid.country}</div>}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-auto ml-auto w-50 border-1 border-[#388AE4]"
                        >
                          View Bid Details
                          <ChevronRight className="ml-auto" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Bid Lost */}
            {groupedBids['bid-lost'].length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold">Bid Lost</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {groupedBids['bid-lost'].map((bid) => (
                    <Card
                      key={bid.bidId}
                      className="flex cursor-pointer flex-col transition-shadow hover:shadow-md"
                      onClick={() => handleBidClick(bid)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{bid.title}</CardTitle>
                            {bid.customer && (
                              <CardDescription className="mt-1">
                                {bid.customer.firstName} {bid.customer.lastName}
                              </CardDescription>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                              bid.status )}`}
                          >
                            {formatStatus(bid.status)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col space-y-3 p-4">
                        {bid.description && (
                          <p className="line-clamp-2 text-sm text-slate-600">{bid.description}</p>
                        )}

                        <div className="space-y-2 text-sm">
                          {bid.price !== null && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Price:</span>
                              <span className="font-medium">{formatCurrency(bid.price)}</span>
                            </div>
                          )}

                          {bid.estimatedStartDate && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Est. Start:</span>
                              <span>{formatDate(bid.estimatedStartDate)}</span>
                            </div>
                          )}

                          {bid.estimatedEndDate && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Est. End:</span>
                              <span>{formatDate(bid.estimatedEndDate)}</span>
                            </div>
                          )}

                          {(bid.addressLine1 || bid.city || bid.state) && (
                            <div
                              className="mt-4 flex flex-row justify-between gap-2 border-t border-slate-200
                                pt-4"
                            >
                              <div className="mb-1 text-xs text-slate-500">Address:</div>
                              <div className="align-end text-xs">
                                {bid.addressLine1 && <div>{bid.addressLine1}</div>}
                                {bid.addressLine2 && <div>{bid.addressLine2}</div>}
                                {(bid.city || bid.state || bid.postalCode) && (
                                  <div>
                                    {[bid.city, bid.state, bid.postalCode].filter(Boolean).join(', ')}
                                  </div>
                                )}
                                {bid.country && <div>{bid.country}</div>}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-auto ml-auto w-50 border-1 border-[#388AE4]"
                        >
                          View Bid Details
                          <ChevronRight className="ml-auto" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Bid</DialogTitle>
              <DialogDescription>Fill in the details to create a new bid.</DialogDescription>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(onSubmitCreateBid)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerId">
                    Customer <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="customerId"
                    {...(() => {
                      const { onChange, ...rest } = createForm.register('customerId');
                      return {
                        ...rest,
                        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                          if (e.target.value === '__create_new__') {
                            const params = new URLSearchParams(searchParams.toString());
                            params.set('openCreate', 'true');
                            params.set('returnTo', 'bids');
                            e.target.value = '';
                            router.push(`/customers?${params.toString()}`);
                            return;
                          }
                          onChange(e);
                        },
                      };
                    })()}
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2
                      text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring
                      focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed
                      disabled:opacity-50 ${createForm.formState.errors.customerId ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.customerId} value={customer.customerId}>
                        {customer.firstName} {customer.lastName} ({customer.email})
                      </option>
                    ))}
                    <option value="__create_new__">＋ Create new customer</option>
                  </select>
                  {createForm.formState.errors.customerId && (
                    <p className="text-sm text-red-500">{createForm.formState.errors.customerId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="status"
                    {...createForm.register('status')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                      ring-offset-background focus-visible:ring-2 focus-visible:ring-ring
                      focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed
                      disabled:opacity-50"
                  >
                    {bidStatuses.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter bid title"
                    {...createForm.register('title')}
                    className={createForm.formState.errors.title ? 'border-red-500' : ''}
                  />
                  {createForm.formState.errors.title && (
                    <p className="text-sm text-red-500">{createForm.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    placeholder="Enter bid description"
                    {...createForm.register('description')}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2
                      text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2
                      focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none
                      disabled:cursor-not-allowed disabled:opacity-50"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <div className="relative">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">$</span>
                    <Input
                      id="price"
                      type="text"
                      placeholder="0.00"
                      className="pl-7"
                      {...createForm.register('price', {
                        onChange: (e) => {
                          const parsed = parsePriceFromInput(e.target.value);
                          e.target.value = parsed;
                        },
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedStartDate">Estimated Start Date</Label>
                  <Input id="estimatedStartDate" type="date" {...createForm.register('estimatedStartDate')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedEndDate">Estimated End Date</Label>
                  <Input id="estimatedEndDate" type="date" {...createForm.register('estimatedEndDate')} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-base font-semibold">Address</Label>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    placeholder="Enter address"
                    {...createForm.register('addressLine1')}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Enter address line 2"
                    {...createForm.register('addressLine2')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Enter city" {...createForm.register('city')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" placeholder="Enter state" {...createForm.register('state')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    placeholder="Enter postal code"
                    {...createForm.register('postalCode')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" placeholder="Enter country" {...createForm.register('country')} />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    createForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Bid'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default function BidsPage() {
  return (
    <Suspense>
      <BidsPageInner />
    </Suspense>
  );
}
