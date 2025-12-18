'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { ScopeOfWork, ChangeOrder, PaymentDraw } from './types';
import { formatDate, formatCurrency } from './utils';

type TimelineItem = {
  id: string;
  type: 'sow-line-item' | 'payment-draw' | 'change-order';
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  date: string | null; // For single-date items
  amount?: number | null;
  metadata?: {
    contractor?: string | null;
    status?: string;
  };
};

type TimelineCardProps = {
  sowData: ScopeOfWork | null | undefined;
  changeOrders: ChangeOrder[] | undefined;
  paymentDraws: PaymentDraw[] | undefined;
  isLoading: boolean;
};

export function TimelineCard({ sowData, changeOrders, paymentDraws, isLoading }: TimelineCardProps) {
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

  // Build timeline items from all sources
  const timelineItems: TimelineItem[] = [];

  // Add Scope of Work line items
  if (sowData?.lineItems) {
    sowData.lineItems.forEach((item, index) => {
      timelineItems.push({
        id: `sow-${index}`,
        type: 'sow-line-item',
        title: item.description,
        description: item.contractor || 'No contractor assigned',
        startDate: item.startDate || null,
        endDate: item.endDate || null,
        date: null,
        amount: item.price || null,
        metadata: {
          contractor: item.contractor || null,
        },
      });
    });
  }

  // Add Payment Draws
  if (paymentDraws) {
    paymentDraws.forEach((draw) => {
      timelineItems.push({
        id: `draw-${draw.paymentDrawId}`,
        type: 'payment-draw',
        title: `Payment Draw - ${formatCurrency(draw.paymentAmount)}`,
        description: draw.description || 'Payment draw',
        startDate: null,
        endDate: null,
        date: draw.expectedPaymentDate || draw.dateRequested || draw.createdAt,
        amount: draw.paymentAmount || null,
        metadata: {
          status: draw.status,
        },
      });
    });
  }

  // Add Change Orders
  if (changeOrders) {
    changeOrders.forEach((co) => {
      const total = co.lineItems.reduce((sum, item) => sum + (item.price || 0), 0);
      timelineItems.push({
        id: `co-${co.changeOrderId}`,
        type: 'change-order',
        title: `Change Order - ${formatCurrency(total)}`,
        description: co.notes || 'Change order',
        startDate: null,
        endDate: null,
        date: co.createdAt,
        amount: total,
        metadata: {
          status: (co as any).status || 'created',
        },
      });
    });
  }

  // Sort items by date (start date for range items, date for single-date items)
  timelineItems.sort((a, b) => {
    const dateA = a.startDate || a.date;
    const dateB = b.startDate || b.date;
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  // Group items by date ranges for parallel display
  const getItemDate = (item: TimelineItem): Date | null => {
    const dateStr = item.startDate || item.date;
    return dateStr ? new Date(dateStr) : null;
  };

  const getItemEndDate = (item: TimelineItem): Date | null => {
    if (item.endDate) return new Date(item.endDate);
    if (item.startDate) return new Date(item.startDate);
    if (item.date) return new Date(item.date);
    return null;
  };

  // Calculate timeline bounds
  const allDates = timelineItems
    .flatMap((item) => {
      const dates: Date[] = [];
      if (item.startDate) dates.push(new Date(item.startDate));
      if (item.endDate) dates.push(new Date(item.endDate));
      if (item.date) dates.push(new Date(item.date));
      return dates;
    })
    .filter((d) => !isNaN(d.getTime()));

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
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;

  // Assign lanes to items to show parallel items
  const assignLanes = (items: TimelineItem[]): Map<string, number> => {
    const lanes = new Map<string, number>();
    const sortedItems = [...items].sort((a, b) => {
      const startA = getItemDate(a)?.getTime() || 0;
      const startB = getItemDate(b)?.getTime() || 0;
      return startA - startB;
    });

    sortedItems.forEach((item) => {
      const itemStart = getItemDate(item)?.getTime() || 0;
      const itemEnd = getItemEndDate(item)?.getTime() || itemStart;

      // Find the first available lane
      let lane = 0;
      const occupiedLanes = Array.from(lanes.entries())
        .filter(([id, _]) => {
          const otherItem = sortedItems.find((i) => i.id === id);
          if (!otherItem) return false;
          const otherStart = getItemDate(otherItem)?.getTime() || 0;
          const otherEnd = getItemEndDate(otherItem)?.getTime() || otherStart;
          return itemStart < otherEnd && itemEnd > otherStart;
        })
        .map(([_, laneNum]) => laneNum);

      while (occupiedLanes.includes(lane)) {
        lane++;
      }

      lanes.set(item.id, lane);
    });

    return lanes;
  };

  const lanes = assignLanes(timelineItems);
  const maxLanes = Math.max(...Array.from(lanes.values()), 0) + 1;

  const getItemPosition = (item: TimelineItem): { left: number; width: number; top: number } => {
    const startDate = getItemDate(item);
    const endDate = getItemEndDate(item);

    if (!startDate) {
      return { left: 0, width: 0, top: 0 };
    }

    const daysFromStart = Math.max(
      0,
      Math.ceil((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const left = Math.min(100, (daysFromStart / totalDays) * 100);

    let width = 3; // Minimum width for single-day items (3%)
    if (endDate && endDate.getTime() !== startDate.getTime()) {
      const itemDays = Math.max(
        1,
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );
      width = Math.min(100 - left, (itemDays / totalDays) * 100);
    } else {
      width = Math.min(100 - left, 3);
    }

    const lane = lanes.get(item.id) || 0;
    const top = lane * 70 + 20;

    return { left: Math.max(0, left), width: Math.max(2, width), top };
  };

  const getItemColor = (type: TimelineItem['type'], status?: string): string => {
    if (type === 'sow-line-item') return 'bg-blue-500';
    if (type === 'payment-draw') {
      if (status === 'paid') return 'bg-emerald-500';
      if (status === 'requested') return 'bg-yellow-500';
      return 'bg-slate-500';
    }
    if (type === 'change-order') {
      if (status === 'paid') return 'bg-emerald-500';
      if (status === 'paymentRequested') return 'bg-yellow-500';
      return 'bg-purple-500';
    }
    return 'bg-slate-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto" style={{ minHeight: `${maxLanes * 70 + 100}px` }}>
          {/* Timeline axis */}
          <div className="absolute right-0 bottom-0 left-0 h-1 bg-slate-200" style={{ minWidth: '100%' }} />
          <div className="absolute bottom-0 left-0 h-3 w-0.5 bg-slate-400" />
          <div className="absolute right-0 bottom-0 h-3 w-0.5 bg-slate-400" />

          {/* Date labels */}
          <div className="mb-2 flex justify-between text-xs text-slate-500">
            <span>{formatDate(minDate.toISOString())}</span>
            <span>{formatDate(maxDate.toISOString())}</span>
          </div>

          {/* Timeline items */}
          {timelineItems.map((item) => {
            const position = getItemPosition(item);
            if (position.width === 0) return null;

            return (
              <div
                key={item.id}
                className="absolute rounded-md border border-white/20 p-2 text-xs shadow-md transition-all
                  hover:z-10 hover:scale-105"
                style={{
                  left: `${position.left}%`,
                  width: `${position.width}%`,
                  top: `${position.top}px`,
                  backgroundColor: getItemColor(item.type, item.metadata?.status),
                  color: 'white',
                  minWidth: position.width < 5 ? '80px' : '120px',
                  zIndex: 1,
                }}
                title={`${item.title} - ${item.description}`}
              >
                <div className="truncate font-medium">{item.title}</div>
                {position.width >= 5 && (
                  <>
                    <div className="truncate text-xs opacity-90">{item.description}</div>
                    {item.amount && (
                      <div className="mt-1 text-xs font-semibold">{formatCurrency(item.amount)}</div>
                    )}
                    {item.startDate && item.endDate && (
                      <div className="mt-1 text-xs opacity-75">
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                      </div>
                    )}
                    {item.date && !item.startDate && (
                      <div className="mt-1 text-xs opacity-75">{formatDate(item.date)}</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-blue-500" />
            <span>Scope of Work</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-purple-500" />
            <span>Change Order</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-yellow-500" />
            <span>Payment Draw (Requested)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-emerald-500" />
            <span>Paid</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
