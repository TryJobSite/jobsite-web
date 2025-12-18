import { paths } from '../../../../apiDocs';

export type Job = {
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
  customer?: {
    customerId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  paymentDraws?: PaymentDraw[];
};

export type ScopeOfWork =
  paths['/jobs/scopeofwork/{jobId}']['get']['responses']['200']['content']['application/json']['responseObject']['scopeOfWork'];

export type ChangeOrder =
  paths['/jobs/changeorders/{jobId}']['get']['responses']['200']['content']['application/json']['responseObject']['changeOrders'][number];

export type PaymentDraw =
  paths['/jobs']['get']['responses']['200']['content']['application/json']['responseObject']['jobs'][number]['paymentDraws'][number];
