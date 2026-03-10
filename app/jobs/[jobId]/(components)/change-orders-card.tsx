'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Button } from '@/(components)/shadcn/ui/button';
import { Edit, Plus } from 'lucide-react';
import { ChangeOrder } from './types';
import { formatDate, formatStatus } from './utils';

type ChangeOrdersCardProps = {
  isLoading: boolean;
  changeOrders: ChangeOrder[] | undefined;
  onEdit: (changeOrder: ChangeOrder) => void;
  onCreate: () => void;
};

const changeOrderStatusToUI = {
  created: 'Created',
  paymentRequested: 'Payment Requested',
  paid: 'Paid',
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-800';
    case 'paymentRequested':
      return 'bg-yellow-100 text-yellow-800';
    case 'created':
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

export function ChangeOrdersCard({ isLoading, changeOrders, onEdit, onCreate }: ChangeOrdersCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Change Orders</CardTitle>
          {changeOrders && changeOrders.length > 0 && (
            <div className="text-sm">
              <span className="text-slate-500">Total: </span>
              <span className="text-lg font-bold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(
                  changeOrders.reduce(
                    (sum, changeOrder) =>
                      sum + changeOrder.lineItems.reduce((itemSum, item) => itemSum + (item.price || 0), 0),
                    0
                  )
                )}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-slate-500">Loading change orders...</div>
        ) : changeOrders && changeOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Creation Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Title</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Total Price</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {changeOrders.map((changeOrder) => {
                  const total = changeOrder.lineItems.reduce((sum, item) => sum + (item.price || 0), 0);
                  const status = (changeOrder as any).status || 'created';
                  return (
                    <tr
                      key={changeOrder.changeOrderId}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {formatDate(changeOrder.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{changeOrder.title}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(total)}
                        {changeOrder.lineItems.some((item) => (item as any).isAllocation) && (
                          <span className="ml-1 text-xs font-normal text-slate-500">(A)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                            ${getStatusColor(status)}`}
                        >
                          {changeOrderStatusToUI[status as keyof typeof changeOrderStatusToUI] || status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => onEdit(changeOrder)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-2 flex justify-start">
              <Button variant="outline" size="sm" onClick={onCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Change Order
              </Button>
            </div>
            {changeOrders.some((co) => co.lineItems.some((item) => (item as any).isAllocation)) && (
              <div className="mt-2 px-1 pb-1 text-xs text-slate-500">
                <span className="font-medium">(A)</span> — This line item is an allocation. Cost can be less or
                more than the allocation based on materials pricing.
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-slate-500">No change orders have been created yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
