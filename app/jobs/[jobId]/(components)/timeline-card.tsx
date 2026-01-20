'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { ScopeOfWork } from './types';
import { formatDate } from './utils';

type TimelineCardProps = {
  sowData: ScopeOfWork | null | undefined;
  changeOrders?: any[] | undefined;
  paymentDraws?: any[] | undefined;
  isLoading: boolean;
};

type TaskStatus = 'planning' | 'progress' | 'done' | 'planned';

type TimelineLineItem = {
  id: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  status: TaskStatus;
  plannedStart?: Date | null;
  plannedEnd?: Date | null;
};

export function TimelineCard({ sowData, isLoading }: TimelineCardProps) {
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

  // Only use scope of work line items
  if (!sowData?.lineItems || sowData.lineItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-slate-500">No timeline data available.</div>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Build line items with status
  const lineItems: TimelineLineItem[] = sowData.lineItems.map((item, index) => {
    const startDate = item.startDate ? new Date(item.startDate) : null;
    const endDate = item.endDate ? new Date(item.endDate) : null;

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(0, 0, 0, 0);

    let status: TaskStatus = 'planning';
    let plannedStart: Date | null = null;
    let plannedEnd: Date | null = null;

    if (startDate && endDate) {
      if (endDate < now) {
        status = 'done';
      } else if (startDate <= now) {
        status = 'progress';
      } else {
        status = 'planned';
      }
    } else if (startDate) {
      if (startDate < now) {
        status = 'progress';
      } else {
        status = 'planned';
      }
    } else {
      status = 'planning';
    }

    return {
      id: `item-${index}`,
      description: item.description,
      startDate,
      endDate,
      status,
      plannedStart: status === 'planned' ? startDate : null,
      plannedEnd: status === 'planned' ? endDate : null,
    };
  });

  // Calculate min and max dates from line items only
  const allDates = lineItems
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
          <div className="py-12 text-center text-slate-500">No timeline data available.</div>
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
  const cellUnit = useWeeks ? 7 : 1; // 1 week = 7 days, or 1 day
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
    if (useWeeks) {
      const daysDiff = Math.floor((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      return Math.floor(daysDiff / 7);
    } else {
      const daysDiff = Math.floor((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff;
    }
  };

  // Helper to format date for display in cells
  const formatDateCell = (date: Date): string => {
    // Show month/day format (e.g., "1/12" for January 12th)
    const month = date.getMonth() + 1; // getMonth() returns 0-11
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

  // Helper to get status color
  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case 'planning':
        return 'bg-blue-500';
      case 'progress':
        return 'bg-orange-500';
      case 'done':
        return 'bg-green-500';
      case 'planned':
        return 'bg-blue-200'; // Light blue for planned
      default:
        return 'bg-slate-300';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-sm text-slate-600">{formatDateRange()}</div>
        <div className="relative">
          {/* Fixed description column */}
          <div className="absolute top-0 left-0 z-20 w-48 border-r border-slate-200 bg-white">
            {/* Header spacer */}
            <div className="mb-2 border-b border-slate-200" style={{ minHeight: '28px' }}></div>
            {/* Line item labels */}
            {lineItems.map((item) => (
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
                  {lineItems.map((item) => {
                    const cellRange = getCellRange(item.startDate, item.endDate);
                    const isPlanned = item.status === 'planned';

                    return (
                      <div
                        key={item.id}
                        className="relative border-b border-slate-200"
                        style={{ minHeight: '60px' }}
                      >
                        {/* Timeline cells */}
                        <div className="relative flex" style={{ minHeight: '60px' }}>
                          {cellRange && (
                            <>
                              {/* Solid bar for actual dates */}
                              {!isPlanned && (
                                <>
                                  <div
                                    className={`absolute top-1/2 h-6 -translate-y-1/2 ${getStatusColor(
                                    item.status )}`}
                                    style={{
                                      left: `${(cellRange.startCell / totalCells) * 100}%`,
                                      width: `${
                                        ((cellRange.endCell - cellRange.startCell + 1) / totalCells) * 100
                                      }%`,
                                      opacity: 0.8,
                                    }}
                                  />
                                  {/* Status dot at start */}
                                  <div
                                    className={`absolute top-1/2 left-1 z-10 h-3 w-3 -translate-y-1/2
                                    rounded-full border-2 border-white ${getStatusColor(item.status)}`}
                                    style={{
                                      left: `${(cellRange.startCell / totalCells) * 100}%`,
                                    }}
                                  />
                                </>
                              )}
                              {/* Dashed bar for planned dates */}
                              {isPlanned && (
                                <>
                                  <div
                                    className="absolute top-1/2 h-6 -translate-y-1/2 border-2 border-dashed
                                      border-blue-400 bg-blue-100"
                                    style={{
                                      left: `${(cellRange.startCell / totalCells) * 100}%`,
                                      width: `${
                                        ((cellRange.endCell - cellRange.startCell + 1) / totalCells) * 100
                                      }%`,
                                    }}
                                  />
                                  {/* Status dot at start */}
                                  <div
                                    className="absolute top-1/2 left-1 z-10 h-3 w-3 -translate-y-1/2
                                      rounded-full border-2 border-white bg-blue-500"
                                    style={{
                                      left: `${(cellRange.startCell / totalCells) * 100}%`,
                                    }}
                                  />
                                </>
                              )}
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
        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-slate-700">Start/ Planning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-orange-500" />
            <span className="text-slate-700">Progress/ Hands-on</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-slate-700">Done/ Finished</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
