'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Button } from '@/(components)/shadcn/ui/button';
import { Input } from '@/(components)/shadcn/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/(components)/shadcn/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/(components)/shadcn/ui/dialog';
import { Plus, Trash2, Edit2, Check, X, GripVertical, FileText, Printer } from 'lucide-react';
import { useApi } from '@/(hooks)/useApi';
import { useMe } from '@/(hooks)/useMe';

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
  bidLineItemId?: string;
  description: string;
  price?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  contractor?: string | null;
  isAllocation?: boolean;
};

type Bid = {
  bidId: string;
  title?: string | null;
  description?: string | null;
  lineItems: BidLineItem[];
  customer?: { firstName: string; lastName: string } | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  estimatedStartDate?: string | null;
  estimatedEndDate?: string | null;
  notes?: string | null;
};

type BidLineItemsCardProps = {
  bidId: string;
  bid: Bid | null | undefined;
  disabled: boolean;
};

type EditingRowData = {
  description: string;
  price?: string;
  startDate?: string;
  endDate?: string;
  contractor?: string;
  isAllocation?: boolean;
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
  bidLineItems: BidLineItem[];
  isDescriptionNarrow: boolean;
  pendingNewRow: boolean;
  disabled: boolean;
};

function SortableTableRow({
  row,
  table,
}: {
  row: Row<LineItemRow>;
  table: TanTable<LineItemRow>;
}) {
  const meta = table.options.meta as TableMeta;
  const isEditingRow = meta.editingRowIndex === row.original.index;
  const isTallRow = isEditingRow && meta.isDescriptionNarrow;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.original.id,
    disabled: isEditingRow || meta.editingRowIndex !== null || meta.disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isTallRow ? '[&>td]:align-top' : ''}>
      <TableCell className="w-8 px-2">
        {!isEditingRow && meta.editingRowIndex === null && !meta.disabled && (
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
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function BidLineItemsCard({ bidId, bid, disabled }: BidLineItemsCardProps) {
  const { api } = useApi();
  const queryClient = useQueryClient();
  const { me } = useMe();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
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

  useEffect(() => {
    setColumnVisibility({ isAllocation: editingRowIndex !== null });
  }, [editingRowIndex]);

  useEffect(() => {
    const el = descriptionHeaderRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setIsDescriptionNarrow(entry.contentRect.width < 150);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  useEffect(() => {
    if (bid && bid.lineItems.length > 0) {
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
  }, [bid, lineItemsForm]);

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
        params: { path: { bidId } },
        body: { lineItems },
      });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
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

  const handleAddRow = () => {
    if (!bid) return;
    const newIndex = bid.lineItems.length;
    setPendingNewRow(true);
    setEditingRowIndex(newIndex);
    setEditingRowData({
      description: '',
      price: '',
      startDate: '',
      endDate: '',
      contractor: '',
      isAllocation: false,
    });
  };

  const handleCancelEditRow = () => {
    setEditingRowIndex(null);
    setEditingRowData(null);
    setPendingNewRow(false);
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
    await onSubmit({ lineItems: updatedLineItems });
    setEditingRowIndex(null);
    setEditingRowData(null);
    setPendingNewRow(false);
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
    await onSubmit({ lineItems: updatedLineItems });
  };

  const tableRows: LineItemRow[] = useMemo(() => {
    const rows = (bid?.lineItems ?? []).map((item, index) => ({
      id: item.bidLineItemId ?? `row-${index}`,
      index,
      description: item.description,
      price: item.price ?? null,
      startDate: item.startDate ?? null,
      endDate: item.endDate ?? null,
      contractor: item.contractor ?? null,
      isAllocation: item.isAllocation ?? false,
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
      });
    }
    return rows;
  }, [bid, pendingNewRow]);

  const [orderedRows, setOrderedRows] = useState<LineItemRow[]>(tableRows);
  useEffect(() => {
    setOrderedRows(tableRows);
  }, [tableRows]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedRows.findIndex((r) => r.id === active.id);
    const newIndex = orderedRows.findIndex((r) => r.id === over.id);
    const newOrder = arrayMove(orderedRows, oldIndex, newIndex);
    setOrderedRows(newOrder);

    try {
      await api.PATCH('/bids/reorder/{bidId}', {
        params: { path: { bidId } },
        body: {
          lineItems: newOrder
            .filter((r) => r.id !== 'pending-new')
            .map((r, i) => ({ bidLineItemId: r.id, sortOrder: i + 1 })),
        },
      });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
    } catch (error) {
      console.error('Reorder error:', error);
      setOrderedRows(orderedRows); // revert on error
    }
  };

  const totalPrice = orderedRows.reduce((sum, row) => sum + (row.price ?? 0), 0);

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
                      meta.handleEditRow(row.original.index, meta.bidLineItems[row.original.index])
                    }
                    disabled={meta.disabled}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => meta.handleDeleteRow(row.original.index)}
                    disabled={meta.isSubmitting || meta.disabled}
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
    []
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
      bidLineItems: bid?.lineItems ?? [],
      isDescriptionNarrow,
      pendingNewRow,
      disabled,
    } satisfies TableMeta,
  });

  const buildPdfHtml = () => {
    if (!bid) return '';

    const companyName = me?.company?.companyName ?? '';
    const companyLogoUrl = me?.company?.companyLogoUrl;

    const fmtDate = (d: string | null | undefined) => {
      if (!d) return 'N/A';
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const fmtCurrency = (n: number | null | undefined) => {
      if (n === null || n === undefined) return 'N/A';
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    };

    const address = [bid.addressLine1, bid.addressLine2, bid.city, bid.state, bid.postalCode]
      .filter(Boolean)
      .join(', ');

    const hasAllocations = orderedRows.some((r) => r.isAllocation);
    const total = orderedRows.reduce((sum, r) => sum + (r.price ?? 0), 0);

    const rowsHtml = orderedRows
      .map(
        (r) => `
        <tr>
          <td>${r.description}</td>
          <td style="text-align:right">${r.price !== null ? fmtCurrency(r.price) + (r.isAllocation ? ' (A)' : '') : 'N/A'}</td>
          <td>${r.contractor || 'N/A'}</td>
        </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Statement of Work</title>
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
  </style>
</head>
<body>
  ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="${companyName}" style="max-height:80px;max-width:300px;object-fit:contain;display:block;margin-bottom:8px;" />` : `<h1>${companyName}</h1>`}
  <hr />
  <h2>Scope of Work</h2>
  <div class="meta">
    ${bid.title ? `<div><strong>Job Title:</strong> ${bid.title}</div>` : ''}
    ${bid.description ? `<div><strong>Description:</strong> ${bid.description}</div>` : ''}
    ${bid.customer ? `<div><strong>Client:</strong> ${bid.customer.firstName} ${bid.customer.lastName}</div>` : ''}
    ${address ? `<div><strong>Job Address:</strong> ${address}</div>` : ''}
    ${bid.estimatedStartDate ? `<div><strong>Est. Start Date:</strong> ${fmtDate(bid.estimatedStartDate)}</div>` : ''}
    ${bid.estimatedEndDate ? `<div><strong>Est. End Date:</strong> ${fmtDate(bid.estimatedEndDate)}</div>` : ''}
  </div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:right">Price</th>
        <th>Contractor</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="total">Total: ${fmtCurrency(total)}</div>
  ${hasAllocations ? `<div class="allocation-note">(A) - This line item is an allocation. Cost can be less or more than the allocation based on materials pricing.</div>` : ''}
  ${bid.notes ? `<h3>Notes</h3><div class="notes">${bid.notes}</div>` : ''}
</body>
</html>`;
  };

  const handleViewPDF = () => {
    const html = buildPdfHtml();
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setPdfBlobUrl(url);
    setPdfModalOpen(true);
  };

  const handleClosePdfModal = () => {
    setPdfModalOpen(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  if (!bid) return null;

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Statement of Work</CardTitle>
          <div className="flex items-center gap-4">
            {bid.lineItems.length > 0 && (
              <div className="text-sm">
                <span className="text-slate-500">Total: </span>
                <span className="text-lg font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice)}
                </span>
              </div>
            )}
            {bid.lineItems.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleViewPDF}>
                <FileText className="mr-2 h-4 w-4" />
                View PDF
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
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
                            ? 'w-2/5'
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
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
          <Button
            type="button"
            size="sm"
            onClick={handleAddRow}
            disabled={editingRowIndex !== null || disabled}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Row
          </Button>
          {bid.lineItems.some((item) => item.isAllocation) && (
            <div className="px-4 pb-2 text-xs text-slate-500">
              <span className="font-medium">(A)</span> — This line item is an allocation. Cost can be less or
              more than the allocation based on materials pricing.
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    <Dialog open={pdfModalOpen} onOpenChange={(open) => { if (!open) handleClosePdfModal(); }}>
      <DialogContent className="flex h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>Statement of Work</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1">
          {pdfBlobUrl && (
            <iframe ref={iframeRef} src={pdfBlobUrl} className="h-full w-full rounded border-0" title="Statement of Work" />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClosePdfModal}>
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
