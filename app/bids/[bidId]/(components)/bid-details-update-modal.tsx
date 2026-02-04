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

type BidDetailsUpdateFormData = {
  description: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  status: 'in-progress' | 'sent-to-client' | 'bid-won' | 'bid-lost';
  price: string;
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  notes: string;
};

type BidDetailsUpdateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  bidDetailsForm: UseFormReturn<BidDetailsUpdateFormData>;
  onSubmit: (data: BidDetailsUpdateFormData) => Promise<void>;
};

export function BidDetailsUpdateModal({
  open,
  onOpenChange,
  isSubmitting,
  bidDetailsForm,
  onSubmit,
}: BidDetailsUpdateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Bid Details</DialogTitle>
          <DialogDescription>
            Update the bid description, address, status, price, and notes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={bidDetailsForm.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="bid-description" className="text-sm font-medium">
              Description
            </Label>
            <textarea
              id="bid-description"
              {...bidDetailsForm.register('description')}
              className="mt-2 flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2
                text-sm ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Bid description..."
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Address</Label>
            <div className="mt-2 space-y-3">
              <div>
                <Label htmlFor="bid-addressLine1" className="text-sm text-slate-500">
                  Address Line 1
                </Label>
                <Input
                  id="bid-addressLine1"
                  {...bidDetailsForm.register('addressLine1')}
                  className="mt-1"
                  placeholder="Street address"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="bid-addressLine2" className="text-sm text-slate-500">
                  Address Line 2
                </Label>
                <Input
                  id="bid-addressLine2"
                  {...bidDetailsForm.register('addressLine2')}
                  className="mt-1"
                  placeholder="Apartment, suite, etc."
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bid-city" className="text-sm text-slate-500">
                    City
                  </Label>
                  <Input
                    id="bid-city"
                    {...bidDetailsForm.register('city')}
                    className="mt-1"
                    placeholder="City"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="bid-state" className="text-sm text-slate-500">
                    State
                  </Label>
                  <Input
                    id="bid-state"
                    {...bidDetailsForm.register('state')}
                    className="mt-1"
                    placeholder="State"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bid-postalCode" className="text-sm text-slate-500">
                    Postal Code
                  </Label>
                  <Input
                    id="bid-postalCode"
                    {...bidDetailsForm.register('postalCode')}
                    className="mt-1"
                    placeholder="Postal code"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="bid-country" className="text-sm text-slate-500">
                    Country
                  </Label>
                  <Input
                    id="bid-country"
                    {...bidDetailsForm.register('country')}
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
              <Label htmlFor="bid-status" className="text-sm font-medium">
                Status
              </Label>
              <select
                id="bid-status"
                {...bidDetailsForm.register('status')}
                className="mt-1 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm
                  ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                  focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                  disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              >
                <option value="in-progress">In Progress</option>
                <option value="sent-to-client">Sent to Client</option>
                <option value="bid-won">Bid Won</option>
                <option value="bid-lost">Bid Lost</option>
              </select>
            </div>
            <div>
              <Label htmlFor="bid-price" className="text-sm font-medium">
                Price
              </Label>
              <div className="relative mt-1">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">$</span>
                <Input
                  id="bid-price"
                  {...bidDetailsForm.register('price')}
                  className="pl-7"
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bid-estimatedStartDate" className="text-sm font-medium">
                Estimated Start Date
              </Label>
              <Input
                id="bid-estimatedStartDate"
                type="date"
                {...bidDetailsForm.register('estimatedStartDate')}
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="bid-estimatedEndDate" className="text-sm font-medium">
                Estimated End Date
              </Label>
              <Input
                id="bid-estimatedEndDate"
                type="date"
                {...bidDetailsForm.register('estimatedEndDate')}
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bid-notes" className="text-sm font-medium">
              Notes
            </Label>
            <textarea
              id="bid-notes"
              {...bidDetailsForm.register('notes')}
              className="mt-2 flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2
                text-sm ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Additional notes..."
              rows={4}
              disabled={isSubmitting}
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
            <Button type="submit" disabled={!bidDetailsForm.formState.isDirty || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
