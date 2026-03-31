'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
  Row,
  Table as TanTable,
} from '@tanstack/react-table';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/(components)/shadcn/ui/dialog';
import { Button } from '@/(components)/shadcn/ui/button';
import { Input } from '@/(components)/shadcn/ui/input';
import { Label } from '@/(components)/shadcn/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/(components)/shadcn/ui/table';
import { Plus, Trash2, Edit2, Check, X, Info, FileText, Printer, GripVertical } from 'lucide-react';
import { useApi } from '@/(hooks)/useApi';
import { useMe } from '@/(hooks)/useMe';
import { ScopeOfWork, JobForPdf } from './types';
import { formatDate, formatDateOnlyForInput } from './utils';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  price: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  contractor: z.string().optional(),
  isAllocation: z.boolean().optional(),
  status: z.enum(['not_started', 'started', 'completed']).optional(),
});

const scopeOfWorkSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
});

type ScopeOfWorkFormData = z.infer<typeof scopeOfWorkSchema>;

type EditingRowData = {
  description: string;
  price?: string;
  startDate?: string;
  endDate?: string;
  contractor?: string;
  isAllocation?: boolean;
  status?: 'not_started' | 'started' | 'completed';
};

type LineItemRow = {
  id: string;
  index: number;
  description: string;
  price: number | null;
  startDate: string | null;
  endDate: string | null;
  contractor: string | null;
  isAllocation: boolean;
  status: 'not_started' | 'started' | 'completed';
};

type TableMeta = {
  editingRowIndex: number | null;
  editingRowData: EditingRowData | null;
  setEditingRowData: React.Dispatch<React.SetStateAction<EditingRowData | null>>;
  handleSaveRow: (index: number) => Promise<void>;
  handleCancelEditRow: () => void;
  handleEditRow: (index: number, item: any) => void;
  handleDeleteRow: (index: number) => Promise<void>;
  isSubmitting: boolean;
  sowLineItems: NonNullable<ScopeOfWork>['lineItems'];
  isDescriptionNarrow: boolean;
  pendingNewRow: boolean;
};

type ScopeOfWorkCardProps = {
  isLoading: boolean;
  sowData: ScopeOfWork | null | undefined;
  job?: JobForPdf | null;
};

function SortableTableRow({ row, table }: { row: Row<LineItemRow>; table: TanTable<LineItemRow> }) {
  const meta = table.options.meta as TableMeta;
  const isEditingRow = meta.editingRowIndex === row.original.index;
  const isTallRow = isEditingRow && meta.isDescriptionNarrow;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.original.id,
    disabled: isEditingRow || meta.editingRowIndex !== null,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isTallRow ? '[&>td]:align-top' : ''}>
      <TableCell className="w-8 px-2">
        {!isEditingRow && meta.editingRowIndex === null && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
      </TableCell>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
      ))}
    </TableRow>
  );
}

export function ScopeOfWorkCard({ isLoading, sowData, job }: ScopeOfWorkCardProps) {
  const params = useParams();
  const { api } = useApi();
  const queryClient = useQueryClient();
  const jobId = params.jobId as string;
  const { me } = useMe();

  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingRowData, setEditingRowData] = useState<EditingRowData | null>(null);
  const [pendingNewRow, setPendingNewRow] = useState(false);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    isAllocation: false,
  });
  const [isDescriptionNarrow, setIsDescriptionNarrow] = useState(false);
  const descriptionHeaderRef = useRef<HTMLTableCellElement>(null);

  // Show/hide the isAllocation column based on whether a row is being edited
  useEffect(() => {
    setColumnVisibility({ isAllocation: editingRowIndex !== null });
  }, [editingRowIndex]);

  // Measure description column width to decide input vs textarea
  useEffect(() => {
    const el = descriptionHeaderRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setIsDescriptionNarrow(entry.contentRect.width < 150);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
            isAllocation: (item as any).isAllocation ?? false,
            status: item.status ?? 'not_started',
          }))
        : [
            {
              description: '',
              price: '',
              startDate: '',
              endDate: '',
              contractor: '',
              isAllocation: false,
              status: 'not_started' as const,
            },
          ],
      notes: sowData?.notes || '',
    },
  });

  const handleCreate = () => {
    setIsCreating(true);
    sowForm.reset({
      lineItems: [
        {
          description: '',
          price: '',
          startDate: '',
          endDate: '',
          contractor: '',
          isAllocation: false,
          status: 'not_started',
        },
      ],
      notes: '',
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    sowForm.reset();
  };

  const buildPdfHtml = () => {
    if (!sowData) return '';

    const companyName = me?.company?.companyName ?? '';

    const fmtDate = (d: string | null | undefined) => {
      if (!d) return 'N/A';
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const fmtCurrency = (n: number | null | undefined) => {
      if (n === null || n === undefined) return 'N/A';
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    };

    const address = job
      ? [job.addressLine1, job.addressLine2, job.city, job.state, job.postalCode].filter(Boolean).join(', ')
      : '';

    const hasAllocations = orderedRows.some((r) => r.isAllocation);
    const total = orderedRows.reduce((sum, r) => sum + (r.price ?? 0), 0);

    const rowsHtml = orderedRows
      .map(
        (r) => `
        <tr>
          <td>${r.description}</td>
          <td style="text-align:right">${r.price !== null ? fmtCurrency(r.price) + (r.isAllocation ? ' (A)' : '') : 'N/A'}</td>
          <td>${fmtDate(r.startDate)}</td>
          <td>${fmtDate(r.endDate)}</td>
          <td>${r.contractor || 'N/A'}</td>
        </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Scope of Work</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 14px; color: #111; padding: 48px; }
    h1 { font-size: 28px; font-weight: bold; margin-bottom: 32px; }
    hr { border: none; border-top: 1px solid #ccc; margin-bottom: 32px; }
    h2 { font-size: 20px; font-weight: bold; margin-bottom: 16px; }
    .meta { margin-bottom: 24px; line-height: 1.8; }
    .meta strong { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { text-align: left; font-weight: bold; border-bottom: 2px solid #111; padding: 8px 12px 8px 0; font-size: 13px; }
    th:not(:first-child) { padding-left: 12px; }
    td { padding: 10px 12px 10px 0; border-bottom: 1px solid #ddd; font-size: 13px; vertical-align: top; }
    td:not(:first-child) { padding-left: 12px; }
    th:nth-child(2), td:nth-child(2) { text-align: right; }
    .total { color: #1a56db; font-weight: bold; font-size: 15px; margin-bottom: 12px; }
    .allocation-note { font-size: 12px; color: #555; margin-bottom: 24px; }
    h3 { font-size: 15px; font-weight: bold; margin-bottom: 8px; }
    .notes { font-size: 14px; color: #333; }
    @media print { body { padding: 32px; } }
  </style>
</head>
<body>
  <h1>${companyName}</h1>
  <hr />
  <h2>Scope of Work</h2>
  <div class="meta">
    ${job?.title ? `<div><strong>Job Title:</strong> ${job.title}</div>` : ''}
    ${job?.description ? `<div><strong>Description:</strong> ${job.description}</div>` : ''}
    ${job?.customer ? `<div><strong>Client:</strong> ${job.customer.firstName} ${job.customer.lastName}</div>` : ''}
    ${address ? `<div><strong>Job Address:</strong> ${address}</div>` : ''}
    ${job?.estimatedStartDate ? `<div><strong>Est. Start Date:</strong> ${fmtDate(job.estimatedStartDate)}</div>` : ''}
    ${job?.estimatedEndDate ? `<div><strong>Est. End Date:</strong> ${fmtDate(job.estimatedEndDate)}</div>` : ''}
  </div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:right">Price</th>
        <th>Start Date</th>
        <th>End Date</th>
        <th>Contractor</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="total">Total: ${fmtCurrency(total)}</div>
  ${hasAllocations ? `<div class="allocation-note">(A) - This line item is an allocation. Cost can be less or more than the allocation based on materials pricing.</div>` : ''}
  ${sowData.notes ? `<h3>Notes</h3><div class="notes">${sowData.notes}</div>` : ''}
</body>
</html>`;
  };

  const handleViewPdf = () => {
    const html = buildPdfHtml();
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    setPdfBlobUrl(URL.createObjectURL(blob));
  };

  const handleClosePdf = () => {
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
  };

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const onSubmit = async (data: ScopeOfWorkFormData) => {
    setIsSubmitting(true);
    try {
      const formatDateToISO = (dateStr: string | undefined) => {
        if (!dateStr || dateStr === '') return null;
        return new Date(dateStr + 'T00:00:00').toISOString();
      };

      const lineItems = data.lineItems.map((item, idx) => ({
        description: item.description,
        price: item.price ? parseFloat(item.price) : null,
        startDate: formatDateToISO(item.startDate),
        endDate: formatDateToISO(item.endDate),
        contractor: item.contractor || null,
        isAllocation: item.isAllocation ?? false,
        status: item.status ?? 'not_started',
        sortOrder: idx + 1,
      }));

      if (isCreating) {
        await api.POST('/jobs/scopeofwork/{jobId}', {
          params: { path: { jobId } },
          body: { lineItems, notes: data.notes || undefined },
        });
      } else {
        await api.PATCH('/jobs/scopeofwork/{jobId}', {
          params: { path: { jobId } },
          body: { lineItems, notes: data.notes || null },
        });
      }
      queryClient.invalidateQueries({ queryKey: ['scopeOfWork', jobId] });
      setIsCreating(false);
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
      isAllocation: (item as any).isAllocation ?? false,
      status: item.status ?? 'not_started',
    });
  };

  const handleAddRow = () => {
    if (!sowData) return;
    const newIndex = sowData.lineItems.length;
    setPendingNewRow(true);
    setEditingRowIndex(newIndex);
    setEditingRowData({
      description: '',
      price: '',
      startDate: '',
      endDate: '',
      contractor: '',
      isAllocation: false,
      status: 'not_started',
    });
  };

  const handleCancelEditRow = () => {
    setEditingRowIndex(null);
    setEditingRowData(null);
    setPendingNewRow(false);
  };

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedRows.findIndex((r) => r.id === active.id);
    const newIndex = orderedRows.findIndex((r) => r.id === over.id);
    const newOrder = arrayMove(orderedRows, oldIndex, newIndex);
    setOrderedRows(newOrder);

    try {
      await api.PATCH('/jobs/scopeofwork/reorder/{jobId}', {
        params: { path: { jobId } },
        body: {
          lineItems: newOrder
            .filter((r) => r.id !== 'pending-new')
            .map((r, i) => ({ sowLineItemId: r.id, sortOrder: i + 1 })),
        },
      });
      queryClient.invalidateQueries({ queryKey: ['scopeOfWork', jobId] });
    } catch (error) {
      console.error('Reorder error:', error);
      setOrderedRows(orderedRows); // revert on error
    }
  };

  const handleSaveRow = async (index: number) => {
    if (!editingRowData || !sowData) return;

    const currentLineItems =
      sowForm.getValues('lineItems').length > 0
        ? sowForm.getValues('lineItems')
        : sowData.lineItems.map((item) => ({
            description: item.description,
            price: item.price !== null && item.price !== undefined ? item.price.toFixed(2) : '',
            startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
            endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
            contractor: item.contractor || '',
            isAllocation: (item as any).isAllocation ?? false,
            status: item.status ?? 'not_started',
          }));

    const updatedLineItems = [...currentLineItems];
    updatedLineItems[index] = {
      description: editingRowData.description,
      price: editingRowData.price || '',
      startDate: editingRowData.startDate || '',
      endDate: editingRowData.endDate || '',
      contractor: editingRowData.contractor || '',
      isAllocation: editingRowData.isAllocation ?? false,
      status: editingRowData.status ?? 'not_started',
    };

    sowForm.setValue('lineItems', updatedLineItems, { shouldDirty: true });
    await onSubmit({ lineItems: updatedLineItems, notes: sowData.notes || '' });
    setEditingRowIndex(null);
    setEditingRowData(null);
    setPendingNewRow(false);
  };

  const handleDeleteRow = async (index: number) => {
    if (!sowData) return;

    const currentLineItems =
      sowForm.getValues('lineItems').length > 0
        ? sowForm.getValues('lineItems')
        : sowData.lineItems.map((item) => ({
            description: item.description,
            price: item.price !== null && item.price !== undefined ? item.price.toFixed(2) : '',
            startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
            endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
            contractor: item.contractor || '',
            isAllocation: (item as any).isAllocation ?? false,
            status: item.status ?? 'not_started',
          }));

    const updatedLineItems = currentLineItems.filter((_, i) => i !== index);

    if (updatedLineItems.length === 0) {
      alert('Cannot delete the last line item. Please add another item first.');
      return;
    }

    sowForm.setValue('lineItems', updatedLineItems, { shouldDirty: true });
    await onSubmit({ lineItems: updatedLineItems, notes: sowData.notes || '' });
  };

  useEffect(() => {
    if (sowData && !isCreating && sowData.lineItems.length > 0) {
      sowForm.reset({
        lineItems: sowData.lineItems.map((item) => ({
          description: item.description,
          price: item.price !== null && item.price !== undefined ? item.price.toFixed(2) : '',
          startDate: item.startDate ? formatDateOnlyForInput(item.startDate) : '',
          endDate: item.endDate ? formatDateOnlyForInput(item.endDate) : '',
          contractor: item.contractor || '',
          isAllocation: (item as any).isAllocation ?? false,
          status: item.status ?? 'not_started',
        })),
        notes: sowData.notes || '',
      });
    }
  }, [sowData, isCreating, sowForm]);

  // Build row data for the table
  const tableRows: LineItemRow[] = useMemo(() => {
    const rows = (sowData?.lineItems ?? []).map((item, index) => ({
      id: (item as any).sowLineItemId as string,
      index,
      description: item.description,
      price: item.price ?? null,
      startDate: item.startDate ?? null,
      endDate: item.endDate ?? null,
      contractor: item.contractor ?? null,
      isAllocation: (item as any).isAllocation ?? false,
      status: item.status ?? 'not_started',
    }));
    if (pendingNewRow) {
      rows.push({
        id: 'pending-new',
        index: rows.length,
        description: '',
        price: null,
        startDate: null,
        endDate: null,
        contractor: null,
        isAllocation: false,
        status: 'not_started' as const,
      });
    }
    return rows;
  }, [sowData, pendingNewRow]);

  const [orderedRows, setOrderedRows] = useState<LineItemRow[]>(tableRows);
  useEffect(() => {
    setOrderedRows(tableRows);
  }, [tableRows]);

  const totalPrice = tableRows.reduce((sum, row) => sum + (row.price ?? 0), 0);

  const columns = useMemo<ColumnDef<LineItemRow>[]>(
    () => [
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row, table }) => {
          const meta = table.options.meta as TableMeta;
          const isEditingRow = meta.editingRowIndex === row.original.index;
          if (!isEditingRow) {
            return <span className="max-w-[200px] truncate text-sm">{row.original.description}</span>;
          }
          const isNewRow = meta.pendingNewRow && isEditingRow;
          const sharedProps = {
            value: meta.editingRowData?.description || '',
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              meta.setEditingRowData((prev) => (prev ? { ...prev, description: e.target.value } : null)),
            placeholder: 'Item description',
            className: 'w-full text-sm',
            autoFocus: isNewRow,
          };
          return meta.isDescriptionNarrow ? (
            <textarea
              {...sharedProps}
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm
                ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2
                focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-50"
            />
          ) : (
            <Input {...sharedProps} />
          );
        },
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row, table }) => {
          const meta = table.options.meta as TableMeta;
          const isEditingRow = meta.editingRowIndex === row.original.index;
          return isEditingRow ? (
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">$</span>
              <Input
                value={meta.editingRowData?.price || ''}
                onChange={(e) => {
                  // Allow only digits and a single decimal point
                  const raw = e.target.value.replace(/[^\d.]/g, '');
                  const parts = raw.split('.');
                  const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
                  meta.setEditingRowData((prev) => (prev ? { ...prev, price: sanitized } : null));
                }}
                placeholder="0.00"
                type="text"
                inputMode="decimal"
                className="w-full pl-7"
              />
            </div>
          ) : (
            <span className="text-sm">
              {row.original.price !== null
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                    row.original.price
                  )
                : 'N/A'}
              {row.original.isAllocation && <span className="ml-1 text-xs text-slate-500">(A)</span>}
            </span>
          );
        },
      },
      {
        id: 'isAllocation',
        header: 'Allocation',
        cell: ({ row, table }) => {
          const meta = table.options.meta as TableMeta;
          const isEditingRow = meta.editingRowIndex === row.original.index;
          return isEditingRow ? (
            <input
              type="checkbox"
              checked={meta.editingRowData?.isAllocation ?? false}
              onChange={(e) =>
                meta.setEditingRowData((prev) => (prev ? { ...prev, isAllocation: e.target.checked } : null))
              }
              className="h-4 w-4 rounded border-slate-300"
            />
          ) : null;
        },
      },
      {
        accessorKey: 'startDate',
        header: 'Start Date',
        cell: ({ row, table }) => {
          const meta = table.options.meta as TableMeta;
          const isEditingRow = meta.editingRowIndex === row.original.index;
          return isEditingRow ? (
            <Input
              value={meta.editingRowData?.startDate || ''}
              onChange={(e) =>
                meta.setEditingRowData((prev) => (prev ? { ...prev, startDate: e.target.value } : null))
              }
              type="date"
              className="w-full"
            />
          ) : (
            <span className="text-sm">{formatDate(row.original.startDate)}</span>
          );
        },
      },
      {
        accessorKey: 'endDate',
        header: 'End Date',
        cell: ({ row, table }) => {
          const meta = table.options.meta as TableMeta;
          const isEditingRow = meta.editingRowIndex === row.original.index;
          return isEditingRow ? (
            <Input
              value={meta.editingRowData?.endDate || ''}
              onChange={(e) =>
                meta.setEditingRowData((prev) => (prev ? { ...prev, endDate: e.target.value } : null))
              }
              type="date"
              className="w-full"
            />
          ) : (
            <span className="text-sm">{formatDate(row.original.endDate)}</span>
          );
        },
      },
      {
        accessorKey: 'contractor',
        header: 'Contractor',
        cell: ({ row, table }) => {
          const meta = table.options.meta as TableMeta;
          const isEditingRow = meta.editingRowIndex === row.original.index;
          return isEditingRow ? (
            <Input
              value={meta.editingRowData?.contractor || ''}
              onChange={(e) =>
                meta.setEditingRowData((prev) => (prev ? { ...prev, contractor: e.target.value } : null))
              }
              placeholder="Contractor name"
              className="w-full"
            />
          ) : (
            <span className="text-sm">{row.original.contractor || '--'}</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row, table }) => {
          const meta = table.options.meta as TableMeta;
          const isEditingRow = meta.editingRowIndex === row.original.index;
          const statusLabels: Record<string, string> = {
            not_started: 'Not Started',
            started: 'In Progress',
            completed: 'Completed',
          };
          return isEditingRow ? (
            <select
              value={meta.editingRowData?.status ?? 'not_started'}
              onChange={(e) =>
                meta.setEditingRowData((prev) =>
                  prev ? { ...prev, status: e.target.value as EditingRowData['status'] } : null
                )
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                ring-offset-background focus-visible:ring-2 focus-visible:ring-ring
                focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <option value="not_started">Not Started</option>
              <option value="started">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          ) : (
            <span className="text-sm">{statusLabels[row.original.status ?? 'not_started'] ?? '--'}</span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Quick Actions',
        cell: ({ row, table }) => {
          const meta = table.options.meta as TableMeta;
          const isEditingRow = meta.editingRowIndex === row.original.index;
          return (
            <div className="flex items-center gap-2">
              {isEditingRow ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => meta.handleSaveRow(row.original.index)}
                    disabled={meta.isSubmitting}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4 text-emerald-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={meta.handleCancelEditRow}
                    disabled={meta.isSubmitting}
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
                    onClick={() =>
                      meta.handleEditRow(row.original.index, meta.sowLineItems[row.original.index])
                    }
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => meta.handleDeleteRow(row.original.index)}
                    disabled={meta.isSubmitting}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [] // stable — all mutable values come through meta
  );

  const table = useReactTable({
    data: orderedRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    meta: {
      editingRowIndex,
      editingRowData,
      setEditingRowData,
      handleSaveRow,
      handleCancelEditRow,
      handleEditRow,
      handleDeleteRow,
      isSubmitting,
      sowLineItems: sowData?.lineItems ?? [],
      isDescriptionNarrow,
      pendingNewRow,
    } satisfies TableMeta,
  });

  return (
    <>
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
            {!isLoading && sowData && !isCreating && (
              <Button size="sm" variant="outline" onClick={handleViewPdf}>
                <FileText className="mr-2 h-4 w-4" />
                View PDF
              </Button>
            )}
            {isCreating && (
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
        <CardContent className="p-4">
          {isLoading ? (
            <div className="text-slate-500">Loading scope of work...</div>
          ) : isCreating ? (
            <form onSubmit={sowForm.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {sowForm.watch('lineItems').map((_item, index) => (
                  <div key={index} className="space-y-3 rounded-md border border-slate-200">
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
                      <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
                        <div className="flex items-center gap-1">
                          <Label
                            htmlFor={`lineItems.${index}.isAllocation`}
                            className="text-sm text-slate-500"
                          >
                            Allocation
                          </Label>
                          <span className="group relative cursor-help">
                            <Info className="h-3.5 w-3.5 text-slate-400" />
                            <span
                              className="absolute bottom-full left-1/2 mb-1 hidden w-48 -translate-x-1/2
                                rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block"
                            >
                              Check this box if this line item is an allocation vs a set price
                            </span>
                          </span>
                        </div>
                        <div className="flex h-10 items-center">
                          <input
                            id={`lineItems.${index}.isAllocation`}
                            type="checkbox"
                            {...sowForm.register(`lineItems.${index}.isAllocation`)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </div>
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
                    <div className="grid grid-cols-4 gap-3">
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
                      <div className="space-y-2">
                        <Label htmlFor={`lineItems.${index}.status`} className="text-sm text-slate-500">
                          Status
                        </Label>
                        <select
                          id={`lineItems.${index}.status`}
                          {...sowForm.register(`lineItems.${index}.status`)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                            ring-offset-background focus-visible:ring-2 focus-visible:ring-ring
                            focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="started">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
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
                      {
                        description: '',
                        price: '',
                        startDate: '',
                        endDate: '',
                        contractor: '',
                        isAllocation: false,
                        status: 'not_started' as const,
                      },
                    ],
                    { shouldDirty: true }
                  );
                }}
              >
                <Plus className="mr-2 ml-2 h-4" />
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        <TableHead className="w-8 px-2" />
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            ref={header.column.id === 'description' ? descriptionHeaderRef : undefined}
                            className={
                              header.column.id === 'description'
                                ? 'max-w-[350px]'
                                : header.column.id === 'price'
                                ? 'min-w-[140px]'
                                : header.column.id === 'contractor'
                                ? 'min-w-[140px]'
                                : ''
                            }
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={orderedRows.map((r) => r.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {table.getRowModel().rows.map((row) => (
                          <SortableTableRow key={row.id} row={row} table={table} />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-blue-50 text-sm font-medium text-blue-800">
                      <TableCell />
                      <TableCell>Total:</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                          totalPrice
                        )}
                      </TableCell>
                      {/* Placeholder cells for visible columns after price */}
                      {table
                        .getVisibleLeafColumns()
                        .slice(2)
                        .map((col) => (
                          <TableCell key={col.id}>--</TableCell>
                        ))}
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
              <Button type="button" size="sm" onClick={handleAddRow} disabled={editingRowIndex !== null}>
                <Plus className="mr-2 h-4 w-4" />
                Add Row
              </Button>
              {sowData.lineItems.some((item) => (item as any).isAllocation) && (
                <div className="px-4 pb-2 text-xs text-slate-500">
                  <span className="font-medium">(A)</span> — This line item is an allocation. Cost can be less
                  or more than the allocation based on materials pricing.
                </div>
              )}
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

      <Dialog open={!!pdfBlobUrl} onOpenChange={(open) => { if (!open) handleClosePdf(); }}>
        <DialogContent className="flex h-[90vh] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle>Scope of Work</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1">
            {pdfBlobUrl && (
              <iframe
                ref={iframeRef}
                src={pdfBlobUrl}
                className="h-full w-full rounded border-0"
                title="Scope of Work"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClosePdf}>
              Close
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print / Save as PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
