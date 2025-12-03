'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Plus } from 'lucide-react';

type JobStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold';

const jobStatuses: JobStatus[] = ['planned', 'in-progress', 'completed', 'cancelled', 'on-hold'];

const jobSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  jobNumber: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['planned', 'in-progress', 'completed', 'cancelled', 'on-hold']),
  estimatedStartDate: z.string().optional(),
  estimatedEndDate: z.string().optional(),
  actualStartDate: z.string().optional(),
  actualEndDate: z.string().optional(),
  budget: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

type Job = {
  jobId: string;
  companyId: string;
  customerId: string;
  jobNumber: string | null;
  title: string;
  description: string | null;
  status: JobStatus;
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

function getStatusColor(status: JobStatus): string {
  const colors = {
    planned: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    'on-hold': 'bg-slate-100 text-slate-800',
  };
  return colors[status] || 'bg-slate-100 text-slate-800';
}

function formatStatus(status: JobStatus): string {
  return status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatBudgetForInput(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  // Return the number with 2 decimal places, without currency symbol (we add $ prefix in UI)
  return value.toFixed(2);
}

function parseBudgetFromInput(value: string): string {
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  // Remove multiple decimal points, keep only the first one
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
}

export default function JobsPage() {
  const { api } = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const createForm = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      status: 'planned' as const,
    },
  });

  const editForm = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await api.GET('/jobs', {});
      const jobs = response.data?.responseObject?.jobs || [];
      return jobs as unknown as Job[];
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

  const jobs = data || [];
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

  const handleJobClick = (job: Job) => {
    router.push(`/jobs/${job.jobId}`);
  };

  const onSubmitCreateJob = async (data: JobFormData) => {
    setIsSubmitting(true);
    try {
      // Convert date format (YYYY-MM-DD) to ISO string for estimated dates
      const formatDateToISO = (dateStr: string | undefined) => {
        if (!dateStr) return undefined;
        // date returns YYYY-MM-DD, convert to ISO at midnight UTC
        return new Date(dateStr + 'T00:00:00').toISOString();
      };
      // Convert datetime-local format to ISO string for actual dates
      const formatDateTime = (dateStr: string | undefined) => {
        if (!dateStr) return undefined;
        // datetime-local returns YYYY-MM-DDTHH:mm, convert to ISO
        return new Date(dateStr).toISOString();
      };

      const response = await api.POST('/jobs', {
        body: {
          customerId: data.customerId,
          title: data.title,
          description: data.description || undefined,
          jobNumber: data.jobNumber || undefined,
          status: data.status,
          estimatedStartDate: formatDateToISO(data.estimatedStartDate),
          estimatedEndDate: formatDateToISO(data.estimatedEndDate),
          budget: data.budget ? parseFloat(data.budget) : undefined,
          addressLine1: data.addressLine1 || undefined,
          addressLine2: data.addressLine2 || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          postalCode: data.postalCode || undefined,
          country: data.country || undefined,
        },
      });
      console.log('Create job response:', response);
      setIsCreateDialogOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    } catch (error) {
      console.error('Create job error:', error);
      alert('Failed to create job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitUpdateJob = async (data: JobFormData) => {
    if (!editingJob) return;
    setIsUpdating(true);
    try {
      // Convert date format (YYYY-MM-DD) to ISO string for estimated dates
      const formatDateToISO = (dateStr: string | undefined) => {
        if (!dateStr || dateStr === '') return null;
        // date returns YYYY-MM-DD, convert to ISO at midnight UTC
        return new Date(dateStr + 'T00:00:00').toISOString();
      };
      // Convert datetime-local format to ISO string for actual dates
      const formatDateTime = (dateStr: string | undefined) => {
        if (!dateStr || dateStr === '') return null;
        // datetime-local returns YYYY-MM-DDTHH:mm, convert to ISO
        return new Date(dateStr).toISOString();
      };

      const response = await api.PATCH('/jobs/{jobId}', {
        params: {
          path: {
            jobId: editingJob.jobId,
          },
        },
        body: {
          customerId: data.customerId,
          title: data.title,
          description: data.description || null,
          jobNumber: data.jobNumber || null,
          status: data.status,
          estimatedStartDate: formatDateToISO(data.estimatedStartDate) as string | null | undefined,
          estimatedEndDate: formatDateToISO(data.estimatedEndDate) as string | null | undefined,
          actualStartDate: formatDateTime(data.actualStartDate) as string | null | undefined,
          actualEndDate: formatDateTime(data.actualEndDate) as string | null | undefined,
          budget: data.budget ? parseFloat(data.budget) : null,
          addressLine1: data.addressLine1 || null,
          addressLine2: data.addressLine2 || null,
          city: data.city || null,
          state: data.state || null,
          postalCode: data.postalCode || null,
          country: data.country || null,
        } as any,
      });
      console.log('Update job response:', response);
      setIsEditDialogOpen(false);
      setEditingJob(null);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    } catch (error) {
      console.error('Update job error:', error);
      alert('Failed to update job. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-slate-600">Manage and view all your jobs</p>
        </div>
        <div className="text-slate-500">Loading jobs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-slate-600">Manage and view all your jobs</p>
        </div>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          Failed to load jobs. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-slate-600">Manage and view all your jobs</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No jobs found. Create your first job to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card
              key={job.jobId}
              className="flex cursor-pointer flex-col transition-shadow hover:shadow-md"
              onClick={() => handleJobClick(job)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    {job.jobNumber && (
                      <CardDescription className="mt-1">Job #{job.jobNumber}</CardDescription>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(job.status)}`}
                  >
                    {formatStatus(job.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {job.description && <p className="line-clamp-2 text-sm text-slate-600">{job.description}</p>}

                <div className="space-y-2 text-sm">
                  {job.budget !== null && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Budget:</span>
                      <span className="font-medium">{formatCurrency(job.budget)}</span>
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
                    <div className="border-t border-slate-200 pt-2">
                      <div className="mb-1 text-xs text-slate-500">Address:</div>
                      <div className="text-xs">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>Fill in the details to create a new job.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(onSubmitCreateJob)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerId">
                  Customer <span className="text-red-500">*</span>
                </Label>
                <select
                  id="customerId"
                  {...createForm.register('customerId')}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                    ring-offset-background focus-visible:ring-2 focus-visible:ring-ring
                    focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed
                    disabled:opacity-50 ${createForm.formState.errors.customerId ? 'border-red-500' : ''}`}
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.customerId} value={customer.customerId}>
                      {customer.firstName} {customer.lastName} ({customer.email})
                    </option>
                  ))}
                </select>
                {createForm.formState.errors.customerId && (
                  <p className="text-sm text-red-500">{createForm.formState.errors.customerId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobNumber">Job Number</Label>
                <Input id="jobNumber" placeholder="Enter job number" {...createForm.register('jobNumber')} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter job title"
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
                  placeholder="Enter job description"
                  {...createForm.register('description')}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2
                    text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2
                    focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none
                    disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                />
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
                  {jobStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <div className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">$</span>
                  <Input
                    id="budget"
                    type="text"
                    placeholder="0.00"
                    className="pl-7"
                    {...createForm.register('budget', {
                      onChange: (e) => {
                        const parsed = parseBudgetFromInput(e.target.value);
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
                {isSubmitting ? 'Creating...' : 'Create Job'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
            <DialogDescription>Update the job details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onSubmitUpdateJob)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-customerId">
                  Customer <span className="text-red-500">*</span>
                </Label>
                <select
                  id="edit-customerId"
                  {...editForm.register('customerId')}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                    ring-offset-background focus-visible:ring-2 focus-visible:ring-ring
                    focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed
                    disabled:opacity-50 ${editForm.formState.errors.customerId ? 'border-red-500' : ''}`}
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.customerId} value={customer.customerId}>
                      {customer.firstName} {customer.lastName} ({customer.email})
                    </option>
                  ))}
                </select>
                {editForm.formState.errors.customerId && (
                  <p className="text-sm text-red-500">{editForm.formState.errors.customerId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-jobNumber">Job Number</Label>
                <Input
                  id="edit-jobNumber"
                  placeholder="Enter job number"
                  {...editForm.register('jobNumber')}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-title"
                  placeholder="Enter job title"
                  {...editForm.register('title')}
                  className={editForm.formState.errors.title ? 'border-red-500' : ''}
                />
                {editForm.formState.errors.title && (
                  <p className="text-sm text-red-500">{editForm.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-description">Description</Label>
                <textarea
                  id="edit-description"
                  placeholder="Enter job description"
                  {...editForm.register('description')}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2
                    text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2
                    focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none
                    disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <select
                  id="edit-status"
                  {...editForm.register('status')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                    ring-offset-background focus-visible:ring-2 focus-visible:ring-ring
                    focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed
                    disabled:opacity-50"
                >
                  {jobStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-budget">Budget</Label>
                <div className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">$</span>
                  <Input
                    id="edit-budget"
                    type="text"
                    placeholder="0.00"
                    className="pl-7"
                    {...editForm.register('budget', {
                      onChange: (e) => {
                        const parsed = parseBudgetFromInput(e.target.value);
                        e.target.value = parsed;
                      },
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-estimatedStartDate">Estimated Start Date</Label>
                <Input
                  id="edit-estimatedStartDate"
                  type="date"
                  {...editForm.register('estimatedStartDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-estimatedEndDate">Estimated End Date</Label>
                <Input id="edit-estimatedEndDate" type="date" {...editForm.register('estimatedEndDate')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-actualStartDate">Actual Start Date</Label>
                <Input
                  id="edit-actualStartDate"
                  type="datetime-local"
                  {...editForm.register('actualStartDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-actualEndDate">Actual End Date</Label>
                <Input
                  id="edit-actualEndDate"
                  type="datetime-local"
                  {...editForm.register('actualEndDate')}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-base font-semibold">Address</Label>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-addressLine1">Address Line 1</Label>
                <Input
                  id="edit-addressLine1"
                  placeholder="Enter address"
                  {...editForm.register('addressLine1')}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-addressLine2">Address Line 2</Label>
                <Input
                  id="edit-addressLine2"
                  placeholder="Enter address line 2"
                  {...editForm.register('addressLine2')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input id="edit-city" placeholder="Enter city" {...editForm.register('city')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-state">State</Label>
                <Input id="edit-state" placeholder="Enter state" {...editForm.register('state')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-postalCode">Postal Code</Label>
                <Input
                  id="edit-postalCode"
                  placeholder="Enter postal code"
                  {...editForm.register('postalCode')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Input id="edit-country" placeholder="Enter country" {...editForm.register('country')} />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingJob(null);
                  editForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update Job'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
