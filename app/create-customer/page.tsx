'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/(hooks)/useApi';
import { Button } from '@/(components)/shadcn/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Input } from '@/(components)/shadcn/ui/input';
import { Label } from '@/(components)/shadcn/ui/label';

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

export default function CreateCustomerPage() {
  const { api } = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const onSubmit = async (data: CustomerFormData) => {
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
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      // Redirect to customers page after successful creation
      router.push('/customers');
    } catch (error) {
      console.error('Create customer error:', error);
      alert('Failed to create customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Create New Customer</CardTitle>
        <CardDescription>Fill in the details to create your first customer.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                {...form.register('firstName')}
                className={form.formState.errors.firstName ? 'border-red-500' : ''}
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                {...form.register('lastName')}
                className={form.formState.errors.lastName ? 'border-red-500' : ''}
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
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
                {...form.register('email')}
                className={form.formState.errors.email ? 'border-red-500' : ''}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter phone number"
                {...form.register('phoneNumber')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
              <select
                id="preferredContactMethod"
                {...form.register('preferredContactMethod')}
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
                {...form.register('addressLine1')}
                className={form.formState.errors.addressLine1 ? 'border-red-500' : ''}
              />
              {form.formState.errors.addressLine1 && (
                <p className="text-sm text-red-500">{form.formState.errors.addressLine1.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                placeholder="Enter address line 2"
                {...form.register('addressLine2')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                placeholder="Enter city"
                {...form.register('city')}
                className={form.formState.errors.city ? 'border-red-500' : ''}
              />
              {form.formState.errors.city && (
                <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">
                State <span className="text-red-500">*</span>
              </Label>
              <Input
                id="state"
                placeholder="Enter state"
                {...form.register('state')}
                className={form.formState.errors.state ? 'border-red-500' : ''}
              />
              {form.formState.errors.state && (
                <p className="text-sm text-red-500">{form.formState.errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">
                Postal Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="postalCode"
                placeholder="Enter postal code"
                {...form.register('postalCode')}
                className={form.formState.errors.postalCode ? 'border-red-500' : ''}
              />
              {form.formState.errors.postalCode && (
                <p className="text-sm text-red-500">{form.formState.errors.postalCode.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                placeholder="Enter notes"
                {...form.register('notes')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2
                  text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2
                  focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none
                  disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
