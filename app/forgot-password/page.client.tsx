'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/(components)/shadcn/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Input } from '@/(components)/shadcn/ui/input';
import { Label } from '@/(components)/shadcn/ui/label';
import { useApi } from '@/(hooks)/useApi';
import LoggedOutHeader from '@/(components)/layout/logged-out-header';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordClient() {
  const { api } = useApi();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await api.GET('/forgot-password' as any, { params: { query: { email: data.email } } } as any);
      setSubmitted(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <LoggedOutHeader />
      <div
        className="flex min-h-[calc(100vh-81px)] items-center justify-center bg-gradient-to-br from-slate-50
          to-slate-100 p-4"
      >
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Forgot your password?</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-4">
                <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-800">
                  Check your email for a link to reset your password. If it doesn't appear within a few
                  minutes, check your spam folder.
                </div>
                <div className="text-center text-sm text-slate-600">
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Back to sign in
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errorMessage && (
                  <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{errorMessage}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    autoFocus
                    {...register('email')}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send reset link'}
                </Button>

                <div className="text-center text-sm text-slate-600">
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
