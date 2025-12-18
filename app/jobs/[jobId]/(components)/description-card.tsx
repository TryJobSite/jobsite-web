'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Button } from '@/(components)/shadcn/ui/button';
import { UseFormReturn } from 'react-hook-form';
import { Job } from './types';

type DescriptionFormData = {
  description?: string;
};

type DescriptionCardProps = {
  job: Job;
  editingSection: 'address' | 'description' | 'details' | null;
  isSubmitting: boolean;
  descriptionForm: UseFormReturn<DescriptionFormData>;
  onEdit: () => void;
  onCancel: () => void;
  onSubmit: (data: DescriptionFormData) => Promise<void>;
};

export function DescriptionCard({
  job,
  editingSection,
  isSubmitting,
  descriptionForm,
  onEdit,
  onCancel,
  onSubmit,
}: DescriptionCardProps) {
  return (
    <Card className={`min-w-[400px] flex-1 ${editingSection === 'description' ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Description</CardTitle>
          {editingSection === 'description' ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={descriptionForm.handleSubmit(onSubmit)}
                disabled={!descriptionForm.formState.isDirty || isSubmitting}
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
      <CardContent>
        {editingSection === 'description' ? (
          <form onSubmit={descriptionForm.handleSubmit(onSubmit)}>
            <textarea
              {...descriptionForm.register('description')}
              className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2
                text-sm ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add a description for this job..."
              rows={6}
            />
          </form>
        ) : (
          <p className="whitespace-pre-wrap text-slate-700">{job.description || 'No description'}</p>
        )}
      </CardContent>
    </Card>
  );
}
