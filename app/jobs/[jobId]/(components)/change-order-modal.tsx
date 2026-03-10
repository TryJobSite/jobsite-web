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
import { Plus, Trash2, Info } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

type ChangeOrderFormData = {
  lineItems: Array<{ description: string; price?: string; isAllocation?: boolean }>;
  notes?: string;
  status: 'created' | 'paymentRequested' | 'paid';
  title: string;
};

type ChangeOrderModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  isSubmitting: boolean;
  changeOrderForm: UseFormReturn<{
    lineItems: Array<{ description: string; price?: string; isAllocation?: boolean }>;
    notes?: string;
    status: 'created' | 'paymentRequested' | 'paid';
    title: string;
  }>;
  onSubmit: (data: ChangeOrderFormData) => Promise<void>;
};

export function ChangeOrderModal({
  open,
  onOpenChange,
  isEditing,
  isSubmitting,
  changeOrderForm,
  onSubmit,
}: ChangeOrderModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{isEditing ? 'Edit Change Order' : 'Create Change Order'}</DialogTitle>
          </div>
          <DialogDescription>
            {isEditing
              ? 'Update the change order details below.'
              : 'Add line items and details for the change order.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={changeOrderForm.handleSubmit(onSubmit)} className="space-y-6">
          <div className="mt-4 mb-2 flex items-end gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor="co-title" className="text-sm font-medium">
                Title
              </Label>
              <Input id="co-title" {...changeOrderForm.register('title')} placeholder="Change order title" />
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <Label htmlFor="co-status" className="text-sm font-medium">
                Status
              </Label>
              <select
                id="co-status"
                {...changeOrderForm.register('status')}
                className="flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm
                  ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                  focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                  disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="created">Created</option>
                <option value="paymentRequested">Payment Requested</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Line Items</Label>
            <div className="mt-2 space-y-4">
              {changeOrderForm.watch('lineItems').map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`co-lineItems.${index}.description`} className="text-sm text-slate-500">
                      Description
                    </Label>
                    <Input
                      id={`co-lineItems.${index}.description`}
                      {...changeOrderForm.register(`lineItems.${index}.description`)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label htmlFor={`co-lineItems.${index}.price`} className="text-sm text-slate-500">
                      Price
                    </Label>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">$</span>
                      <Input
                        id={`co-lineItems.${index}.price`}
                        {...changeOrderForm.register(`lineItems.${index}.price`)}
                        className="pl-7"
                        placeholder="0.00"
                        type="text"
                        inputMode="decimal"
                      />
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
                    <div className="flex items-center gap-1">
                      <Label
                        htmlFor={`co-lineItems.${index}.isAllocation`}
                        className="text-sm text-slate-500"
                      >
                        Allocation
                      </Label>
                      <span className="group relative cursor-help">
                        <Info className="h-3.5 w-3.5 text-slate-400" />
                        <span className="absolute bottom-full left-1/2 mb-1 hidden w-48 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block">
                          Check this box if this line item is an allocation vs a set price
                        </span>
                      </span>
                    </div>
                    <div className="flex h-10 items-center">
                      <input
                        id={`co-lineItems.${index}.isAllocation`}
                        type="checkbox"
                        {...changeOrderForm.register(`lineItems.${index}.isAllocation`)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </div>
                  </div>
                  {changeOrderForm.watch('lineItems').length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-8"
                      onClick={() => {
                        const currentItems = changeOrderForm.getValues('lineItems');
                        changeOrderForm.setValue(
                          'lineItems',
                          currentItems.filter((_, i) => i !== index),
                          { shouldDirty: true }
                        );
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                const currentItems = changeOrderForm.getValues('lineItems');
                changeOrderForm.setValue('lineItems', [...currentItems, { description: '', price: '' }], {
                  shouldDirty: true,
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Line Item
            </Button>
          </div>
          <div>
            <Label htmlFor="co-notes" className="text-sm font-medium">
              Notes
            </Label>
            <textarea
              id="co-notes"
              {...changeOrderForm.register('notes')}
              className="mt-2 flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2
                text-sm ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Additional notes..."
              rows={4}
            />
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
            <Button type="submit" disabled={!changeOrderForm.formState.isDirty || isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
