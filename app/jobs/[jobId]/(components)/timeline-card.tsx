'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Button } from '@/(components)/shadcn/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/(components)/shadcn/ui/dialog';
import { FileText, Printer } from 'lucide-react';
import { useMe } from '@/(hooks)/useMe';

type TimelineLineItemInput = {
  description: string;
  startDate: string | null;
  endDate: string | null;
  status?: 'not_started' | 'started' | 'completed';
};

type TimelineCardProps = {
  lineItems: TimelineLineItemInput[] | null | undefined;
  isLoading: boolean;
  useItemStatus?: boolean;
};

type DisplayStatus = 'not_started' | 'started' | 'completed';

type TimelineLineItem = {
  id: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  displayStatus: DisplayStatus;
};

export function TimelineCard({ lineItems, isLoading, useItemStatus = false }: TimelineCardProps) {
  const { me } = useMe();
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-500">Loading timeline...</div>
        </CardContent>
      </Card>
    );
  }

  if (!lineItems || lineItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-slate-500">
            No timeline data available. Add scope of work line items to see the timeline.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Build line items with display status
  const timelineItems: TimelineLineItem[] = lineItems.map((item, index) => {
    const startDate = item.startDate ? new Date(item.startDate) : null;
    const endDate = item.endDate ? new Date(item.endDate) : null;

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(0, 0, 0, 0);

    let displayStatus: DisplayStatus = 'not_started';
    if (useItemStatus && item.status) {
      displayStatus = item.status;
    }

    return {
      id: `item-${index}`,
      description: item.description,
      startDate,
      endDate,
      displayStatus,
    };
  });

  // Calculate min and max dates from line items only
  const allDates = timelineItems
    .flatMap((item) => {
      const dates: Date[] = [];
      if (item.startDate) dates.push(item.startDate);
      if (item.endDate) dates.push(item.endDate);
      return dates;
    })
    .filter((d) => d && !isNaN(d.getTime()));

  if (allDates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-slate-500">
            No timeline data available. Add start/end dates to see the timeline.
          </div>
        </CardContent>
      </Card>
    );
  }

  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  minDate.setHours(0, 0, 0, 0);
  maxDate.setHours(0, 0, 0, 0);

  // Calculate total days
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Determine if we should use days or weeks
  const useWeeks = totalDays > 28;
  const cellUnit = useWeeks ? 7 : 1;
  const totalCells = useWeeks ? Math.ceil(totalDays / 7) : totalDays;

  // Generate date cells
  const dateCells: Date[] = [];
  for (let i = 0; i < totalCells; i++) {
    const cellDate = new Date(minDate);
    cellDate.setDate(minDate.getDate() + i * cellUnit);
    dateCells.push(cellDate);
  }

  // Helper to get cell index for a date
  const getCellIndex = (date: Date): number => {
    const daysDiff = Math.floor((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return useWeeks ? Math.floor(daysDiff / 7) : daysDiff;
  };

  // Helper to format date for display in cells
  const formatDateCell = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  // Format date range header
  const formatDateRange = (): string => {
    const startMonth = minDate.toLocaleDateString('en-US', { month: 'long' });
    const endMonth = maxDate.toLocaleDateString('en-US', { month: 'long' });
    const startDay = minDate.getDate();
    const endDay = maxDate.getDate();
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  // Helper to get status color (Tailwind classes)
  const getStatusColor = (status: DisplayStatus): string => {
    switch (status) {
      case 'not_started':
        return 'bg-blue-500';
      case 'started':
        return 'bg-orange-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Helper to get status colors for PDF (hex)
  const getStatusColorHex = (status: DisplayStatus): { fill: string; dot: string } => {
    switch (status) {
      case 'not_started':
        return { fill: '#bfdbfe', dot: '#3b82f6' };
      case 'started':
        return { fill: '#fed7aa', dot: '#f97316' };
      case 'completed':
        return { fill: '#bbf7d0', dot: '#22c55e' };
      default:
        return { fill: '#bfdbfe', dot: '#3b82f6' };
    }
  };

  // Helper to get cell range for a date range
  const getCellRange = (
    start: Date | null,
    end: Date | null
  ): { startCell: number; endCell: number } | null => {
    if (!start && !end) return null;

    let startCell = 0;
    let endCell = totalCells - 1;

    if (start) {
      startCell = getCellIndex(start);
      if (startCell < 0) startCell = 0;
      if (startCell >= totalCells) startCell = totalCells - 1;
    }
    if (end) {
      endCell = getCellIndex(end);
      if (endCell < 0) endCell = 0;
      if (endCell >= totalCells) endCell = totalCells - 1;
    }

    return { startCell, endCell };
  };

  // PDF generation
  const buildTimelineHtml = () => {
    const companyName = me?.company?.companyName ?? '';

    const headerCells = dateCells
      .map(
        (d) =>
          `<th style="text-align:center;padding:4px 2px;font-size:10px;color:#555;border-left:1px solid #e5e7eb;border-bottom:1px solid #d1d5db;font-weight:normal">${formatDateCell(d)}</th>`
      )
      .join('');

    const rowsHtml = timelineItems
      .map((item) => {
        const cellRange = getCellRange(item.startDate, item.endDate);
        const { fill } = getStatusColorHex(item.displayStatus);

        const cells = dateCells
          .map((_, i) => {
            if (cellRange && i >= cellRange.startCell && i <= cellRange.endCell) {
              return `<td style="background:${fill};padding:0;border-left:1px solid #e5e7eb;border-bottom:1px solid #f3f4f6"></td>`;
            }
            return `<td style="border-left:1px solid #e5e7eb;border-bottom:1px solid #f3f4f6"></td>`;
          })
          .join('');

        return `<tr>
          <td style="padding:8px 10px;font-weight:600;font-size:11px;border-bottom:1px solid #f3f4f6;border-right:1px solid #d1d5db;white-space:nowrap">${item.description}</td>
          ${cells}
        </tr>`;
      })
      .join('');

    const legendHtml = useItemStatus
      ? `<div style="margin-top:16px;display:flex;gap:20px;font-size:11px;color:#374151">
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#3b82f6;margin-right:5px;vertical-align:middle"></span>Not Started</span>
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f97316;margin-right:5px;vertical-align:middle"></span>In Progress</span>
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#22c55e;margin-right:5px;vertical-align:middle"></span>Completed</span>
        </div>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Timeline</title>
  <style>
    @page { size: A4 landscape; margin: 15mm 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; }
    h1 { font-size: 24px; font-weight: bold; margin-bottom: 24px; }
    hr { border: none; border-top: 1px solid #ccc; margin-bottom: 24px; }
    h2 { font-size: 16px; font-weight: bold; margin-bottom: 6px; }
    .date-range { font-size: 12px; color: #6b7280; margin-bottom: 14px; }
    table { border-collapse: collapse; width: 100%; table-layout: auto; }
  </style>
</head>
<body>
  <h1>${companyName}</h1>
  <hr />
  <h2>Timeline</h2>
  <div class="date-range">${formatDateRange()}</div>
  <table>
    <thead>
      <tr>
        <th style="text-align:left;padding:4px 10px;font-size:11px;border-bottom:1px solid #d1d5db;border-right:1px solid #d1d5db;white-space:nowrap;min-width:140px"></th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  ${legendHtml}
</body>
</html>`;
  };

  const handleViewPDF = () => {
    const html = buildTimelineHtml();
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Timeline</CardTitle>
            <Button size="sm" variant="outline" onClick={handleViewPDF}>
              <FileText className="mr-2 h-4 w-4" />
              View PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-sm text-slate-600">{formatDateRange()}</div>
          <div className="relative">
            {/* Fixed description column */}
            <div className="absolute top-0 left-0 z-20 w-48 border-r border-slate-200 bg-white">
              {/* Header spacer */}
              <div className="mb-2 border-b border-slate-200" style={{ minHeight: '28px' }}></div>
              {/* Line item labels */}
              {timelineItems.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-slate-200 bg-white px-3 py-3 text-sm"
                  style={{ minHeight: '60px' }}
                >
                  <div className="truncate font-medium text-slate-900">{item.description}</div>
                </div>
              ))}
            </div>

            {/* Scrollable time cells */}
            <div className="overflow-x-auto pl-48">
              <div className="inline-block min-w-full">
                {/* Header with dates */}
                <div className="mb-2 flex">
                  {dateCells.map((date, index) => (
                    <div
                      key={index}
                      className="flex-1 border-l border-slate-200 px-1 text-center text-xs text-slate-600"
                      style={{ minWidth: '60px' }}
                    >
                      {formatDateCell(date)}
                    </div>
                  ))}
                </div>

                {/* Grid lines */}
                <div className="relative">
                  {/* Vertical grid lines */}
                  <div className="absolute inset-0 flex">
                    {dateCells.map((_, index) => (
                      <div
                        key={index}
                        className="flex-1 border-l border-slate-200"
                        style={{ minWidth: '60px' }}
                      ></div>
                    ))}
                  </div>

                  {/* Line items */}
                  <div className="relative">
                    {timelineItems.map((item) => {
                      const cellRange = getCellRange(item.startDate, item.endDate);

                      return (
                        <div
                          key={item.id}
                          className="relative border-b border-slate-200"
                          style={{ minHeight: '60px' }}
                        >
                          <div className="relative flex" style={{ minHeight: '60px' }}>
                            {cellRange && (
                              <>
                                <div
                                  className={`absolute top-1/2 h-6 -translate-y-1/2 ${getStatusColor(item.displayStatus)}`}
                                  style={{
                                    left: `${(cellRange.startCell / totalCells) * 100}%`,
                                    width: `${((cellRange.endCell - cellRange.startCell + 1) / totalCells) * 100}%`,
                                    opacity: 0.8,
                                  }}
                                />
                              </>
                            )}
                            {dateCells.map((_, cellIndex) => (
                              <div
                                key={cellIndex}
                                className="relative flex-1 border-l border-slate-200"
                                style={{ minWidth: '60px' }}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          {useItemStatus && (
            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-slate-700">Not Started</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-slate-700">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-slate-700">Completed</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={pdfModalOpen} onOpenChange={(open) => { if (!open) handleClosePdfModal(); }}>
        <DialogContent className="flex h-[90vh] max-w-5xl flex-col">
          <DialogHeader>
            <DialogTitle>Timeline</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1">
            {pdfBlobUrl && (
              <iframe
                ref={iframeRef}
                src={pdfBlobUrl}
                className="h-full w-full rounded border-0"
                title="Timeline"
              />
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
