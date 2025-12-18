'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Button } from '@/(components)/shadcn/ui/button';
import { Input } from '@/(components)/shadcn/ui/input';
import { Label } from '@/(components)/shadcn/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { ScopeOfWork } from './types';
import { formatDate } from './utils';

type ScopeOfWorkFormData = {
  lineItems: Array<{
    description: string;
    price?: string;
    startDate?: string;
    endDate?: string;
    contractor?: string;
  }>;
  notes?: string;
};

type ScopeOfWorkCardProps = {
  isLoading: boolean;
  sowData: ScopeOfWork | null | undefined;
  isCreating: boolean;
  isEditing: boolean;
  isSubmitting: boolean;
  sowForm: UseFormReturn<{
    lineItems: Array<{
      description: string;
      price?: string;
      startDate?: string;
      endDate?: string;
      contractor?: string;
    }>;
    notes?: string;
  }>;
  onCreate: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSubmit: (data: ScopeOfWorkFormData) => Promise<void>;
};

export function ScopeOfWorkCard({
  isLoading,
  sowData,
  isCreating,
  isEditing,
  isSubmitting,
  sowForm,
  onCreate,
  onEdit,
  onCancel,
  onSubmit,
}: ScopeOfWorkCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Scope of Work</CardTitle>
          {!isLoading && !sowData && !isCreating && (
            <Button size="sm" onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Scope of Work
            </Button>
          )}
          {!isLoading && sowData && !isEditing && !isCreating && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              Edit
            </Button>
          )}
          {(isCreating || isEditing) && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={sowForm.handleSubmit(onSubmit)}
                disabled={!sowForm.formState.isDirty || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-slate-500">Loading scope of work...</div>
        ) : isCreating || isEditing ? (
          <form onSubmit={sowForm.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Line Items</Label>
              <div className="mt-2 space-y-4">
                {sowForm.watch('lineItems').map((item, index) => (
                  <div key={index} className="space-y-3 rounded-md border border-slate-200 p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`lineItems.${index}.description`} className="text-sm text-slate-500">
                          Description
                        </Label>
                        <Input
                          id={`lineItems.${index}.description`}
                          {...sowForm.register(`lineItems.${index}.description`)}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <Label htmlFor={`lineItems.${index}.price`} className="text-sm text-slate-500">
                          Price
                        </Label>
                        <div className="relative">
                          <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">$</span>
                          <Input
                            id={`lineItems.${index}.price`}
                            {...sowForm.register(`lineItems.${index}.price`)}
                            className="pl-7"
                            placeholder="0.00"
                            type="text"
                            inputMode="decimal"
                          />
                        </div>
                      </div>
                      {sowForm.watch('lineItems').length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-8"
                          onClick={() => {
                            const currentItems = sowForm.getValues('lineItems');
                            sowForm.setValue(
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
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`lineItems.${index}.startDate`} className="text-sm text-slate-500">
                          Start Date
                        </Label>
                        <Input
                          id={`lineItems.${index}.startDate`}
                          {...sowForm.register(`lineItems.${index}.startDate`)}
                          type="date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`lineItems.${index}.endDate`} className="text-sm text-slate-500">
                          End Date
                        </Label>
                        <Input
                          id={`lineItems.${index}.endDate`}
                          {...sowForm.register(`lineItems.${index}.endDate`)}
                          type="date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`lineItems.${index}.contractor`} className="text-sm text-slate-500">
                          Contractor
                        </Label>
                        <Input
                          id={`lineItems.${index}.contractor`}
                          {...sowForm.register(`lineItems.${index}.contractor`)}
                          placeholder="Contractor name"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  const currentItems = sowForm.getValues('lineItems');
                  sowForm.setValue(
                    'lineItems',
                    [
                      ...currentItems,
                      { description: '', price: '', startDate: '', endDate: '', contractor: '' },
                    ],
                    {
                      shouldDirty: true,
                    }
                  );
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Line Item
              </Button>
            </div>
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <textarea
                id="notes"
                {...sowForm.register('notes')}
                className="mt-2 flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3
                  py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:ring-2
                  focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none
                  disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Additional notes..."
                rows={4}
              />
            </div>
          </form>
        ) : sowData ? (
          <div className="space-y-4">
            <div>
              <h4 className="mb-3 text-sm font-medium">Line Items</h4>
              <div className="space-y-4">
                {sowData.lineItems.map((item, index) => (
                  <div key={index} className="rounded-md border border-slate-200 p-4">
                    <div className="mb-2">
                      <p className="font-medium text-slate-900">{item.description}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Price:</span>
                        <p className="font-medium">
                          {item.price !== null && item.price !== undefined
                            ? new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(item.price)
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Start Date:</span>
                        <p className="font-medium">{formatDate(item.startDate || null)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">End Date:</span>
                        <p className="font-medium">{formatDate(item.endDate || null)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Contractor:</span>
                        <p className="font-medium">{item.contractor || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <div className="text-sm">
                  <span className="text-slate-500">Total: </span>
                  <span className="text-lg font-bold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(sowData.lineItems.reduce((sum, item) => sum + (item.price || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
            {sowData.notes && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Notes</h4>
                <p className="whitespace-pre-wrap text-slate-700">{sowData.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="mb-4 text-slate-500">No scope of work has been created yet.</p>
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Scope of Work
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
