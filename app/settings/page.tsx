'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { useMe } from '@/(hooks)/useMe';
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
import { Input } from '@/(components)/shadcn/ui/input';
import { Label } from '@/(components)/shadcn/ui/label';
import { Banner, BannerClose, BannerTitle } from '@/(components)/shadcn/ui/banner';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/(components)/layout/page-header';

const contractorTypes = [
  'general',
  'painter',
  'plumber',
  'electrician',
  'carpenter',
  'mason',
  'landscaper',
  'handyman',
  'drywaller',
  'framer',
  'tileSetter',
  'roofer',
  'sidingInstaller',
  'windowInstaller',
  'doorInstaller',
  'other',
] as const;

const contactMethods = ['email', 'phone', 'sms', 'whatsapp'] as const;
const roles = ['admin', 'standard', 'view-only'] as const;

const personalInfoSchema = z.object({
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
});

const contactInfoSchema = z.object({
  phoneNumber: z.string().nullable(),
  preferredContactMethod: z.enum(contactMethods).nullable(),
});

const professionalInfoSchema = z.object({
  contractorType: z.enum(contractorTypes).nullable(),
  role: z.enum(roles).nullable(),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
type ContactInfoFormData = z.infer<typeof contactInfoSchema>;
type ProfessionalInfoFormData = z.infer<typeof professionalInfoSchema>;

export default function SettingsPage() {
  const { me, setClient, clientRefresh } = useMe();
  const { api } = useApi();
  const [isSubmittingPersonal, setIsSubmittingPersonal] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [isSubmittingProfessional, setIsSubmittingProfessional] = useState(false);
  const [successMessagePersonal, setSuccessMessagePersonal] = useState<string | null>(null);
  const [successMessageContact, setSuccessMessageContact] = useState<string | null>(null);
  const [successMessageProfessional, setSuccessMessageProfessional] = useState<string | null>(null);
  const [errorMessagePersonal, setErrorMessagePersonal] = useState<string | null>(null);
  const [errorMessageContact, setErrorMessageContact] = useState<string | null>(null);
  const [errorMessageProfessional, setErrorMessageProfessional] = useState<string | null>(null);
  const [isSendingVerificationCode, setIsSendingVerificationCode] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const user = me?.user;

  // Personal Information Form
  const personalForm = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: user?.firstName ?? undefined,
      lastName: user?.lastName ?? undefined,
    },
  });

  // Contact Information Form
  const contactForm = useForm<ContactInfoFormData>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      phoneNumber: user?.phoneNumber ?? undefined,
      preferredContactMethod: (user?.preferredContactMethod as any) ?? undefined,
    },
  });

  // Professional Information Form
  const professionalForm = useForm<ProfessionalInfoFormData>({
    resolver: zodResolver(professionalInfoSchema),
    defaultValues: {
      contractorType: (user?.contractorType as any) ?? undefined,
      role: (user?.role as any) ?? undefined,
    },
  });

  const onSubmitPersonal = async (data: PersonalInfoFormData) => {
    setIsSubmittingPersonal(true);
    setSuccessMessagePersonal(null);
    setErrorMessagePersonal(null);
    try {
      const response = await api.PATCH('/me', {
        body: {
          firstName: data.firstName ?? undefined,
          lastName: data.lastName ?? undefined,
        },
      });
      console.log('Update response:', response);
      setSuccessMessagePersonal('Personal information updated successfully!');
      // Update the local cache
      const updatedUser = {
        ...user!,
        firstName: data.firstName ?? user!.firstName,
        lastName: data.lastName ?? user!.lastName,
      };
      setClient({
        user: updatedUser as any,
      });
      // Refresh from server
      await clientRefresh();
      // Reset form to mark as not dirty
      personalForm.reset(data);
    } catch (error) {
      console.error('Update error:', error);
      setErrorMessagePersonal('Failed to update personal information. Please try again.');
    } finally {
      setIsSubmittingPersonal(false);
    }
  };

  const onSubmitContact = async (data: ContactInfoFormData) => {
    setIsSubmittingContact(true);
    setSuccessMessageContact(null);
    setErrorMessageContact(null);
    try {
      const response = await api.PATCH('/me', {
        body: {
          phoneNumber: data.phoneNumber ?? undefined,
          preferredContactMethod: data.preferredContactMethod ?? undefined,
        },
      });
      console.log('Update response:', response);
      setSuccessMessageContact('Contact information updated successfully!');
      // Update the local cache
      const updatedUser = {
        ...user!,
        phoneNumber: data.phoneNumber ?? user!.phoneNumber,
        preferredContactMethod: data.preferredContactMethod ?? user!.preferredContactMethod,
      };
      setClient({
        user: updatedUser as any,
      });
      // Refresh from server
      await clientRefresh();
      // Reset form to mark as not dirty
      contactForm.reset(data);
    } catch (error) {
      console.error('Update error:', error);
      setErrorMessageContact('Failed to update contact information. Please try again.');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const onSubmitProfessional = async (data: ProfessionalInfoFormData) => {
    setIsSubmittingProfessional(true);
    setSuccessMessageProfessional(null);
    setErrorMessageProfessional(null);
    try {
      const response = await api.PATCH('/me', {
        body: {
          contractorType: data.contractorType ?? undefined,
        },
      });
      console.log('Update response:', response);
      setSuccessMessageProfessional('Professional information updated successfully!');
      // Update the local cache
      const updatedUser = {
        ...user!,
        contractorType: data.contractorType ?? user!.contractorType,
        role: data.role ?? user!.role,
      };
      setClient({
        user: updatedUser as any,
      });
      // Refresh from server
      await clientRefresh();
      // Reset form to mark as not dirty
      professionalForm.reset(data);
    } catch (error) {
      console.error('Update error:', error);
      setErrorMessageProfessional('Failed to update professional information. Please try again.');
    } finally {
      setIsSubmittingProfessional(false);
    }
  };

  const handleSendVerificationCode = async () => {
    setIsSendingVerificationCode(true);
    setVerificationMessage(null);
    setVerificationError(null);
    try {
      const response = await api.POST('/me/send-verify-email', {});
      console.log('Send verification code response:', response);
      setVerificationMessage('Verification code sent to your email!');
      setShowVerificationInput(true);
    } catch (error) {
      console.error('Send verification code error:', error);
      setVerificationError('Failed to send verification code. Please try again.');
    } finally {
      setIsSendingVerificationCode(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode.trim()) {
      setVerificationError('Please enter the verification code');
      return;
    }
    setIsVerifyingEmail(true);
    setVerificationMessage(null);
    setVerificationError(null);
    try {
      const response = await api.POST('/me/verify', {
        body: {
          type: 'verify_email',
          otp: verificationCode,
        },
      });
      console.log('Verify email response:', response);
      setVerificationMessage('Email verified successfully!');
      setVerificationCode('');
      setShowVerificationInput(false);
      // Refresh from server to get updated emailVerified status
      await clientRefresh();
    } catch (error) {
      console.error('Verify email error:', error);
      setVerificationError('Failed to verify email. Please check the code and try again.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account settings and preferences" />
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-stretch gap-6">
          {/* Personal Information Form */}
          <form
            onSubmit={personalForm.handleSubmit(onSubmitPersonal)}
            className="flex w-full max-w-[550px] flex-col"
          >
            <Card className="flex flex-1 flex-col">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {successMessagePersonal && (
                  <Banner variant="success" onClose={() => setSuccessMessagePersonal(null)}>
                    <BannerTitle>{successMessagePersonal}</BannerTitle>
                    <BannerClose />
                  </Banner>
                )}
                {errorMessagePersonal && (
                  <Banner variant="error" onClose={() => setErrorMessagePersonal(null)}>
                    <BannerTitle>{errorMessagePersonal}</BannerTitle>
                    <BannerClose />
                  </Banner>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="userId">User ID</Label>
                    <Input id="userId" value={user.userId} disabled className="bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referralCode">Referral Code</Label>
                    <Input id="referralCode" value={user.referralCode} disabled className="bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name {!user.firstName && <span className="text-red-500">(Missing)</span>}
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      {...personalForm.register('firstName', { setValueAs: (v) => (v === '' ? null : v) })}
                      defaultValue={user.firstName ?? ''}
                      className={personalForm.formState.errors.firstName ? 'border-red-500' : ''}
                    />
                    {personalForm.formState.errors.firstName && (
                      <p className="text-sm text-red-500">
                        {personalForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name {!user.lastName && <span className="text-red-500">(Missing)</span>}
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      {...personalForm.register('lastName', { setValueAs: (v) => (v === '' ? null : v) })}
                      defaultValue={user.lastName ?? ''}
                      className={personalForm.formState.errors.lastName ? 'border-red-500' : ''}
                    />
                    {personalForm.formState.errors.lastName && (
                      <p className="text-sm text-red-500">{personalForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSubmittingPersonal || !personalForm.formState.isDirty}>
                  {isSubmittingPersonal ? 'Saving...' : 'Save Personal Information'}
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Contact Information Form */}
          <form
            onSubmit={contactForm.handleSubmit(onSubmitContact)}
            className="flex w-full max-w-[550px] flex-col"
          >
            <Card className="flex flex-1 flex-col">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Your contact details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {successMessageContact && (
                  <Banner variant="success" onClose={() => setSuccessMessageContact(null)}>
                    <BannerTitle>{successMessageContact}</BannerTitle>
                    <BannerClose />
                  </Banner>
                )}
                {errorMessageContact && (
                  <Banner variant="error" onClose={() => setErrorMessageContact(null)}>
                    <BannerTitle>{errorMessageContact}</BannerTitle>
                    <BannerClose />
                  </Banner>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email{' '}
                      {!user.emailVerified && <span className="text-red-500"> - Verification Required</span>}
                    </Label>
                    <Input id="email" value={user.email} disabled className="bg-slate-100" />
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-500">
                        Email Verified: {user.emailVerified ? 'Yes' : 'No'}
                      </p>
                      {!user.emailVerified && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSendVerificationCode}
                          disabled={isSendingVerificationCode}
                          className="h-7 text-xs"
                        >
                          {isSendingVerificationCode ? 'Sending...' : 'Send Verification Code'}
                        </Button>
                      )}
                    </div>
                    {showVerificationInput && !user.emailVerified && (
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Enter verification code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="flex-1"
                            maxLength={6}
                          />
                          <Button
                            type="button"
                            onClick={handleVerifyEmail}
                            disabled={isVerifyingEmail || !verificationCode.trim()}
                            size="sm"
                          >
                            {isVerifyingEmail ? 'Verifying...' : 'Verify'}
                          </Button>
                        </div>
                        {verificationMessage && (
                          <Banner variant="success" onClose={() => setVerificationMessage(null)} inset>
                            <BannerTitle>{verificationMessage}</BannerTitle>
                            <BannerClose />
                          </Banner>
                        )}
                        {verificationError && (
                          <Banner variant="error" onClose={() => setVerificationError(null)} inset>
                            <BannerTitle>{verificationError}</BannerTitle>
                            <BannerClose />
                          </Banner>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">
                      Phone Number {!user.phoneNumber && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="Enter your phone number"
                      {...contactForm.register('phoneNumber', { setValueAs: (v) => (v === '' ? null : v) })}
                      defaultValue={user.phoneNumber ?? ''}
                      className={contactForm.formState.errors.phoneNumber ? 'border-red-500' : ''}
                    />
                    {contactForm.formState.errors.phoneNumber && (
                      <p className="text-sm text-red-500">
                        {contactForm.formState.errors.phoneNumber.message}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Phone Verified: {user.phoneVerified ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredContactMethod">
                      Preferred Contact Method{' '}
                      {!user.preferredContactMethod && <span className="text-red-500">(Missing)</span>}
                    </Label>
                    <select
                      id="preferredContactMethod"
                      {...contactForm.register('preferredContactMethod', {
                        setValueAs: (v) => (v === '' ? null : v),
                      })}
                      defaultValue={user.preferredContactMethod ?? ''}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2
                        text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring
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
                    {contactForm.formState.errors.preferredContactMethod && (
                      <p className="text-sm text-red-500">
                        {contactForm.formState.errors.preferredContactMethod.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSubmittingContact || !contactForm.formState.isDirty}>
                  {isSubmittingContact ? 'Saving...' : 'Save Contact Information'}
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Professional Information Form */}
          <form
            onSubmit={professionalForm.handleSubmit(onSubmitProfessional)}
            className="flex w-full max-w-[550px] flex-col"
          >
            <Card className="flex flex-1 flex-col">
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>Your contractor type and role</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {successMessageProfessional && (
                  <Banner variant="success" onClose={() => setSuccessMessageProfessional(null)}>
                    <BannerTitle>{successMessageProfessional}</BannerTitle>
                    <BannerClose />
                  </Banner>
                )}
                {errorMessageProfessional && (
                  <Banner variant="error" onClose={() => setErrorMessageProfessional(null)}>
                    <BannerTitle>{errorMessageProfessional}</BannerTitle>
                    <BannerClose />
                  </Banner>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contractorType">
                      Contractor Type{' '}
                      {!user.contractorType && <span className="text-red-500">(Missing)</span>}
                    </Label>
                    <select
                      id="contractorType"
                      {...professionalForm.register('contractorType', {
                        setValueAs: (v) => (v === '' ? null : v),
                      })}
                      defaultValue={user.contractorType ?? ''}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2
                        text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring
                        focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed
                        disabled:opacity-50"
                    >
                      <option value="">Select contractor type</option>
                      {contractorTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
                        </option>
                      ))}
                    </select>
                    {professionalForm.formState.errors.contractorType && (
                      <p className="text-sm text-red-500">
                        {professionalForm.formState.errors.contractorType.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">
                      Role {!user.role && <span className="text-red-500">(Missing)</span>}
                    </Label>
                    <select
                      id="role"
                      {...professionalForm.register('role', { setValueAs: (v) => (v === '' ? null : v) })}
                      defaultValue={user.role ?? ''}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2
                        text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring
                        focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed
                        disabled:opacity-50"
                    >
                      <option value="">Select role</option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1).replace(/-/g, ' ')}
                        </option>
                      ))}
                    </select>
                    {professionalForm.formState.errors.role && (
                      <p className="text-sm text-red-500">{professionalForm.formState.errors.role.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmittingProfessional || !professionalForm.formState.isDirty}
                >
                  {isSubmittingProfessional ? 'Saving...' : 'Save Professional Information'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </>
  );
}
