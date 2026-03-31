import { paths } from '../../../../apiDocs';

export type Job =
  paths['/jobs']['get']['responses']['200']['content']['application/json']['responseObject']['jobs'][number];

export type JobForPdf = Pick<Job, 'title' | 'description' | 'customer' | 'addressLine1' | 'addressLine2' | 'city' | 'state' | 'postalCode' | 'estimatedStartDate' | 'estimatedEndDate'>;

export type ScopeOfWork =
  paths['/jobs/scopeofwork/{jobId}']['get']['responses']['200']['content']['application/json']['responseObject']['scopeOfWork'];

export type LineItemRow = NonNullable<ScopeOfWork>['lineItems'][number];

export type ChangeOrder =
  paths['/jobs/changeorders/{jobId}']['get']['responses']['200']['content']['application/json']['responseObject']['changeOrders'][number];

export type PaymentDraw =
  paths['/jobs']['get']['responses']['200']['content']['application/json']['responseObject']['jobs'][number]['paymentDraws'][number];
