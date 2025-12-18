'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/(hooks)/useApi';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/(components)/shadcn/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { DescriptionCard } from './(components)/description-card';
import { JobDetailsCard } from './(components)/job-details-card';
import { ScopeOfWorkCard } from './(components)/scope-of-work-card';
import { ChangeOrdersCard } from './(components)/change-orders-card';
import { PaymentDrawsCard } from './(components)/payment-draws-card';
import { DocumentsCard } from './(components)/documents-card';
import { JobHeaderCard } from './(components)/job-header-card';
import { TimelineCard } from './(components)/timeline-card';
import { ChangeOrderModal } from './(components)/change-order-modal';
import { PaymentDrawModal } from './(components)/payment-draw-modal';
import { DocumentUploadModal } from './(components)/document-upload-modal';
import { DocumentViewerModal } from './(components)/document-viewer-modal';
import { JobDetailsUpdateModal } from './(components)/job-details-update-modal';
import {
  formatDateOnlyForInput,
  formatBudgetForInput,
  parseBudgetFromInput,
  getStatusColor,
  formatStatus,
} from './(components)/utils';
import type { Job, ScopeOfWork, ChangeOrder, PaymentDraw } from './(components)/types';

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
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  contractor: z.string().optional(),
});

const scopeOfWorkSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
});

const changeOrderSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
  status: z.enum(['created', 'paymentRequested', 'paid']),
});

const jobDetailsSchema = z.object({
  budget: z.string().optional(),
  estimatedStartDate: z.string().optional(),
  estimatedEndDate: z.string().optional(),
  actualStartDate: z.string().optional(),
  actualEndDate: z.string().optional(),
});

const jobDetailsUpdateSchema = z.object({
  description: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
  status: z.enum(['planned', 'in-progress', 'completed', 'cancelled', 'on-hold']),
  budget: z.string(),
});

const paymentDrawSchema = z.object({
  paymentAmount: z.string(),
  expectedPaymentDate: z.string().min(1, 'Expected payment date is required'),
  actualPaymentDate: z.string().optional().nullable(),
  dateRequested: z.string().optional().nullable(),
  status: z.enum(['future', 'requested', 'paid']).optional(),
  description: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
  customerNotified: z.boolean().optional(),
});

const documentUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  fileData: z.string().min(1, 'File data is required'),
  notes: z.string().optional().nullable(),
});

type AddressFormData = z.infer<typeof addressSchema>;
type DescriptionFormData = z.infer<typeof descriptionSchema>;
type ScopeOfWorkFormData = z.infer<typeof scopeOfWorkSchema>;
type ChangeOrderFormData = z.infer<typeof changeOrderSchema>;
type JobDetailsFormData = z.infer<typeof jobDetailsSchema>;
type PaymentDrawFormData = z.infer<typeof paymentDrawSchema>;

type ScopeOfWOrk = ScopeOfWork;

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
  const [isCreatePaymentDrawOpen, setIsCreatePaymentDrawOpen] = useState(false);
  const [editingPaymentDrawId, setEditingPaymentDrawId] = useState<string | null>(null);
  const [viewingPaymentDraw, setViewingPaymentDraw] = useState<PaymentDraw | null>(null);
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{
    clientUploadId: string;
    fileName: string;
    fileType: string;
    documentUrl: string;
    notes: string | null;
  } | null>(null);
  const [isJobDetailsUpdateOpen, setIsJobDetailsUpdateOpen] = useState(false);

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const descriptionForm = useForm<DescriptionFormData>({
    resolver: zodResolver(descriptionSchema),
  });

  const jobDetailsForm = useForm<JobDetailsFormData>({
    resolver: zodResolver(jobDetailsSchema),
  });

  const sowForm = useForm<ScopeOfWorkFormData>({
    resolver: zodResolver(scopeOfWorkSchema),
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
      status: 'created',
    },
  });

  const paymentDrawForm = useForm<PaymentDrawFormData>({
    resolver: zodResolver(paymentDrawSchema),
    defaultValues: {
      paymentAmount: '',
      expectedPaymentDate: '',
      actualPaymentDate: null,
      dateRequested: '',
      status: 'future',
      description: null,
      images: [],
      customerNotified: false,
    },
  });

  const documentForm = useForm<{
    fileName: string;
    fileType: string;
    fileData: string;
    notes?: string | null;
  }>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      fileName: '',
      fileType: '',
      fileData: '',
      notes: null,
    },
  });

  const jobDetailsUpdateForm = useForm<{
    description: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    status: 'planned' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold';
    budget: string;
  }>({
    resolver: zodResolver(jobDetailsUpdateSchema),
    defaultValues: {
      description: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      status: 'planned',
      budget: '',
    },
  });

  const { data: sowData, isLoading: isLoadingSOW } = useQuery({
    queryKey: ['scopeOfWork', jobId],
    queryFn: async () => {
      try {
        const response = await api.GET('/jobs/scopeofwork/{jobId}', {
          params: {
            path: {
              jobId: jobId,
            },
          },
        });
        return response.data?.responseObject?.scopeOfWork as ScopeOfWOrk | null;
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

  const { data: documentsData, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents', jobId],
    queryFn: async () => {
      try {
        const response = await api.GET('/jobs/clientuploads/{jobId}', {
          params: {
            path: {
              jobId: jobId,
            },
          },
        });
        return (response.data?.responseObject?.documents || []) as Array<{
          clientUploadId: string;
          jobId: string;
          s3Path: string;
          fileName: string;
          fileType: string;
          notes: string | null;
          createdAt: string;
          updatedAt: string;
          documentUrl: string;
        }>;
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

  // Fetch payment draws from the job object (they're included in the job response)
  const paymentDraws = (job as any)?.paymentDraws as PaymentDraw[] | undefined;

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
      lineItems: [{ description: '', price: '', startDate: '', endDate: '', contractor: '' }],
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
        startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
        endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
        contractor: item.contractor || '',
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
      status: 'created',
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
      status: changeOrder.status,
    });
  };

  const handleCloseChangeOrderModal = () => {
    setIsCreateChangeOrderOpen(false);
    setEditingChangeOrderId(null);
    changeOrderForm.reset();
  };

  const handleCreatePaymentDraw = () => {
    setIsCreatePaymentDrawOpen(true);
    setEditingPaymentDrawId(null);
    setViewingPaymentDraw(null);
    paymentDrawForm.reset({
      paymentAmount: '',
      expectedPaymentDate: '',
      actualPaymentDate: null,
      dateRequested: new Date().toISOString().split('T')[0],
      status: 'future',
      description: null,
      images: [],
      customerNotified: false,
    });
  };

  const handleViewPaymentDraw = (paymentDraw: PaymentDraw) => {
    setViewingPaymentDraw(paymentDraw);
    setIsCreatePaymentDrawOpen(true);
    setEditingPaymentDrawId(null);
    paymentDrawForm.reset({
      paymentAmount: paymentDraw.paymentAmount.toFixed(2),
      expectedPaymentDate: formatDateOnlyForInput(paymentDraw.expectedPaymentDate),
      actualPaymentDate: paymentDraw.actualPaymentDate
        ? formatDateOnlyForInput(paymentDraw.actualPaymentDate)
        : null,
      dateRequested: formatDateOnlyForInput(paymentDraw.dateRequested),
      status: paymentDraw.status,
      description: paymentDraw.description || null,
      images: paymentDraw.images || [],
      customerNotified: (paymentDraw as any).customerNotified || false,
    });
  };

  const handleEditPaymentDraw = (paymentDraw: PaymentDraw) => {
    setEditingPaymentDrawId(paymentDraw.paymentDrawId);
    setViewingPaymentDraw(null);
    setIsCreatePaymentDrawOpen(true);
    paymentDrawForm.reset({
      paymentAmount: paymentDraw.paymentAmount.toFixed(2),
      expectedPaymentDate: formatDateOnlyForInput(paymentDraw.expectedPaymentDate),
      actualPaymentDate: paymentDraw.actualPaymentDate
        ? formatDateOnlyForInput(paymentDraw.actualPaymentDate)
        : null,
      dateRequested: formatDateOnlyForInput(paymentDraw.dateRequested),
      status: paymentDraw.status,
      description: paymentDraw.description || null,
      images: paymentDraw.images || [],
      customerNotified: (paymentDraw as any).customerNotified || false,
    });
  };

  const handleClosePaymentDrawModal = (open: boolean) => {
    if (!open) {
      setIsCreatePaymentDrawOpen(false);
      setEditingPaymentDrawId(null);
      setViewingPaymentDraw(null);
      paymentDrawForm.reset();
    }
  };

  const onSubmitPaymentDraw = async (data: PaymentDrawFormData) => {
    setIsSubmitting(true);
    try {
      // Parse payment amount from string
      const cleaned = data.paymentAmount.replace(/[^0-9.-]/g, '');
      const paymentAmount = cleaned === '' ? 0 : parseFloat(cleaned) || 0;

      const body = {
        paymentAmount,
        expectedPaymentDate: new Date(data.expectedPaymentDate).toISOString(),
        actualPaymentDate: data.actualPaymentDate ? new Date(data.actualPaymentDate).toISOString() : null,
        dateRequested: data.dateRequested ? new Date(data.dateRequested).toISOString() : null,
        status: data.status,
        description: data.description || null,
        images: data.images || [],
        customerNotified: data.customerNotified || false,
      };

      const currentJob = jobsData?.find((j) => j.jobId === jobId);
      if (!currentJob) {
        throw new Error('Job not found');
      }

      if (editingPaymentDrawId) {
        await api.PATCH('/jobs/paymentdraws/:paymentDrawId/{jobId}/{paymentDrawId}', {
          params: {
            path: {
              jobId: currentJob.jobId,
              paymentDrawId: editingPaymentDrawId,
            },
          },
          body: body as any,
        });
      } else {
        await api.PUT('/jobs/paymentdraws/{jobId}', {
          params: {
            path: {
              jobId: currentJob.jobId,
            },
          },
          body: body as any,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      handleClosePaymentDrawModal(false);
    } catch (error) {
      console.error('Payment draw submit error:', error);
      alert('Failed to save payment draw. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            status: data.status,
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
            status: data.status,
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

  const onSubmitSOW = async (data: ScopeOfWorkFormData) => {
    setIsSubmitting(true);
    try {
      const formatDateToISO = (dateStr: string | undefined) => {
        if (!dateStr || dateStr === '') return null;
        return new Date(dateStr + 'T00:00:00').toISOString();
      };

      const lineItems = data.lineItems.map((item) => ({
        description: item.description,
        price: item.price ? parseFloat(item.price) : null,
        startDate: formatDateToISO(item.startDate),
        endDate: formatDateToISO(item.endDate),
        contractor: item.contractor || null,
      }));

      if (isCreatingSOW) {
        await api.POST('/jobs/scopeofwork/{jobId}', {
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
        await api.PATCH('/jobs/scopeofwork/{jobId}', {
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
      queryClient.invalidateQueries({ queryKey: ['scopeOfWork', jobId] });
      setIsCreatingSOW(false);
      setIsEditingSOW(false);
    } catch (error) {
      console.error('Update scope of work error:', error);
      alert('Failed to save scope of work. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadDocument = () => {
    setIsDocumentUploadOpen(true);
    setSelectedFile(null);
    documentForm.reset({
      fileName: '',
      fileType: '',
      fileData: '',
      notes: null,
    });
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleCloseDocumentModal = () => {
    setIsDocumentUploadOpen(false);
    setSelectedFile(null);
    documentForm.reset();
  };

  const onSubmitDocument = async (data: {
    fileName: string;
    fileType: string;
    fileData: string;
    notes?: string | null;
  }) => {
    setIsSubmitting(true);
    try {
      await api.PUT('/jobs/clientuploads/{jobId}', {
        params: {
          path: {
            jobId: job.jobId,
          },
        },
        body: {
          fileName: data.fileName,
          fileType: data.fileType,
          fileData: data.fileData,
          notes: data.notes || null,
        } as any,
      });
      queryClient.invalidateQueries({ queryKey: ['documents', jobId] });
      handleCloseDocumentModal();
    } catch (error) {
      console.error('Upload document error:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (clientUploadId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }
    setIsSubmitting(true);
    try {
      await api.DELETE('/jobs/clientuploads/{jobId}/{clientUploadId}', {
        params: {
          path: {
            jobId: job.jobId,
            clientUploadId: clientUploadId,
          },
        },
      });
      queryClient.invalidateQueries({ queryKey: ['documents', jobId] });
    } catch (error) {
      console.error('Delete document error:', error);
      alert('Failed to delete document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadDocument = (documentUrl: string, fileName: string) => {
    window.open(documentUrl, '_blank');
  };

  const handleViewDocument = (document: {
    clientUploadId: string;
    fileName: string;
    fileType: string;
    documentUrl: string;
    notes: string | null;
  }) => {
    setViewingDocument(document);
  };

  const handleCloseDocumentViewer = () => {
    setViewingDocument(null);
  };

  const handleUpdateJobDetails = () => {
    setIsJobDetailsUpdateOpen(true);
    jobDetailsUpdateForm.reset({
      description: job.description || '',
      addressLine1: job.addressLine1 || '',
      addressLine2: job.addressLine2 || '',
      city: job.city || '',
      state: job.state || '',
      postalCode: job.postalCode || '',
      country: job.country || '',
      status: job.status,
      budget: formatBudgetForInput(job.budget),
    });
  };

  const handleCloseJobDetailsUpdate = () => {
    setIsJobDetailsUpdateOpen(false);
    jobDetailsUpdateForm.reset();
  };

  const onSubmitJobDetailsUpdate = async (data: {
    description: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    status: 'planned' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold';
    budget: string;
  }) => {
    setIsSubmitting(true);
    try {
      const budgetValue = data.budget ? parseBudgetFromInput(data.budget) : null;
      await api.PATCH('/jobs/{jobId}', {
        params: {
          path: {
            jobId: job.jobId,
          },
        },
        body: {
          description: data.description || null,
          addressLine1: data.addressLine1 || null,
          addressLine2: data.addressLine2 || null,
          city: data.city || null,
          state: data.state || null,
          postalCode: data.postalCode || null,
          country: data.country || null,
          status: data.status,
          budget: budgetValue,
        } as any,
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      handleCloseJobDetailsUpdate();
    } catch (error) {
      console.error('Update job details error:', error);
      alert('Failed to update job details. Please try again.');
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
          budget: data.budget ? parseBudgetFromInput(data.budget) : null,
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
      </div>

      <JobHeaderCard
        job={job}
        onCreateChangeOrder={handleCreateChangeOrder}
        onUploadDocument={handleUploadDocument}
        onUpdateJobDetails={handleUpdateJobDetails}
      />

      <div className="flex flex-wrap gap-6">
        <DescriptionCard
          job={job}
          editingSection={editingSection}
          isSubmitting={isSubmitting}
          descriptionForm={descriptionForm}
          onEdit={handleEditDescription}
          onCancel={handleCancel}
          onSubmit={onSubmitDescription}
        />

        <JobDetailsCard
          job={job}
          editingSection={editingSection}
          isSubmitting={isSubmitting}
          jobDetailsForm={jobDetailsForm}
          onEdit={handleEditDetails}
          onCancel={handleCancel}
          onSubmit={onSubmitDetails}
        />
      </div>

      <TimelineCard
        sowData={sowData}
        changeOrders={changeOrdersData}
        paymentDraws={paymentDraws}
        isLoading={isLoadingSOW || isLoadingChangeOrders}
      />

      <ScopeOfWorkCard
        isLoading={isLoadingSOW}
        sowData={sowData}
        isCreating={isCreatingSOW}
        isEditing={isEditingSOW}
        isSubmitting={isSubmitting}
        sowForm={sowForm}
        onCreate={handleCreateSOW}
        onEdit={handleEditSOW}
        onCancel={handleCancelSOW}
        onSubmit={onSubmitSOW}
      />

      <ChangeOrdersCard
        isLoading={isLoadingChangeOrders}
        changeOrders={changeOrdersData}
        onEdit={handleEditChangeOrder}
      />

      <PaymentDrawsCard
        paymentDraws={paymentDraws}
        onView={handleViewPaymentDraw}
        onEdit={handleEditPaymentDraw}
        onCreate={handleCreatePaymentDraw}
      />

      <DocumentsCard
        isLoading={isLoadingDocuments}
        documents={documentsData}
        onUpload={handleUploadDocument}
        onDelete={handleDeleteDocument}
        onDownload={handleDownloadDocument}
        onView={handleViewDocument}
      />

      <ChangeOrderModal
        open={isCreateChangeOrderOpen}
        onOpenChange={handleCloseChangeOrderModal}
        isEditing={!!editingChangeOrderId}
        isSubmitting={isSubmitting}
        changeOrderForm={changeOrderForm}
        onSubmit={onSubmitChangeOrder}
      />

      <PaymentDrawModal
        open={isCreatePaymentDrawOpen}
        onOpenChange={handleClosePaymentDrawModal}
        isEditing={!!editingPaymentDrawId}
        isViewing={!!viewingPaymentDraw}
        viewingPaymentDraw={viewingPaymentDraw}
        isSubmitting={isSubmitting}
        paymentDrawForm={paymentDrawForm}
        onSubmit={onSubmitPaymentDraw}
        onEdit={() => {
          if (viewingPaymentDraw) {
            handleEditPaymentDraw(viewingPaymentDraw);
          }
        }}
      />

      <DocumentUploadModal
        open={isDocumentUploadOpen}
        onOpenChange={handleCloseDocumentModal}
        isSubmitting={isSubmitting}
        documentForm={documentForm}
        onSubmit={onSubmitDocument}
        onFileSelect={handleFileSelect}
        selectedFile={selectedFile}
      />

      <DocumentViewerModal
        open={!!viewingDocument}
        onOpenChange={handleCloseDocumentViewer}
        document={viewingDocument}
        onDownload={handleDownloadDocument}
      />

      <JobDetailsUpdateModal
        open={isJobDetailsUpdateOpen}
        onOpenChange={handleCloseJobDetailsUpdate}
        isSubmitting={isSubmitting}
        jobDetailsForm={jobDetailsUpdateForm}
        onSubmit={onSubmitJobDetailsUpdate}
      />
    </div>
  );
}
