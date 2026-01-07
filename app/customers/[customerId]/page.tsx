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
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/(components)/layout/page-header';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/(components)/shadcn/ui/breadcrumb';

type Customer = {
  customerId: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  preferredContactMethod: 'email' | 'phone' | 'sms' | 'whatsapp' | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

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
};

function formatContactMethod(method: string | null | undefined): string {
  if (!method) return 'Not set';
  return method.charAt(0).toUpperCase() + method.slice(1);
}

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

const contactMethods = ['email', 'phone', 'sms', 'whatsapp'] as const;

const contactSchema = z.object({
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'sms', 'whatsapp']).optional(),
});

const addressSchema = z.object({
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
});

const notesSchema = z.object({
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;
type AddressFormData = z.infer<typeof addressSchema>;
type NotesFormData = z.infer<typeof notesSchema>;

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { api } = useApi();
  const queryClient = useQueryClient();
  const customerId = params.customerId as string;

  const [editingSection, setEditingSection] = useState<'contact' | 'address' | 'notes' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const notesForm = useForm<NotesFormData>({
    resolver: zodResolver(notesSchema),
  });

  const { data: customersData, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.GET('/customers', {});
      const customers = response.data?.responseObject?.customers || [];
      return customers as unknown as Customer[];
    },
  });

  const { data: jobsData, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await api.GET('/jobs', {});
      const jobs = response.data?.responseObject?.jobs || [];
      return jobs as unknown as Job[];
    },
  });

  const customer = customersData?.find((c) => c.customerId === customerId);
  const customerJobs = jobsData?.filter((j) => j.customerId === customerId) || [];

  if (isLoadingCustomer) {
    return (
      <div className="space-y-6">
        <div className="text-slate-500">Loading customer...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">Customer not found.</div>
        <Button variant="outline" onClick={() => router.push('/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
      </div>
    );
  }

  const handleEditContact = () => {
    setEditingSection('contact');
    contactForm.reset({
      email: customer.email,
      phoneNumber: customer.phoneNumber || '',
      preferredContactMethod: customer.preferredContactMethod || undefined,
    });
  };

  const handleEditAddress = () => {
    setEditingSection('address');
    addressForm.reset({
      addressLine1: customer.addressLine1,
      addressLine2: customer.addressLine2 || '',
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
    });
  };

  const handleEditNotes = () => {
    setEditingSection('notes');
    notesForm.reset({
      notes: customer.notes || '',
    });
  };

  const handleCancel = () => {
    setEditingSection(null);
    contactForm.reset();
    addressForm.reset();
    notesForm.reset();
  };

  const onSubmitContact = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      await api.PATCH('/customers/:customerId/{customerId}', {
        params: {
          path: {
            customerId: customer.customerId,
          },
        },
        body: {
          email: data.email,
          phoneNumber: data.phoneNumber || null,
          preferredContactMethod: data.preferredContactMethod || undefined,
        } as any,
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setEditingSection(null);
    } catch (error) {
      console.error('Update contact error:', error);
      alert('Failed to update contact information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitAddress = async (data: AddressFormData) => {
    setIsSubmitting(true);
    try {
      await api.PATCH('/customers/:customerId/{customerId}', {
        params: {
          path: {
            customerId: customer.customerId,
          },
        },
        body: {
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || null,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
        } as any,
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setEditingSection(null);
    } catch (error) {
      console.error('Update address error:', error);
      alert('Failed to update address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitNotes = async (data: NotesFormData) => {
    setIsSubmitting(true);
    try {
      await api.PATCH('/customers/:customerId/{customerId}', {
        params: {
          path: {
            customerId: customer.customerId,
          },
        },
        body: {
          notes: data.notes || null,
        } as any,
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setEditingSection(null);
    } catch (error) {
      console.error('Update notes error:', error);
      alert('Failed to update notes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerName = `${customer.firstName} ${customer.lastName}`;

  return (
    <>
      <PageHeader
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/customers" className="text-2xl">
                    Customers
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-2xl">{customerName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card
            className={`${editingSection === 'contact' ? 'ring-2 ring-primary' : ''} ${
              editingSection !== 'contact' ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
            }`}
            onClick={editingSection !== 'contact' ? handleEditContact : undefined}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contact Information</CardTitle>
                {editingSection === 'contact' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel();
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        contactForm.handleSubmit(onSubmitContact)();
                      }}
                      disabled={!contactForm.formState.isDirty || isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingSection === 'contact' ? (
                <form
                  onSubmit={contactForm.handleSubmit(onSubmitContact)}
                  className="space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <Label htmlFor="email" className="text-sm text-slate-500">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...contactForm.register('email')}
                      className="mt-1"
                      placeholder="name@company.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber" className="text-sm text-slate-500">
                      Phone
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      {...contactForm.register('phoneNumber')}
                      className="mt-1"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferredContactMethod" className="text-sm text-slate-500">
                      Preferred Contact Method
                    </Label>
                    <select
                      id="preferredContactMethod"
                      {...contactForm.register('preferredContactMethod')}
                      className="mt-1 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2
                        text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm
                        file:font-medium placeholder:text-slate-500 focus-visible:ring-2
                        focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                        disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select method</option>
                      {contactMethods.map((method) => (
                        <option key={method} value={method}>
                          {formatContactMethod(method)}
                        </option>
                      ))}
                    </select>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <div className="text-sm text-slate-500">Email</div>
                    <div className="font-medium">{customer.email}</div>
                  </div>
                  {customer.phoneNumber && (
                    <div>
                      <div className="text-sm text-slate-500">Phone</div>
                      <div className="font-medium">{customer.phoneNumber}</div>
                    </div>
                  )}
                  {customer.preferredContactMethod && (
                    <div>
                      <div className="text-sm text-slate-500">Preferred Contact Method</div>
                      <div className="font-medium">
                        {formatContactMethod(customer.preferredContactMethod)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card
            className={`${editingSection === 'address' ? 'ring-2 ring-primary' : ''} ${
              editingSection !== 'address' ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
            }`}
            onClick={editingSection !== 'address' ? handleEditAddress : undefined}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Address</CardTitle>
                {editingSection === 'address' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel();
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        addressForm.handleSubmit(onSubmitAddress)();
                      }}
                      disabled={!addressForm.formState.isDirty || isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingSection === 'address' ? (
                <form
                  onSubmit={addressForm.handleSubmit(onSubmitAddress)}
                  className="space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
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
                  <div>
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
                  <div>
                    <Label htmlFor="city" className="text-sm text-slate-500">
                      City
                    </Label>
                    <Input id="city" {...addressForm.register('city')} className="mt-1" placeholder="City" />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-sm text-slate-500">
                      State
                    </Label>
                    <Input
                      id="state"
                      {...addressForm.register('state')}
                      className="mt-1"
                      placeholder="State"
                    />
                  </div>
                  <div>
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
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="font-medium">{customer.addressLine1}</div>
                  {customer.addressLine2 && <div>{customer.addressLine2}</div>}
                  <div>
                    {customer.city}, {customer.state} {customer.postalCode}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card
          className={`${editingSection === 'notes' ? 'ring-2 ring-primary' : ''} ${
            editingSection !== 'notes' ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
          }`}
          onClick={editingSection !== 'notes' ? handleEditNotes : undefined}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Notes</CardTitle>
              {editingSection === 'notes' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      notesForm.handleSubmit(onSubmitNotes)();
                    }}
                    disabled={!notesForm.formState.isDirty || isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingSection === 'notes' ? (
              <form onSubmit={notesForm.handleSubmit(onSubmitNotes)} onClick={(e) => e.stopPropagation()}>
                <textarea
                  {...notesForm.register('notes')}
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2
                    text-sm ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                    focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                    disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Add notes about this customer..."
                  rows={4}
                />
              </form>
            ) : (
              <p className="text-slate-700">{customer.notes || 'No notes'}</p>
            )}
          </CardContent>
        </Card>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Jobs</h2>
              <p className="text-slate-600">Jobs for this customer</p>
            </div>
          </div>

          {isLoadingJobs ? (
            <div className="text-slate-500">Loading jobs...</div>
          ) : customerJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-500">No jobs found for this customer.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {customerJobs.map((job) => (
                <Link key={job.jobId} href={`/jobs/${job.jobId}`}>
                  <Card className="flex cursor-pointer flex-col transition-shadow hover:shadow-md">
                    <CardHeader>
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
                    <CardContent className="flex-1 space-y-3">
                      {job.description && (
                        <p className="line-clamp-2 text-sm text-slate-600">{job.description}</p>
                      )}

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
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
