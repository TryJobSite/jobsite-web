'use client';

import { Button } from '@/(components)/shadcn/ui/button';
import { FileText, Upload, Settings } from 'lucide-react';
import { Job } from './types';

type JobHeaderCardProps = {
  job: Job;
  onCreateChangeOrder: () => void;
  onUploadDocument: () => void;
  onUpdateJobDetails: () => void;
};

export function JobHeaderCard({
  job,
  onCreateChangeOrder,
  onUploadDocument,
  onUpdateJobDetails,
}: JobHeaderCardProps) {
  const customerName = job.customer
    ? `${job.customer.firstName} ${job.customer.lastName}`
    : 'Unknown Customer';

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-slate-900">{customerName}</h2>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onCreateChangeOrder}>
          <FileText className="mr-2 h-4 w-4" />
          Create Change Order
        </Button>
        <Button size="sm" variant="outline" onClick={onUploadDocument}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
        <Button size="sm" variant="outline" onClick={onUpdateJobDetails}>
          <Settings className="mr-2 h-4 w-4" />
          Update Job Details
        </Button>
      </div>
    </div>
  );
}
