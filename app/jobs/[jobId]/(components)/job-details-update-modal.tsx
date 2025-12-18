'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/(components)/shadcn/ui/dialog';
import { Button } from '@/(components)/shadcn/ui/button';
import { Input } from '@/(components)/shadcn/ui/input';
import { Label } from '@/(components)/shadcn/ui/label';
import { UseFormReturn } from 'react-hook-form';

type JobDetailsUpdateFormData = {
  description: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold';
  budget: string;
};

type JobDetailsUpdateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  jobDetailsForm: UseFormReturn<JobDetailsUpdateFormData>;
  onSubmit: (data: JobDetailsUpdateFormData) => Promise<void>;
};

export function JobDetailsUpdateModal({
  open,
  onOpenChange,
  isSubmitting,
  jobDetailsForm,
  onSubmit,
}: JobDetailsUpdateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Job Details</DialogTitle>
          <DialogDescription>Update the job description, address, status, and budget.</DialogDescription>
        </DialogHeader>
        <form onSubmit={jobDetailsForm.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="job-description" className="text-sm font-medium">
              Description
            </Label>
            <textarea
              id="job-description"
              {...jobDetailsForm.register('description')}
              className="mt-2 flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2
                text-sm ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Job description..."
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Address</Label>
            <div className="mt-2 space-y-3">
              <div>
                <Label htmlFor="job-addressLine1" className="text-sm text-slate-500">
                  Address Line 1
                </Label>
                <Input
                  id="job-addressLine1"
                  {...jobDetailsForm.register('addressLine1')}
                  className="mt-1"
                  placeholder="Street address"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="job-addressLine2" className="text-sm text-slate-500">
                  Address Line 2
                </Label>
                <Input
                  id="job-addressLine2"
                  {...jobDetailsForm.register('addressLine2')}
                  className="mt-1"
                  placeholder="Apartment, suite, etc."
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="job-city" className="text-sm text-slate-500">
                    City
                  </Label>
                  <Input
                    id="job-city"
                    {...jobDetailsForm.register('city')}
                    className="mt-1"
                    placeholder="City"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="job-state" className="text-sm text-slate-500">
                    State
                  </Label>
                  <Input
                    id="job-state"
                    {...jobDetailsForm.register('state')}
                    className="mt-1"
                    placeholder="State"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="job-postalCode" className="text-sm text-slate-500">
                    Postal Code
                  </Label>
                  <Input
                    id="job-postalCode"
                    {...jobDetailsForm.register('postalCode')}
                    className="mt-1"
                    placeholder="Postal code"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="job-country" className="text-sm text-slate-500">
                    Country
                  </Label>
                  <Input
                    id="job-country"
                    {...jobDetailsForm.register('country')}
                    className="mt-1"
                    placeholder="Country"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="job-status" className="text-sm font-medium">
                Status
              </Label>
              <select
                id="job-status"
                {...jobDetailsForm.register('status')}
                className="mt-1 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm
                  ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                  focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                  disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              >
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
            <div>
              <Label htmlFor="job-budget" className="text-sm font-medium">
                Budget
              </Label>
              <div className="relative mt-1">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">$</span>
                <Input
                  id="job-budget"
                  {...jobDetailsForm.register('budget')}
                  className="pl-7"
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!jobDetailsForm.formState.isDirty || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
