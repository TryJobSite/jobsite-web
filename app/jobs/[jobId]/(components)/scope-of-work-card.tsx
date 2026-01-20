'use client';

import { useState, useEffect } from 'react';
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
import { ScopeOfWork } from './types';
import { formatDate, formatDateOnlyForInput } from './utils';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  price: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  contractor: z.string().optional(),
});

const scopeOfWorkSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
});

type ScopeOfWorkFormData = z.infer<typeof scopeOfWorkSchema>;

type ScopeOfWorkCardProps = {
  isLoading: boolean;
  sowData: ScopeOfWork | null | undefined;
};

export function ScopeOfWorkCard({ isLoading, sowData }: ScopeOfWorkCardProps) {
  console.log({ sowData });
  const params = useParams();
  const { api } = useApi();
  const queryClient = useQueryClient();
  const jobId = params.jobId as string;

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingRowData, setEditingRowData] = useState<{
    description: string;
    price?: string;
    startDate?: string;
    endDate?: string;
    contractor?: string;
  } | null>(null);

  const sowForm = useForm<ScopeOfWorkFormData>({
    resolver: zodResolver(scopeOfWorkSchema),
    defaultValues: {
      lineItems: sowData?.lineItems
        ? sowData.lineItems.map((item) => ({
            description: item.description,
            price: item.price !== null && item.price !== undefined ? item.price.toFixed(2) : '',
            startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
            endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
            contractor: item.contractor || '',
          }))
        : [{ description: '', price: '', startDate: '', endDate: '', contractor: '' }],
      notes: sowData?.notes || '',
    },
  });

  const handleCreate = () => {
    setIsCreating(true);
    setIsEditing(false);
    sowForm.reset({
      lineItems: [{ description: '', price: '', startDate: '', endDate: '', contractor: '' }],
      notes: '',
    });
  };

  const handleEdit = () => {
    handleCancelEditRow();
    if (!sowData) return;
    setIsEditing(true);
    setIsCreating(false);
    sowForm.reset({
      lineItems: sowData.lineItems.map((item) => ({
        description: item.description,
        price: item.price !== null && item.price !== undefined ? item.price.toFixed(2) : '',
        startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
        endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
        contractor: item.contractor || '',
      })),
      notes: sowData.notes || '',
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    sowForm.reset();
  };

  const onSubmit = async (data: ScopeOfWorkFormData) => {
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
      }));

      if (isCreating) {
        await api.POST('/jobs/scopeofwork/{jobId}', {
          params: {
            path: {
              jobId: jobId,
            },
          },
          body: {
            lineItems,
            notes: data.notes || undefined,
          } as any,
        });
      } else {
        await api.PATCH('/jobs/scopeofwork/{jobId}', {
          params: {
            path: {
              jobId: jobId,
            },
          },
          body: {
            lineItems,
            notes: data.notes || null,
          } as any,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['scopeOfWork', jobId] });
      setIsCreating(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Update scope of work error:', error);
      alert('Failed to save scope of work. Please try again.');
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
    });
  };

  const handleCancelEditRow = () => {
    setEditingRowIndex(null);
    setEditingRowData(null);
  };

  const handleSaveRow = async (index: number) => {
    if (!editingRowData || !sowData) return;

    // Get current line items from form or sowData
    const currentLineItems =
      sowForm.getValues('lineItems').length > 0
        ? sowForm.getValues('lineItems')
        : sowData.lineItems.map((item) => ({
            description: item.description,
            price: item.price !== null && item.price !== undefined ? item.price.toFixed(2) : '',
            startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
            endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
            contractor: item.contractor || '',
          }));
    console.log({
      currentLineItems,
      sowFormValues: sowForm.getValues('lineItems'),
      sowDataLineItems: sowData.lineItems,
    });
    const updatedLineItems = [...currentLineItems];
    updatedLineItems[index] = {
      description: editingRowData.description,
      price: editingRowData.price || '',
      startDate: editingRowData.startDate || '',
      endDate: editingRowData.endDate || '',
      contractor: editingRowData.contractor || '',
    };

    sowForm.setValue('lineItems', updatedLineItems, { shouldDirty: true });
    console.log('updatedLineItems', updatedLineItems);
    // Submit the form
    await onSubmit({
      lineItems: updatedLineItems,
      notes: sowData.notes || '',
    });

    setEditingRowIndex(null);
    setEditingRowData(null);
  };

  const handleDeleteRow = async (index: number) => {
    if (!sowData) return;

    // Get current line items from form or sowData
    const currentLineItems =
      sowForm.getValues('lineItems').length > 0
        ? sowForm.getValues('lineItems')
        : sowData.lineItems.map((item) => ({
            description: item.description,
            price: item.price !== null && item.price !== undefined ? item.price.toFixed(2) : '',
            startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
            endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
            contractor: item.contractor || '',
          }));

    const updatedLineItems = currentLineItems.filter((_, i) => i !== index);

    if (updatedLineItems.length === 0) {
      alert('Cannot delete the last line item. Please add another item first.');
      return;
    }

    sowForm.setValue('lineItems', updatedLineItems, { shouldDirty: true });

    // Submit the form
    await onSubmit({
      lineItems: updatedLineItems,
      notes: sowData.notes || '',
    });
  };

  // Initialize form with current data when viewing (not in create/edit mode)
  useEffect(() => {
    if (sowData && !isCreating && !isEditing && sowData.lineItems.length > 0) {
      sowForm.reset({
        lineItems: sowData.lineItems.map((item) => ({
          description: item.description,
          price: item.price !== null && item.price !== undefined ? item.price.toFixed(2) : '',
          startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
          endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
          contractor: item.contractor || '',
        })),
        notes: sowData.notes || '',
      });
    }
  }, [sowData, isCreating, isEditing, sowForm]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Scope of Work</CardTitle>
          {!isLoading && !sowData && !isCreating && (
            <Button size="sm" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Scope of Work
            </Button>
          )}
          {!isLoading && sowData && !isEditing && !isCreating && (
            <Button size="sm" variant="outline" onClick={handleEdit}>
              Edit
            </Button>
          )}
          {(isCreating || isEditing) && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
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
      <CardContent className="p-0">
        {isLoading ? (
          <div className="text-slate-500">Loading scope of work...</div>
        ) : isCreating || isEditing ? (
          <form onSubmit={sowForm.handleSubmit(onSubmit)} className="space-y-6">
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="w-full border-collapse border border-slate-200 text-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Start Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">End Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Contractor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sowData.lineItems.map((item, index) => {
                    const isEditing = editingRowIndex === index;
                    return (
                      <tr key={index} className="border-collapse border border-slate-200">
                        <td
                          className="max-w-[200px] border-collapse truncate overflow-hidden border
                            border-slate-200 px-4 py-3"
                        >
                          {isEditing ? (
                            <Input
                              value={editingRowData?.description || ''}
                              onChange={(e) =>
                                setEditingRowData((prev) =>
                                  prev ? { ...prev, description: e.target.value } : null
                                )
                              }
                              placeholder="Item description"
                              className="w-full"
                            />
                          ) : (
                            <span className="max-w-[200px] truncate text-sm text-slate-900">
                              {item.description}
                            </span>
                          )}
                        </td>
                        <td className="border-collapse border border-slate-200 px-4 py-3">
                          {isEditing ? (
                            <div className="relative">
                              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">
                                $
                              </span>
                              <Input
                                value={editingRowData?.price || ''}
                                onChange={(e) =>
                                  setEditingRowData((prev) =>
                                    prev ? { ...prev, price: e.target.value } : null
                                  )
                                }
                                placeholder="0.00"
                                type="text"
                                inputMode="decimal"
                                className="w-full pl-7"
                              />
                            </div>
                          ) : (
                            <span className="text-sm text-slate-900">
                              {item.price !== null && item.price !== undefined
                                ? new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                  }).format(item.price)
                                : 'N/A'}
                            </span>
                          )}
                        </td>
                        <td className="border-collapse border border-slate-200 px-4 py-3">
                          {isEditing ? (
                            <Input
                              value={editingRowData?.startDate || ''}
                              onChange={(e) =>
                                setEditingRowData((prev) =>
                                  prev ? { ...prev, startDate: e.target.value } : null
                                )
                              }
                              type="date"
                              className="w-full"
                            />
                          ) : (
                            <span className="text-sm text-slate-900">
                              {formatDate(item.startDate || null)}
                            </span>
                          )}
                        </td>
                        <td className="border-collapse border border-slate-200 px-4 py-3">
                          {isEditing ? (
                            <Input
                              value={editingRowData?.endDate || ''}
                              onChange={(e) =>
                                setEditingRowData((prev) =>
                                  prev ? { ...prev, endDate: e.target.value } : null
                                )
                              }
                              type="date"
                              className="w-full"
                            />
                          ) : (
                            <span className="text-sm text-slate-900">{formatDate(item.endDate || null)}</span>
                          )}
                        </td>
                        <td className="border-collapse border border-slate-200 px-4 py-3">
                          {isEditing ? (
                            <Input
                              value={editingRowData?.contractor || ''}
                              onChange={(e) =>
                                setEditingRowData((prev) =>
                                  prev ? { ...prev, contractor: e.target.value } : null
                                )
                              }
                              placeholder="Contractor name"
                              className="w-full"
                            />
                          ) : (
                            <span className="text-sm text-slate-900">{item.contractor || 'N/A'}</span>
                          )}
                        </td>
                        <td className="border-collapse border border-slate-200 px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveRow(index)}
                                  disabled={isSubmitting}
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="h-4 w-4 text-emerald-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEditRow}
                                  disabled={isSubmitting}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditRow(index, item)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteRow(index)}
                                  disabled={isSubmitting}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-blue-50 text-sm font-medium text-blue-800">
                    <td colSpan={1} className="px-4 py-3 text-sm font-medium text-blue-800">
                      Total:
                    </td>
                    <td className="border-collapse border border-slate-200 px-4 py-3">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(sowData.lineItems.reduce((sum, item) => sum + (item.price || 0), 0))}
                    </td>
                    <td className="px-4 py-3">--</td>
                    <td className="px-4 py-3">--</td>
                    <td className="px-4 py-3">--</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            {sowData.notes && (
              <div className="px-4 py-3">
                <h4 className="mb-2 text-sm font-medium">Notes</h4>
                <p className="whitespace-pre-wrap text-slate-700">{sowData.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="mb-4 text-slate-500">No scope of work has been created yet.</p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Scope of Work
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
