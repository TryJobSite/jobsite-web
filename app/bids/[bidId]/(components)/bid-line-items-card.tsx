'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Button } from '@/(components)/shadcn/ui/button';
import { Input } from '@/(components)/shadcn/ui/input';
import { Label } from '@/(components)/shadcn/ui/label';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useApi } from '@/(hooks)/useApi';
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Not set';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'Not set';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  price: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  contractor: z.string().optional(),
  isAllocation: z.boolean().optional(),
});

const bidLineItemsSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

type BidLineItemsFormData = z.infer<typeof bidLineItemsSchema>;

type BidLineItem = {
  description: string;
  price?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  contractor?: string | null;
  isAllocation?: boolean;
};

type Bid = {
  bidId: string;
  lineItems: BidLineItem[];
};

type BidLineItemsCardProps = {
  bidId: string;
  bid: Bid | null | undefined;
};

function formatDateOnlyForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

export function BidLineItemsCard({ bidId, bid }: BidLineItemsCardProps) {
  const params = useParams();
  const { api } = useApi();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingRowData, setEditingRowData] = useState<{
    description: string;
    price?: string;
    startDate?: string;
    endDate?: string;
    contractor?: string;
    isAllocation?: boolean;
  } | null>(null);

  const addLineItemButtonRef = useRef<HTMLButtonElement>(null);

  const lineItemsForm = useForm<BidLineItemsFormData>({
    resolver: zodResolver(bidLineItemsSchema),
    defaultValues: {
      lineItems: bid?.lineItems
        ? bid.lineItems.map((item) => ({
            description: item.description,
            price: item.price !== null && item.price !== undefined ? item.price.toFixed(2) : '',
            startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
            endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
            contractor: item.contractor || '',
            isAllocation: item.isAllocation ?? false,
          }))
        : [{ description: '', price: '', startDate: '', endDate: '', contractor: '', isAllocation: false }],
    },
  });

  const handleEdit = () => {
    handleCancelEditRow();
    if (!bid) return;
    setIsEditing(true);
    lineItemsForm.reset({
      lineItems: bid.lineItems.map((item) => ({
        description: item.description,
        price: item.price !== null && item.price !== undefined ? item.price.toFixed(2) : '',
        startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
        endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
        contractor: item.contractor || '',
        isAllocation: item.isAllocation ?? false,
      })),
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    lineItemsForm.reset();
  };

  const onSubmit = async (data: BidLineItemsFormData) => {
    setIsSubmitting(true);
    try {
      const formatDateToISO = (dateStr: string | undefined) => {
        if (!dateStr || dateStr === '') return null;
        return new Date(dateStr + 'T00:00:00').toISOString();
      };

      const lineItems = data.lineItems.map((item) => ({
        description: item.description,
        price: item.price ? parseFloat(item.price) : null,
        startDate: formatDateToISO(item.startDate),
        endDate: formatDateToISO(item.endDate),
        contractor: item.contractor || null,
        isAllocation: item.isAllocation ?? false,
      }));

      await api.PATCH('/bids/{bidId}', {
        params: {
          path: {
            bidId: bidId,
          },
        },
        body: {
          lineItems,
        } as any,
      });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      setIsEditing(false);
    } catch (error) {
      console.error('Update bid line items error:', error);
      alert('Failed to save line items. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRow = (index: number, item: any) => {
    setEditingRowIndex(index);
    setEditingRowData({
      description: item.description,
      price: item.price !== null && item.price !== undefined ? item.price.toFixed(2) : '',
      startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
      endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
      contractor: item.contractor || '',
      isAllocation: item.isAllocation ?? false,
    });
  };

  const handleCancelEditRow = () => {
    setEditingRowIndex(null);
    setEditingRowData(null);
  };

  const handleSaveRow = async (index: number) => {
    if (!editingRowData || !bid) return;

    const currentLineItems =
      lineItemsForm.getValues('lineItems').length > 0
        ? lineItemsForm.getValues('lineItems')
        : bid.lineItems.map((item) => ({
            description: item.description,
            price: item.price !== null && item.price !== undefined ? item.price.toFixed(2) : '',
            startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
            endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
            contractor: item.contractor || '',
            isAllocation: item.isAllocation ?? false,
          }));

    const updatedLineItems = [...currentLineItems];
    updatedLineItems[index] = {
      description: editingRowData.description,
      price: editingRowData.price || '',
      startDate: editingRowData.startDate || '',
      endDate: editingRowData.endDate || '',
      contractor: editingRowData.contractor || '',
      isAllocation: editingRowData.isAllocation ?? false,
    };

    lineItemsForm.setValue('lineItems', updatedLineItems, { shouldDirty: true });
    await onSubmit({
      lineItems: updatedLineItems,
    });

    setEditingRowIndex(null);
    setEditingRowData(null);
  };

  const handleDeleteRow = async (index: number) => {
    if (!bid) return;

    const currentLineItems =
      lineItemsForm.getValues('lineItems').length > 0
        ? lineItemsForm.getValues('lineItems')
        : bid.lineItems.map((item) => ({
            description: item.description,
            price: item.price !== null && item.price !== undefined ? item.price.toFixed(2) : '',
            startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
            endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
            contractor: item.contractor || '',
            isAllocation: item.isAllocation ?? false,
          }));

    const updatedLineItems = currentLineItems.filter((_, i) => i !== index);

    if (updatedLineItems.length === 0) {
      alert('Cannot delete the last line item. Please add another item first.');
      return;
    }

    lineItemsForm.setValue('lineItems', updatedLineItems, { shouldDirty: true });
    await onSubmit({
      lineItems: updatedLineItems,
    });
  };

  // Initialize form with current data when viewing (not in edit mode)
  useEffect(() => {
    if (bid && !isEditing && bid.lineItems.length > 0) {
      lineItemsForm.reset({
        lineItems: bid.lineItems.map((item) => ({
          description: item.description,
          price: item.price !== null && item.price !== undefined ? item.price.toFixed(2) : '',
          startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
          endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
          contractor: item.contractor || '',
          isAllocation: item.isAllocation ?? false,
        })),
      });
    }
  }, [bid, isEditing, lineItemsForm]);

  if (!bid) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          {!isEditing && (
            <Button size="sm" variant="outline" onClick={handleEdit}>
              Edit
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={lineItemsForm.handleSubmit(onSubmit)}
                disabled={!lineItemsForm.formState.isDirty || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-6">
        {isEditing ? (
          <form onSubmit={lineItemsForm.handleSubmit(onSubmit)} className="space-y-6">
            <div className="mt-2 space-y-4 px-4">
              {lineItemsForm.watch('lineItems').map((item, index) => (
                <div key={index} className="space-y-3 rounded-md border border-slate-200 p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`lineItems.${index}.description`} className="text-sm text-slate-500">
                        Description
                      </Label>
                      <Input
                        id={`lineItems.${index}.description`}
                        {...lineItemsForm.register(`lineItems.${index}.description`)}
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
                          {...lineItemsForm.register(`lineItems.${index}.price`)}
                          className="pl-7"
                          placeholder="0.00"
                          type="text"
                          inputMode="decimal"
                        />
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
                      <Label
                        htmlFor={`lineItems.${index}.isAllocation`}
                        className="text-sm text-slate-500"
                      >
                        Allocation
                      </Label>
                      <div className="flex h-10 items-center">
                        <input
                          id={`lineItems.${index}.isAllocation`}
                          type="checkbox"
                          {...lineItemsForm.register(`lineItems.${index}.isAllocation`)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </div>
                    </div>
                    {lineItemsForm.watch('lineItems').length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-8"
                        onClick={() => {
                          const currentItems = lineItemsForm.getValues('lineItems');
                          lineItemsForm.setValue(
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
                        {...lineItemsForm.register(`lineItems.${index}.startDate`)}
                        type="date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`lineItems.${index}.endDate`} className="text-sm text-slate-500">
                        End Date
                      </Label>
                      <Input
                        id={`lineItems.${index}.endDate`}
                        {...lineItemsForm.register(`lineItems.${index}.endDate`)}
                        type="date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`lineItems.${index}.contractor`} className="text-sm text-slate-500">
                        Contractor
                      </Label>
                      <Input
                        id={`lineItems.${index}.contractor`}
                        {...lineItemsForm.register(`lineItems.${index}.contractor`)}
                        placeholder="Contractor name"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button
              ref={addLineItemButtonRef}
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 ml-4"
              onClick={() => {
                const currentItems = lineItemsForm.getValues('lineItems');
                lineItemsForm.setValue(
                  'lineItems',
                  [
                    ...currentItems,
                    { description: '', price: '', startDate: '', endDate: '', contractor: '', isAllocation: false },
                  ],
                  {
                    shouldDirty: true,
                  }
                );
                // Scroll button into view if it's not visible after adding new item
                setTimeout(() => {
                  if (addLineItemButtonRef.current) {
                    const rect = addLineItemButtonRef.current.getBoundingClientRect();
                    const isVisible =
                      rect.top >= 0 &&
                      rect.left >= 0 &&
                      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                      rect.right <= (window.innerWidth || document.documentElement.clientWidth);

                    if (!isVisible) {
                      addLineItemButtonRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                      });
                    }
                  }
                }, 100);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Line Item
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto px-4">
              <table className="w-full">
                <thead>
                  <tr className="w-full border-collapse border border-slate-200 text-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Start Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">End Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Contractor</th>
                  </tr>
                </thead>
                <tbody>
                  {bid.lineItems.map((item, index) => {
                    const isEditing = editingRowIndex === index;
                    return (
                      <tr key={index} className="border-collapse border border-slate-200">
                        <td
                          className="max-w-[200px] border-collapse truncate overflow-hidden border
                            border-slate-200 px-4 py-3"
                        >
                          <span className="max-w-[200px] truncate text-sm text-slate-900">
                            {item.description}
                          </span>
                        </td>
                        <td className="border-collapse border border-slate-200 px-4 py-3">
                          <span className="text-sm text-slate-900">
                            {item.price !== null && item.price !== undefined
                              ? formatCurrency(item.price)
                              : 'N/A'}
                            {item.isAllocation && (
                              <span className="ml-1 text-xs text-slate-500">(A)</span>
                            )}
                          </span>
                        </td>
                        <td className="border-collapse border border-slate-200 px-4 py-3">
                          <span className="text-sm text-slate-900">{formatDate(item.startDate || null)}</span>
                        </td>
                        <td className="border-collapse border border-slate-200 px-4 py-3">
                          <span className="text-sm text-slate-900">{formatDate(item.endDate || null)}</span>
                        </td>
                        <td className="border-collapse border border-slate-200 px-4 py-3">
                          <span className="text-sm text-slate-900">{item.contractor || 'N/A'}</span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-blue-50 text-sm font-medium text-blue-800">
                    <td colSpan={1} className="px-4 py-3 text-sm font-medium text-blue-800">
                      Total:
                    </td>
                    <td className="border-collapse border border-slate-200 px-4 py-3">
                      {formatCurrency(bid.lineItems.reduce((sum, item) => sum + (item.price || 0), 0))}
                    </td>
                    <td className="px-4 py-3">--</td>
                    <td className="px-4 py-3">--</td>
                    <td className="px-4 py-3">--</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {bid.lineItems.some((item) => item.isAllocation) && (
              <div className="mt-2 px-4 pb-1 text-xs text-slate-500">
                <span className="font-medium">(A)</span> — This line item is an allocation. Cost can be less or
                more than the allocation based on materials pricing.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
