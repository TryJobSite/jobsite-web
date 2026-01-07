'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/(components)/shadcn/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Input } from '@/(components)/shadcn/ui/input';
import { Label } from '@/(components)/shadcn/ui/label';
import { useApi } from '@/(hooks)/useApi';
import useAppRouter from '@/(hooks)/useAppRouter';
import LoggedOutHeader from '@/(components)/layout/logged-out-header';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

const verifyEmailSchema = z.object({
  verificationCode: z.string().min(1, 'Verification code is required').length(6, 'Code must be 6 digits'),
});

type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

export default function VerifyEmailPage() {
  const { api } = useApi();
  const router = useAppRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
  });

  const onSubmit = async (data: VerifyEmailFormData) => {
    setIsSubmitting(true);
    setVerificationMessage(null);
    setVerificationError(null);
    try {
      const response = await api.POST('/me/verify', {
        body: {
          type: 'verify_email',
          otp: data.verificationCode,
        },
      });
      if (response?.data?.success) {
        setVerificationMessage('Email verified successfully!');
        setIsVerified(true);
        // Redirect to create customer page after a short delay
        setTimeout(() => {
          router.push('/create-customer');
        }, 2000);
      } else {
        setVerificationError('Verification failed. Please check the code and try again.');
      }
    } catch (error: any) {
      console.error('Verify email error:', error);
      setVerificationError(error?.message || 'Failed to verify email. Please check the code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setVerificationMessage(null);
    setVerificationError(null);
    try {
      const response = await api.POST('/me/send-verify-email', {});
      if (response?.data?.success) {
        setVerificationMessage('Verification code sent! Please check your email.');
      } else {
        setVerificationError('Failed to resend verification code. Please try again.');
      }
    } catch (error: any) {
      console.error('Resend verification code error:', error);
      setVerificationError('Failed to resend verification code. Please try again.');
    } finally {
      setIsResending(false);
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
          <CardHeader className="space-y-1 text-center">
            {isVerified ? (
              <>
                <div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full
                    bg-emerald-100"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
                <CardDescription>
                  Your email has been successfully verified. Redirecting to create your first customer...
                </CardDescription>
              </>
            ) : (
              <>
                <div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"
                >
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
                <CardDescription>
                  We've sent a verification code to your email address. Please enter it below to verify your
                  account.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {isVerified ? (
              <div className="text-center">
                <p className="text-slate-600">You will be redirected to the home page shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {verificationMessage && (
                  <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                    {verificationMessage}
                  </div>
                )}
                {verificationError && (
                  <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{verificationError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    {...register('verificationCode', {
                      onChange: (e) => {
                        // Only allow numbers
                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                      },
                    })}
                    className={errors.verificationCode ? 'border-red-500' : ''}
                    autoFocus
                  />
                  {errors.verificationCode && (
                    <p className="text-sm text-red-500">{errors.verificationCode.message}</p>
                  )}
                  <p className="text-xs text-slate-500">Enter the 6-digit code sent to your email address</p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Verifying...' : 'Verify Email'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Didn't receive the code?</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResendCode}
                  disabled={isResending}
                >
                  {isResending ? 'Sending...' : 'Resend Verification Code'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
