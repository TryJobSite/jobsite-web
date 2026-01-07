'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/(hooks)/useApi';
import { Button } from '@/(components)/shadcn/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/(components)/shadcn/ui/card';
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

const contactMethods = ['email', 'phone', 'sms', 'whatsapp'] as const;

const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  phoneNumber: z.string().optional(),
  preferredContactMethod: z.enum(contactMethods).optional(),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

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

function formatContactMethod(method: string | null | undefined): string {
  if (!method) return 'Not set';
  return method.charAt(0).toUpperCase() + method.slice(1);
}

export default function CustomersPage() {
  const { api } = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    const handleOpenDialog = () => {
      setIsCreateDialogOpen(true);
    };
    window.addEventListener('openCreateCustomerDialog', handleOpenDialog);
    return () => {
      window.removeEventListener('openCreateCustomerDialog', handleOpenDialog);
    };
  }, []);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const createForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const editForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.GET('/customers', {});
      const customers = response.data?.responseObject?.customers || [];
      return customers as unknown as Customer[];
    },
  });

  const customers = data || [];

  const handleCustomerClick = (customer: Customer) => {
    router.push(`/customers/${customer.customerId}`);
  };

  const onSubmitCreateCustomer = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      const response = await api.POST('/customers', {
        body: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber || undefined,
          preferredContactMethod: data.preferredContactMethod || undefined,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || undefined,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          notes: data.notes || undefined,
        },
      });
      console.log('Create customer response:', response);
      setIsCreateDialogOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (error) {
      console.error('Create customer error:', error);
      alert('Failed to create customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitUpdateCustomer = async (data: CustomerFormData) => {
    if (!editingCustomer) return;
    setIsUpdating(true);
    try {
      const response = await api.PATCH('/customers/:customerId/{customerId}', {
        params: {
          path: {
            customerId: editingCustomer.customerId,
          },
        },
        body: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber || null,
          preferredContactMethod: data.preferredContactMethod || undefined,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || null,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          notes: data.notes || null,
        } as any,
      });
      console.log('Update customer response:', response);
      setIsEditDialogOpen(false);
      setEditingCustomer(null);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (error) {
      console.error('Update customer error:', error);
      alert('Failed to update customer. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-slate-600">Manage and view all your customers</p>
        </div>
        <div className="text-slate-500">Loading customers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-slate-600">Manage and view all your customers</p>
        </div>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          Failed to load customers. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Manage and view all your customers"
        action={
          <Button onClick={() => window.dispatchEvent(new CustomEvent('openCreateCustomerDialog'))}>
            <Plus className="mr-2 h-4 w-4" />
            Create Customer
          </Button>
        }
      />
      <div className="space-y-6 p-6">
        {customers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">No customers found. Create your first customer to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <Card
                key={customer.customerId}
                className="flex cursor-pointer flex-col transition-shadow hover:shadow-md"
                onClick={() => handleCustomerClick(customer)}
              >
                <CardHeader className="p-4">
                  <CardTitle className="mb-0 text-lg">
                    {customer.firstName} {customer.lastName}
                  </CardTitle>
                  <CardDescription>{customer.email}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-3 p-4">
                  {customer.phoneNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span>{customer.phoneNumber}</span>
                    </div>
                  )}

                  {customer.preferredContactMethod && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Preferred Contact:</span>
                      <span>{formatContactMethod(customer.preferredContactMethod)}</span>
                    </div>
                  )}

                  <div className="flex flex-row justify-between gap-2 border-t border-slate-200 pt-2">
                    <div className="mb-1 text-xs text-slate-500">Address:</div>
                    <div className="text-xs">
                      <div>{customer.addressLine1}</div>
                      {customer.addressLine2 && <div>{customer.addressLine2}</div>}
                      <div>
                        {customer.city}, {customer.state} {customer.postalCode}
                      </div>
                    </div>
                  </div>

                  {customer.notes && (
                    <div className="border-t border-slate-200 pt-2">
                      <div className="mb-1 text-xs text-slate-500">Notes:</div>
                      <p className="line-clamp-2 text-xs">{customer.notes}</p>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-auto ml-auto w-50 border-1 border-[#388AE4]"
                  >
                    View Customer Details
                    <ChevronRight className="ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Customer</DialogTitle>
              <DialogDescription>Fill in the details to create a new customer.</DialogDescription>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(onSubmitCreateCustomer)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Enter first name"
                    {...createForm.register('firstName')}
                    className={createForm.formState.errors.firstName ? 'border-red-500' : ''}
                  />
                  {createForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500">{createForm.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Enter last name"
                    {...createForm.register('lastName')}
                    className={createForm.formState.errors.lastName ? 'border-red-500' : ''}
                  />
                  {createForm.formState.errors.lastName && (
                    <p className="text-sm text-red-500">{createForm.formState.errors.lastName.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    {...createForm.register('email')}
                    className={createForm.formState.errors.email ? 'border-red-500' : ''}
                  />
                  {createForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{createForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter phone number"
                    {...createForm.register('phoneNumber')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                  <select
                    id="preferredContactMethod"
                    {...createForm.register('preferredContactMethod')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                      ring-offset-background focus-visible:ring-2 focus-visible:ring-ring
                      focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed
                      disabled:opacity-50"
                  >
                    <option value="">Select contact method</option>
                    {contactMethods.map((method) => (
                      <option key={method} value={method}>
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-base font-semibold">Address</Label>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="addressLine1">
                    Address Line 1 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="addressLine1"
                    placeholder="Enter address"
                    {...createForm.register('addressLine1')}
                    className={createForm.formState.errors.addressLine1 ? 'border-red-500' : ''}
                  />
                  {createForm.formState.errors.addressLine1 && (
                    <p className="text-sm text-red-500">{createForm.formState.errors.addressLine1.message}</p>
                  )}
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
                  <Label htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    {...createForm.register('city')}
                    className={createForm.formState.errors.city ? 'border-red-500' : ''}
                  />
                  {createForm.formState.errors.city && (
                    <p className="text-sm text-red-500">{createForm.formState.errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    placeholder="Enter state"
                    {...createForm.register('state')}
                    className={createForm.formState.errors.state ? 'border-red-500' : ''}
                  />
                  {createForm.formState.errors.state && (
                    <p className="text-sm text-red-500">{createForm.formState.errors.state.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">
                    Postal Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="postalCode"
                    placeholder="Enter postal code"
                    {...createForm.register('postalCode')}
                    className={createForm.formState.errors.postalCode ? 'border-red-500' : ''}
                  />
                  {createForm.formState.errors.postalCode && (
                    <p className="text-sm text-red-500">{createForm.formState.errors.postalCode.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    placeholder="Enter notes"
                    {...createForm.register('notes')}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2
                      text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2
                      focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none
                      disabled:cursor-not-allowed disabled:opacity-50"
                    rows={3}
                  />
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
                  {isSubmitting ? 'Creating...' : 'Create Customer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>Update the customer details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit(onSubmitUpdateCustomer)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-firstName"
                    placeholder="Enter first name"
                    {...editForm.register('firstName')}
                    className={editForm.formState.errors.firstName ? 'border-red-500' : ''}
                  />
                  {editForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500">{editForm.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-lastName"
                    placeholder="Enter last name"
                    {...editForm.register('lastName')}
                    className={editForm.formState.errors.lastName ? 'border-red-500' : ''}
                  />
                  {editForm.formState.errors.lastName && (
                    <p className="text-sm text-red-500">{editForm.formState.errors.lastName.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="Enter email address"
                    {...editForm.register('email')}
                    className={editForm.formState.errors.email ? 'border-red-500' : ''}
                  />
                  {editForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{editForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                  <Input
                    id="edit-phoneNumber"
                    type="tel"
                    placeholder="Enter phone number"
                    {...editForm.register('phoneNumber')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-preferredContactMethod">Preferred Contact Method</Label>
                  <select
                    id="edit-preferredContactMethod"
                    {...editForm.register('preferredContactMethod')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                      ring-offset-background focus-visible:ring-2 focus-visible:ring-ring
                      focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed
                      disabled:opacity-50"
                  >
                    <option value="">Select contact method</option>
                    {contactMethods.map((method) => (
                      <option key={method} value={method}>
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-base font-semibold">Address</Label>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-addressLine1">
                    Address Line 1 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-addressLine1"
                    placeholder="Enter address"
                    {...editForm.register('addressLine1')}
                    className={editForm.formState.errors.addressLine1 ? 'border-red-500' : ''}
                  />
                  {editForm.formState.errors.addressLine1 && (
                    <p className="text-sm text-red-500">{editForm.formState.errors.addressLine1.message}</p>
                  )}
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
                  <Label htmlFor="edit-city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-city"
                    placeholder="Enter city"
                    {...editForm.register('city')}
                    className={editForm.formState.errors.city ? 'border-red-500' : ''}
                  />
                  {editForm.formState.errors.city && (
                    <p className="text-sm text-red-500">{editForm.formState.errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-state">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-state"
                    placeholder="Enter state"
                    {...editForm.register('state')}
                    className={editForm.formState.errors.state ? 'border-red-500' : ''}
                  />
                  {editForm.formState.errors.state && (
                    <p className="text-sm text-red-500">{editForm.formState.errors.state.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-postalCode">
                    Postal Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-postalCode"
                    placeholder="Enter postal code"
                    {...editForm.register('postalCode')}
                    className={editForm.formState.errors.postalCode ? 'border-red-500' : ''}
                  />
                  {editForm.formState.errors.postalCode && (
                    <p className="text-sm text-red-500">{editForm.formState.errors.postalCode.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <textarea
                    id="edit-notes"
                    placeholder="Enter notes"
                    {...editForm.register('notes')}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2
                      text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2
                      focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none
                      disabled:cursor-not-allowed disabled:opacity-50"
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingCustomer(null);
                    editForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Customer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
