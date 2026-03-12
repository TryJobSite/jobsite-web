'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/(components)/shadcn/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Input } from '@/(components)/shadcn/ui/input';
import { Label } from '@/(components)/shadcn/ui/label';
import { useApi } from '@/(hooks)/useApi';
import useAppRouter from '@/(hooks)/useAppRouter';
import LoggedOutHeader from '@/(components)/layout/logged-out-header';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const { api } = useApi();
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await api.POST('/forgot-password', {
        body: { token, newPassword: data.password } as any,
      });
      router.push('/login');
    } catch (error) {
      console.error('Reset password error:', error);
      setErrorMessage('Failed to reset password. Your link may have expired. Please request a new one.');
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
            <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          </CardHeader>
          <CardContent>
            {!token && (
              <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
                Invalid or missing reset token. Please use the link from your email.
              </div>
            )}
            {errorMessage && (
              <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{errorMessage}</div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your new password"
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                <p className="text-xs text-slate-500">
                  Must be at least 6 characters with uppercase, lowercase, and a number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function ResetPasswordClient() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
