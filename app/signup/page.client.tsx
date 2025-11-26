'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/(components)/shadcn/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Input } from '@/(components)/shadcn/ui/input';
import { Label } from '@/(components)/shadcn/ui/label';
import { useEffect, useState } from 'react';
import { useApi } from '@/(hooks)/useApi';
import { useMe } from '@/(hooks)/useMe';
import useAppRouter from '@/(hooks)/useAppRouter';

const signupSchema = z
  .object({
    companyName: z.string().min(1, 'Company name is required'),
    userEmail: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
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

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { me } = useMe();
  const router = useAppRouter();
  useEffect(() => {
    if (me) {
      router.replace('/home');
    }
  }, [me]);
  const { api } = useApi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async () => {
    const data = getValues();
    setIsSubmitting(true);
    try {
      const response = await api.POST('/signup', {
        body: data,
      });
      console.log('Signup response:', response);
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-[calc(100vh-81px)] items-center justify-center bg-gradient-to-br from-slate-50
        to-slate-100 p-4"
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create your account with Job Site</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Construction"
                {...register('companyName')}
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && <p className="text-sm text-red-500">{errors.companyName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail">Your Email</Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="name@company.com"
                {...register('userEmail')}
                className={errors.userEmail ? 'border-red-500' : ''}
              />
              {errors.userEmail && <p className="text-sm text-red-500">{errors.userEmail.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              <p className="text-xs text-slate-500">
                Must be at least 6 characters with uppercase, lowercase, and a number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting} onClick={onSubmit}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
