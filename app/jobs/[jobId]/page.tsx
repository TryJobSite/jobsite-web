'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/(hooks)/useApi';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Button } from '@/(components)/shadcn/ui/button';
import { Input } from '@/(components)/shadcn/ui/input';
import { Label } from '@/(components)/shadcn/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/(components)/shadcn/ui/dialog';
import { ArrowLeft, Plus, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

type Job = {
  jobId: string;
  companyId: string;
  customerId: string;
  jobNumber: string | null;
  title: string;
  description: string | null;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold';
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  budget: number | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  metadata: Record<string, unknown>;
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

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planned: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    'on-hold': 'bg-slate-100 text-slate-800',
  };
  return colors[status] || 'bg-slate-100 text-slate-800';
}

function formatStatus(status: string): string {
  return status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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

function formatBudgetForInput(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value.toFixed(2);
}

function parseBudgetFromInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
}

const addressSchema = z.object({
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

const descriptionSchema = z.object({
  description: z.string().optional(),
});

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  price: z.string().optional(),
});

const statementOfWorkSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
});

const changeOrderSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
  customerNotified: z.boolean().optional(),
});

const jobDetailsSchema = z.object({
  budget: z.string().optional(),
  estimatedStartDate: z.string().optional(),
  estimatedEndDate: z.string().optional(),
  actualStartDate: z.string().optional(),
  actualEndDate: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;
type DescriptionFormData = z.infer<typeof descriptionSchema>;
type StatementOfWorkFormData = z.infer<typeof statementOfWorkSchema>;
type ChangeOrderFormData = z.infer<typeof changeOrderSchema>;
type JobDetailsFormData = z.infer<typeof jobDetailsSchema>;

type StatementOfWork = {
  statementOfWorkId: string;
  contractorId: string;
  jobId: string;
  lineItems: {
    description: string;
    price?: number | null;
  }[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChangeOrder = {
  changeOrderId: string;
  jobId: string;
  lineItems: {
    description: string;
    price?: number | null;
  }[];
  notes: string | null;
  customerNotified: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { api } = useApi();
  const queryClient = useQueryClient();
  const jobId = params.jobId as string;

  const [editingSection, setEditingSection] = useState<'address' | 'description' | 'details' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingSOW, setIsEditingSOW] = useState(false);
  const [isCreatingSOW, setIsCreatingSOW] = useState(false);
  const [isCreateChangeOrderOpen, setIsCreateChangeOrderOpen] = useState(false);
  const [editingChangeOrderId, setEditingChangeOrderId] = useState<string | null>(null);

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const descriptionForm = useForm<DescriptionFormData>({
    resolver: zodResolver(descriptionSchema),
  });

  const jobDetailsForm = useForm<JobDetailsFormData>({
    resolver: zodResolver(jobDetailsSchema),
  });

  const sowForm = useForm<StatementOfWorkFormData>({
    resolver: zodResolver(statementOfWorkSchema),
    defaultValues: {
      lineItems: [{ description: '', price: '' }],
      notes: '',
    },
  });

  const changeOrderForm = useForm<ChangeOrderFormData>({
    resolver: zodResolver(changeOrderSchema),
    defaultValues: {
      lineItems: [{ description: '', price: '' }],
      notes: '',
      customerNotified: false,
    },
  });

  const { data: sowData, isLoading: isLoadingSOW } = useQuery({
    queryKey: ['statementOfWork', jobId],
    queryFn: async () => {
      try {
        const response = await api.GET('/jobs/statementofwork/{jobId}', {
          params: {
            path: {
              jobId: jobId,
            },
          },
        });
        return response.data?.responseObject?.statementOfWork as StatementOfWork | null;
      } catch (error: any) {
        if (error?.statusCode === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  const { data: changeOrdersData, isLoading: isLoadingChangeOrders } = useQuery({
    queryKey: ['changeOrders', jobId],
    queryFn: async () => {
      try {
        const response = await api.GET('/jobs/changeorders/{jobId}', {
          params: {
            path: {
              jobId: jobId,
            },
          },
        });
        return (response.data?.responseObject?.changeOrders || []) as ChangeOrder[];
      } catch (error: any) {
        if (error?.statusCode === 404) {
          return [];
        }
        throw error;
      }
    },
  });

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await api.GET('/jobs', {});
      const jobs = response.data?.responseObject?.jobs || [];
      return jobs as unknown as Array<
        Job & { customer?: { customerId: string; firstName: string; lastName: string; email: string } }
      >;
    },
  });

  const job = jobsData?.find((j) => j.jobId === jobId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-slate-500">Loading job...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">Job not found.</div>
        <Button variant="outline" onClick={() => router.push('/jobs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
      </div>
    );
  }

  const handleEditAddress = async () => {
    setEditingSection('address');
    addressForm.reset({
      addressLine1: job.addressLine1 || '',
      addressLine2: job.addressLine2 || '',
      city: job.city || '',
      state: job.state || '',
      postalCode: job.postalCode || '',
      country: job.country || '',
    });
  };

  const handleEditDescription = () => {
    setEditingSection('description');
    descriptionForm.reset({
      description: job.description || '',
    });
  };

  const handleEditDetails = () => {
    setEditingSection('details');
    jobDetailsForm.reset({
      budget: formatBudgetForInput(job.budget),
      estimatedStartDate: formatDateOnlyForInput(job.estimatedStartDate),
      estimatedEndDate: formatDateOnlyForInput(job.estimatedEndDate),
      actualStartDate: formatDateOnlyForInput(job.actualStartDate),
      actualEndDate: formatDateOnlyForInput(job.actualEndDate),
    });
  };

  const handleCancel = () => {
    setEditingSection(null);
    addressForm.reset();
    descriptionForm.reset();
    jobDetailsForm.reset();
  };

  const onSubmitAddress = async (data: AddressFormData) => {
    setIsSubmitting(true);
    try {
      await api.PATCH('/jobs/{jobId}', {
        params: {
          path: {
            jobId: job.jobId,
          },
        },
        body: {
          addressLine1: data.addressLine1 || null,
          addressLine2: data.addressLine2 || null,
          city: data.city || null,
          state: data.state || null,
          postalCode: data.postalCode || null,
          country: data.country || null,
        } as any,
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setEditingSection(null);
    } catch (error) {
      console.error('Update address error:', error);
      alert('Failed to update address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitDescription = async (data: DescriptionFormData) => {
    setIsSubmitting(true);
    try {
      await api.PATCH('/jobs/{jobId}', {
        params: {
          path: {
            jobId: job.jobId,
          },
        },
        body: {
          description: data.description || null,
        } as any,
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setEditingSection(null);
    } catch (error) {
      console.error('Update description error:', error);
      alert('Failed to update description. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSOW = () => {
    setIsCreatingSOW(true);
    setIsEditingSOW(false);
    sowForm.reset({
      lineItems: [{ description: '', price: '' }],
      notes: '',
    });
  };

  const handleEditSOW = () => {
    if (!sowData) return;
    setIsEditingSOW(true);
    setIsCreatingSOW(false);
    sowForm.reset({
      lineItems: sowData.lineItems.map((item) => ({
        description: item.description,
        price: item.price ? item.price.toFixed(2) : '',
      })),
      notes: sowData.notes || '',
    });
  };

  const handleCancelSOW = () => {
    setIsCreatingSOW(false);
    setIsEditingSOW(false);
    sowForm.reset();
  };

  const handleCreateChangeOrder = () => {
    setIsCreateChangeOrderOpen(true);
    changeOrderForm.reset({
      lineItems: [{ description: '', price: '' }],
      notes: '',
      customerNotified: false,
    });
  };

  const handleEditChangeOrder = (changeOrder: ChangeOrder) => {
    setEditingChangeOrderId(changeOrder.changeOrderId);
    setIsCreateChangeOrderOpen(true);
    changeOrderForm.reset({
      lineItems: changeOrder.lineItems.map((item) => ({
        description: item.description,
        price: item.price ? item.price.toFixed(2) : '',
      })),
      notes: changeOrder.notes || '',
      customerNotified: changeOrder.customerNotified,
    });
  };

  const handleCloseChangeOrderModal = () => {
    setIsCreateChangeOrderOpen(false);
    setEditingChangeOrderId(null);
    changeOrderForm.reset();
  };

  const onSubmitChangeOrder = async (data: ChangeOrderFormData) => {
    setIsSubmitting(true);
    try {
      const lineItems = data.lineItems.map((item) => ({
        description: item.description,
        price: item.price ? parseFloat(item.price) : null,
      }));

      if (editingChangeOrderId) {
        await api.PATCH('/jobs/changeorders/{jobId}/{changeOrderId}', {
          params: {
            path: {
              jobId: job.jobId,
              changeOrderId: editingChangeOrderId,
            },
          },
          body: {
            lineItems,
            notes: data.notes || null,
            customerNotified: data.customerNotified,
          } as any,
        });
      } else {
        await api.POST('/jobs/changeorders/{jobId}', {
          params: {
            path: {
              jobId: job.jobId,
            },
          },
          body: {
            lineItems,
            notes: data.notes || undefined,
            customerNotified: data.customerNotified,
          } as any,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['changeOrders', jobId] });
      handleCloseChangeOrderModal();
    } catch (error) {
      console.error('Save change order error:', error);
      alert('Failed to save change order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitSOW = async (data: StatementOfWorkFormData) => {
    setIsSubmitting(true);
    try {
      const lineItems = data.lineItems.map((item) => ({
        description: item.description,
        price: item.price ? parseFloat(item.price) : null,
      }));

      if (isCreatingSOW) {
        await api.POST('/jobs/statementofwork/{jobId}', {
          params: {
            path: {
              jobId: job.jobId,
            },
          },
          body: {
            lineItems,
            notes: data.notes || undefined,
          } as any,
        });
      } else {
        await api.PATCH('/jobs/statementofwork/{jobId}', {
          params: {
            path: {
              jobId: job.jobId,
            },
          },
          body: {
            lineItems,
            notes: data.notes || null,
          } as any,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['statementOfWork', jobId] });
      setIsCreatingSOW(false);
      setIsEditingSOW(false);
    } catch (error) {
      console.error('Update statement of work error:', error);
      alert('Failed to save statement of work. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitDetails = async (data: JobDetailsFormData) => {
    setIsSubmitting(true);
    try {
      const formatDateToISO = (dateStr: string | undefined) => {
        if (!dateStr || dateStr === '') return null;
        return new Date(dateStr + 'T00:00:00').toISOString();
      };

      await api.PATCH('/jobs/{jobId}', {
        params: {
          path: {
            jobId: job.jobId,
          },
        },
        body: {
          budget: data.budget ? parseFloat(parseBudgetFromInput(data.budget)) : null,
          estimatedStartDate: formatDateToISO(data.estimatedStartDate) as string | null | undefined,
          estimatedEndDate: formatDateToISO(data.estimatedEndDate) as string | null | undefined,
          actualStartDate: formatDateToISO(data.actualStartDate) as string | null | undefined,
          actualEndDate: formatDateToISO(data.actualEndDate) as string | null | undefined,
        } as any,
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setEditingSection(null);
    } catch (error) {
      console.error('Update job details error:', error);
      alert('Failed to update job details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/jobs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(job.status)}`}>
              {formatStatus(job.status)}
            </span>
          </div>
          {job.jobNumber && <p className="text-slate-600">Job #{job.jobNumber}</p>}
        </div>
        <Button onClick={handleCreateChangeOrder}>
          <Plus className="mr-2 h-4 w-4" />
          Create Change Order
        </Button>
      </div>

      {job.customer && (
        <Card className={editingSection === 'address' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Customer & Address</CardTitle>
              {editingSection === 'address' ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={addressForm.handleSubmit(onSubmitAddress)}
                    disabled={!addressForm.formState.isDirty || isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={handleEditAddress}>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            <div className="min-w-[calc(33.333%-1rem)] flex-1">
              <div className="text-sm text-slate-500">Customer</div>
              <Link
                href={`/customers/${job.customerId}`}
                className="font-medium text-primary hover:underline"
              >
                {job.customer.firstName} {job.customer.lastName}
              </Link>
              <p className="mt-1 text-sm text-slate-600">{job.customer.email}</p>
            </div>
            {editingSection === 'address' ? (
              <form
                onSubmit={addressForm.handleSubmit(onSubmitAddress)}
                className="flex flex-1 flex-wrap gap-6"
              >
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <Label htmlFor="addressLine1" className="text-sm text-slate-500">
                    Address Line 1
                  </Label>
                  <Input
                    id="addressLine1"
                    {...addressForm.register('addressLine1')}
                    className="mt-1"
                    placeholder="Street address"
                  />
                </div>
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <Label htmlFor="addressLine2" className="text-sm text-slate-500">
                    Address Line 2
                  </Label>
                  <Input
                    id="addressLine2"
                    {...addressForm.register('addressLine2')}
                    className="mt-1"
                    placeholder="Apartment, suite, etc."
                  />
                </div>
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <Label htmlFor="city" className="text-sm text-slate-500">
                    City
                  </Label>
                  <Input id="city" {...addressForm.register('city')} className="mt-1" placeholder="City" />
                </div>
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <Label htmlFor="state" className="text-sm text-slate-500">
                    State
                  </Label>
                  <Input id="state" {...addressForm.register('state')} className="mt-1" placeholder="State" />
                </div>
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <Label htmlFor="postalCode" className="text-sm text-slate-500">
                    Postal Code
                  </Label>
                  <Input
                    id="postalCode"
                    {...addressForm.register('postalCode')}
                    className="mt-1"
                    placeholder="Postal code"
                  />
                </div>
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <Label htmlFor="country" className="text-sm text-slate-500">
                    Country
                  </Label>
                  <Input
                    id="country"
                    {...addressForm.register('country')}
                    className="mt-1"
                    placeholder="Country"
                  />
                </div>
              </form>
            ) : (
              (job.addressLine1 || job.city || job.state) && (
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <div className="text-sm text-slate-500">Job Address</div>
                  <div className="mt-1 space-y-1">
                    {job.addressLine1 && <div className="font-medium">{job.addressLine1}</div>}
                    {job.addressLine2 && <div>{job.addressLine2}</div>}
                    {(job.city || job.state || job.postalCode) && (
                      <div>{[job.city, job.state, job.postalCode].filter(Boolean).join(', ')}</div>
                    )}
                    {job.country && <div>{job.country}</div>}
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-6">
        <Card
          className={`min-w-[400px] flex-1 ${editingSection === 'description' ? 'ring-2 ring-primary' : ''}`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Description</CardTitle>
              {editingSection === 'description' ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={descriptionForm.handleSubmit(onSubmitDescription)}
                    disabled={!descriptionForm.formState.isDirty || isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={handleEditDescription}>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingSection === 'description' ? (
              <form onSubmit={descriptionForm.handleSubmit(onSubmitDescription)}>
                <textarea
                  {...descriptionForm.register('description')}
                  className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2
                    text-sm ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                    focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                    disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Add a description for this job..."
                  rows={6}
                />
              </form>
            ) : (
              <p className="whitespace-pre-wrap text-slate-700">{job.description || 'No description'}</p>
            )}
          </CardContent>
        </Card>

        <Card className={`min-w-[400px] flex-1 ${editingSection === 'details' ? 'ring-2 ring-primary' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Job Details</CardTitle>
              {editingSection === 'details' ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={jobDetailsForm.handleSubmit(onSubmitDetails)}
                    disabled={!jobDetailsForm.formState.isDirty || isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={handleEditDetails}>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            {editingSection === 'details' ? (
              <form
                onSubmit={jobDetailsForm.handleSubmit(onSubmitDetails)}
                className="flex w-full flex-wrap gap-6"
              >
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <Label htmlFor="budget" className="text-sm text-slate-500">
                    Budget
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">$</span>
                    <Input
                      id="budget"
                      {...jobDetailsForm.register('budget', {
                        onChange: (e) => {
                          const value = parseBudgetFromInput(e.target.value);
                          jobDetailsForm.setValue('budget', value, { shouldDirty: true });
                          e.target.value = value;
                        },
                      })}
                      className="pl-7"
                      placeholder="0.00"
                      type="text"
                      inputMode="decimal"
                    />
                  </div>
                </div>
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <Label htmlFor="estimatedStartDate" className="text-sm text-slate-500">
                    Estimated Start Date
                  </Label>
                  <Input
                    id="estimatedStartDate"
                    type="date"
                    {...jobDetailsForm.register('estimatedStartDate')}
                    className="mt-1"
                  />
                </div>
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <Label htmlFor="estimatedEndDate" className="text-sm text-slate-500">
                    Estimated End Date
                  </Label>
                  <Input
                    id="estimatedEndDate"
                    type="date"
                    {...jobDetailsForm.register('estimatedEndDate')}
                    className="mt-1"
                  />
                </div>
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <Label htmlFor="actualStartDate" className="text-sm text-slate-500">
                    Actual Start Date
                  </Label>
                  <Input
                    id="actualStartDate"
                    type="date"
                    {...jobDetailsForm.register('actualStartDate')}
                    className="mt-1"
                  />
                </div>
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <Label htmlFor="actualEndDate" className="text-sm text-slate-500">
                    Actual End Date
                  </Label>
                  <Input
                    id="actualEndDate"
                    type="date"
                    {...jobDetailsForm.register('actualEndDate')}
                    className="mt-1"
                  />
                </div>
              </form>
            ) : (
              <>
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <div className="text-sm text-slate-500">Budget</div>
                  <div className="text-lg font-medium">{formatCurrency(job.budget)}</div>
                </div>
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <div className="text-sm text-slate-500">Estimated Start Date</div>
                  <div className="font-medium">{formatDate(job.estimatedStartDate)}</div>
                </div>
                <div className="min-w-[calc(33.333%-1rem)] flex-1">
                  <div className="text-sm text-slate-500">Estimated End Date</div>
                  <div className="font-medium">{formatDate(job.estimatedEndDate)}</div>
                </div>
                {job.actualStartDate && (
                  <div className="min-w-[calc(33.333%-1rem)] flex-1">
                    <div className="text-sm text-slate-500">Actual Start Date</div>
                    <div className="font-medium">{formatDate(job.actualStartDate)}</div>
                  </div>
                )}
                {job.actualEndDate && (
                  <div className="min-w-[calc(33.333%-1rem)] flex-1">
                    <div className="text-sm text-slate-500">Actual End Date</div>
                    <div className="font-medium">{formatDate(job.actualEndDate)}</div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Statement of Work</CardTitle>
            {!isLoadingSOW && !sowData && !isCreatingSOW && (
              <Button size="sm" onClick={handleCreateSOW}>
                <Plus className="mr-2 h-4 w-4" />
                Create Statement of Work
              </Button>
            )}
            {!isLoadingSOW && sowData && !isEditingSOW && !isCreatingSOW && (
              <Button size="sm" variant="outline" onClick={handleEditSOW}>
                Edit
              </Button>
            )}
            {(isCreatingSOW || isEditingSOW) && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCancelSOW} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={sowForm.handleSubmit(onSubmitSOW)}
                  disabled={!sowForm.formState.isDirty || isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSOW ? (
            <div className="text-slate-500">Loading statement of work...</div>
          ) : isCreatingSOW || isEditingSOW ? (
            <form onSubmit={sowForm.handleSubmit(onSubmitSOW)} className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Line Items</Label>
                <div className="mt-2 space-y-4">
                  {sowForm.watch('lineItems').map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`lineItems.${index}.description`} className="text-sm text-slate-500">
                          Description
                        </Label>
                        <Input
                          id={`lineItems.${index}.description`}
                          {...sowForm.register(`lineItems.${index}.description`)}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <Label htmlFor={`lineItems.${index}.price`} className="text-sm text-slate-500">
                          Price
                        </Label>
                        <div className="relative">
                          <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">$</span>
                          <Input
                            id={`lineItems.${index}.price`}
                            {...sowForm.register(`lineItems.${index}.price`)}
                            className="pl-7"
                            placeholder="0.00"
                            type="text"
                            inputMode="decimal"
                          />
                        </div>
                      </div>
                      {sowForm.watch('lineItems').length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-8"
                          onClick={() => {
                            const currentItems = sowForm.getValues('lineItems');
                            sowForm.setValue(
                              'lineItems',
                              currentItems.filter((_, i) => i !== index),
                              { shouldDirty: true }
                            );
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    const currentItems = sowForm.getValues('lineItems');
                    sowForm.setValue('lineItems', [...currentItems, { description: '', price: '' }], {
                      shouldDirty: true,
                    });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line Item
                </Button>
              </div>
              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </Label>
                <textarea
                  id="notes"
                  {...sowForm.register('notes')}
                  className="mt-2 flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3
                    py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                    focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                    disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Additional notes..."
                  rows={4}
                />
              </div>
            </form>
          ) : sowData ? (
            <div className="space-y-4">
              <div>
                <h4 className="mb-3 text-sm font-medium">Line Items</h4>
                <div className="space-y-3">
                  {sowData.lineItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between border-b border-slate-200 pb-3"
                    >
                      <div className="flex-1">
                        <p className="text-slate-700">{item.description}</p>
                      </div>
                      <div className="w-32 text-right">
                        <p className="font-medium">
                          {item.price !== null && item.price !== undefined
                            ? new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(item.price)
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="text-sm">
                    <span className="text-slate-500">Total: </span>
                    <span className="text-lg font-bold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(sowData.lineItems.reduce((sum, item) => sum + (item.price || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>
              {sowData.notes && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">Notes</h4>
                  <p className="whitespace-pre-wrap text-slate-700">{sowData.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="mb-4 text-slate-500">No statement of work has been created yet.</p>
              <Button onClick={handleCreateSOW}>
                <Plus className="mr-2 h-4 w-4" />
                Create Statement of Work
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Change Orders</CardTitle>
            {changeOrdersData && changeOrdersData.length > 0 && (
              <div className="text-sm">
                <span className="text-slate-500">Total: </span>
                <span className="text-lg font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(
                    changeOrdersData.reduce(
                      (sum, changeOrder) =>
                        sum + changeOrder.lineItems.reduce((itemSum, item) => itemSum + (item.price || 0), 0),
                      0
                    )
                  )}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingChangeOrders ? (
            <div className="text-slate-500">Loading change orders...</div>
          ) : changeOrdersData && changeOrdersData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Change Order</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Creation Date</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Total Price</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                      Customer Notified
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {changeOrdersData.map((changeOrder) => {
                    const total = changeOrder.lineItems.reduce((sum, item) => sum + (item.price || 0), 0);
                    return (
                      <tr
                        key={changeOrder.changeOrderId}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-sm text-slate-900">
                          #{changeOrder.changeOrderId.slice(-8)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {formatDate(changeOrder.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(total)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {changeOrder.customerNotified ? (
                            <span
                              className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5
                                text-xs font-medium text-emerald-800"
                            >
                              Yes
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5
                                text-xs font-medium text-slate-800"
                            >
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditChangeOrder(changeOrder)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-slate-500">No change orders have been created yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateChangeOrderOpen} onOpenChange={handleCloseChangeOrderModal}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingChangeOrderId ? 'Edit Change Order' : 'Create Change Order'}</DialogTitle>
            <DialogDescription>
              {editingChangeOrderId
                ? 'Update the change order details below.'
                : 'Add line items and details for the change order.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={changeOrderForm.handleSubmit(onSubmitChangeOrder)} className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Line Items</Label>
              <div className="mt-2 space-y-4">
                {changeOrderForm.watch('lineItems').map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`co-lineItems.${index}.description`} className="text-sm text-slate-500">
                        Description
                      </Label>
                      <Input
                        id={`co-lineItems.${index}.description`}
                        {...changeOrderForm.register(`lineItems.${index}.description`)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <Label htmlFor={`co-lineItems.${index}.price`} className="text-sm text-slate-500">
                        Price
                      </Label>
                      <div className="relative">
                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">$</span>
                        <Input
                          id={`co-lineItems.${index}.price`}
                          {...changeOrderForm.register(`lineItems.${index}.price`)}
                          className="pl-7"
                          placeholder="0.00"
                          type="text"
                          inputMode="decimal"
                        />
                      </div>
                    </div>
                    {changeOrderForm.watch('lineItems').length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-8"
                        onClick={() => {
                          const currentItems = changeOrderForm.getValues('lineItems');
                          changeOrderForm.setValue(
                            'lineItems',
                            currentItems.filter((_, i) => i !== index),
                            { shouldDirty: true }
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  const currentItems = changeOrderForm.getValues('lineItems');
                  changeOrderForm.setValue('lineItems', [...currentItems, { description: '', price: '' }], {
                    shouldDirty: true,
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Line Item
              </Button>
            </div>
            <div>
              <Label htmlFor="co-notes" className="text-sm font-medium">
                Notes
              </Label>
              <textarea
                id="co-notes"
                {...changeOrderForm.register('notes')}
                className="mt-2 flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3
                  py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                  focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                  disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Additional notes..."
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="co-customerNotified"
                {...changeOrderForm.register('customerNotified')}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary"
              />
              <Label htmlFor="co-customerNotified" className="text-sm font-medium">
                Customer Notified
              </Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseChangeOrderModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!changeOrderForm.formState.isDirty || isSubmitting}>
                {isSubmitting ? 'Saving...' : editingChangeOrderId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
