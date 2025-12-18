'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Button } from '@/(components)/shadcn/ui/button';
import { Input } from '@/(components)/shadcn/ui/input';
import { Label } from '@/(components)/shadcn/ui/label';
import { UseFormReturn } from 'react-hook-form';
import { Job } from './types';
import { formatCurrency, formatDate, parseBudgetFromInput } from './utils';

type JobDetailsFormData = {
  budget?: string;
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
};

type JobDetailsCardProps = {
  job: Job;
  editingSection: 'address' | 'description' | 'details' | null;
  isSubmitting: boolean;
  jobDetailsForm: UseFormReturn<JobDetailsFormData>;
  onEdit: () => void;
  onCancel: () => void;
  onSubmit: (data: JobDetailsFormData) => Promise<void>;
};

export function JobDetailsCard({
  job,
  editingSection,
  isSubmitting,
  jobDetailsForm,
  onEdit,
  onCancel,
  onSubmit,
}: JobDetailsCardProps) {
  return (
    <Card className={`min-w-[400px] flex-1 ${editingSection === 'details' ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Job Details</CardTitle>
          {editingSection === 'details' ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={jobDetailsForm.handleSubmit(onSubmit)}
                disabled={!jobDetailsForm.formState.isDirty || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-6">
        {editingSection === 'details' ? (
          <form onSubmit={jobDetailsForm.handleSubmit(onSubmit)} className="flex w-full flex-wrap gap-6">
            <div className="min-w-[calc(33.333%-1rem)] flex-1">
              <Label htmlFor="budget" className="text-sm text-slate-500">
                Budget
              </Label>
              <div className="relative mt-1">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">$</span>
                <Input
                  id="budget"
                  {...jobDetailsForm.register('budget', {
                    onChange: (e) => {
                      const value = parseBudgetFromInput(e.target.value);
                      const stringValue = value !== null ? value.toFixed(2) : '';
                      jobDetailsForm.setValue('budget', stringValue, { shouldDirty: true });
                      e.target.value = stringValue;
                    },
                  })}
                  className="pl-7"
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                />
              </div>
            </div>
            <div className="min-w-[calc(33.333%-1rem)] flex-1">
              <Label htmlFor="estimatedStartDate" className="text-sm text-slate-500">
                Estimated Start Date
              </Label>
              <Input
                id="estimatedStartDate"
                type="date"
                {...jobDetailsForm.register('estimatedStartDate')}
                className="mt-1"
              />
            </div>
            <div className="min-w-[calc(33.333%-1rem)] flex-1">
              <Label htmlFor="estimatedEndDate" className="text-sm text-slate-500">
                Estimated End Date
              </Label>
              <Input
                id="estimatedEndDate"
                type="date"
                {...jobDetailsForm.register('estimatedEndDate')}
                className="mt-1"
              />
            </div>
            <div className="min-w-[calc(33.333%-1rem)] flex-1">
              <Label htmlFor="actualStartDate" className="text-sm text-slate-500">
                Actual Start Date
              </Label>
              <Input
                id="actualStartDate"
                type="date"
                {...jobDetailsForm.register('actualStartDate')}
                className="mt-1"
              />
            </div>
            <div className="min-w-[calc(33.333%-1rem)] flex-1">
              <Label htmlFor="actualEndDate" className="text-sm text-slate-500">
                Actual End Date
              </Label>
              <Input
                id="actualEndDate"
                type="date"
                {...jobDetailsForm.register('actualEndDate')}
                className="mt-1"
              />
            </div>
          </form>
        ) : (
          <>
            <div className="min-w-[calc(33.333%-1rem)] flex-1">
              <div className="text-sm text-slate-500">Budget</div>
              <div className="text-lg font-medium">{formatCurrency(job.budget)}</div>
            </div>
            <div className="min-w-[calc(33.333%-1rem)] flex-1">
              <div className="text-sm text-slate-500">Estimated Start Date</div>
              <div className="font-medium">{formatDate(job.estimatedStartDate)}</div>
            </div>
            <div className="min-w-[calc(33.333%-1rem)] flex-1">
              <div className="text-sm text-slate-500">Estimated End Date</div>
              <div className="font-medium">{formatDate(job.estimatedEndDate)}</div>
            </div>
            {job.actualStartDate && (
              <div className="min-w-[calc(33.333%-1rem)] flex-1">
                <div className="text-sm text-slate-500">Actual Start Date</div>
                <div className="font-medium">{formatDate(job.actualStartDate)}</div>
              </div>
            )}
            {job.actualEndDate && (
              <div className="min-w-[calc(33.333%-1rem)] flex-1">
                <div className="text-sm text-slate-500">Actual End Date</div>
                <div className="font-medium">{formatDate(job.actualEndDate)}</div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
