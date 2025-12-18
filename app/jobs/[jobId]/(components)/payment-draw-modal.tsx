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
import { Edit } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { PaymentDraw } from './types';

type PaymentDrawFormData = {
  paymentAmount: string;
  expectedPaymentDate: string;
  actualPaymentDate?: string | null;
  dateRequested?: string | null;
  status?: 'future' | 'requested' | 'paid';
  description?: string | null;
  images?: string[];
  notifyCustomer?: boolean;
};

type PaymentDrawModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  isViewing: boolean;
  viewingPaymentDraw: PaymentDraw | null;
  isSubmitting: boolean;
  paymentDrawForm: UseFormReturn<PaymentDrawFormData>;
  onSubmit: (data: PaymentDrawFormData) => Promise<void>;
  onEdit: () => void;
};

export function PaymentDrawModal({
  open,
  onOpenChange,
  isEditing,
  isViewing,
  viewingPaymentDraw,
  isSubmitting,
  paymentDrawForm,
  onSubmit,
  onEdit,
}: PaymentDrawModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Payment Draw' : isViewing ? 'View Payment Draw' : 'Create Payment Draw'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the payment draw details below.'
              : isViewing
              ? 'View the payment draw details below.'
              : 'Add details for the payment draw.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={paymentDrawForm.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pd-paymentAmount" className="text-sm font-medium">
                Payment Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">$</span>
                <Input
                  id="pd-paymentAmount"
                  {...paymentDrawForm.register('paymentAmount')}
                  className="pl-7"
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                  disabled={isViewing}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pd-status" className="text-sm font-medium">
                Status
              </Label>
              <select
                id="pd-status"
                {...paymentDrawForm.register('status')}
                className="mt-1 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm
                  ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                  focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                  disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isViewing}
              >
                <option value="future">Future</option>
                <option value="requested">Requested</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pd-expectedPaymentDate" className="text-sm font-medium">
                Expected Payment Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pd-expectedPaymentDate"
                type="date"
                {...paymentDrawForm.register('expectedPaymentDate')}
                className="mt-1"
                disabled={isViewing}
              />
            </div>
            <div>
              <Label htmlFor="pd-dateRequested" className="text-sm font-medium">
                Date Requested
              </Label>
              <Input
                id="pd-dateRequested"
                type="date"
                {...paymentDrawForm.register('dateRequested')}
                className="mt-1"
                disabled={isViewing}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="pd-actualPaymentDate" className="text-sm font-medium">
              Actual Payment Date
            </Label>
            <Input
              id="pd-actualPaymentDate"
              type="date"
              {...paymentDrawForm.register('actualPaymentDate')}
              className="mt-1"
              disabled={isViewing}
            />
          </div>
          <div>
            <Label htmlFor="pd-description" className="text-sm font-medium">
              Description
            </Label>
            <textarea
              id="pd-description"
              {...paymentDrawForm.register('description')}
              className="mt-2 flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2
                text-sm ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Additional notes..."
              rows={4}
              disabled={isViewing}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="pd-notifyCustomer"
              {...paymentDrawForm.register('notifyCustomer')}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary"
              disabled={isViewing}
            />
            <Label htmlFor="pd-notifyCustomer" className="text-sm font-medium">
              Email Payment Draw to Customer?
            </Label>
          </div>
          <DialogFooter>
            {isViewing ? (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button type="button" onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!paymentDrawForm.formState.isDirty || isSubmitting}>
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
