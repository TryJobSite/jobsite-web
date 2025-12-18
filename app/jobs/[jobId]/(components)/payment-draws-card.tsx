'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Button } from '@/(components)/shadcn/ui/button';
import { Plus, Edit } from 'lucide-react';
import { PaymentDraw } from './types';
import { formatCurrency, formatDate } from './utils';

type PaymentDrawsCardProps = {
  paymentDraws: PaymentDraw[] | undefined;
  onView: (paymentDraw: PaymentDraw) => void;
  onEdit: (paymentDraw: PaymentDraw) => void;
  onCreate: () => void;
};

export function PaymentDrawsCard({ paymentDraws, onView, onEdit, onCreate }: PaymentDrawsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Payment Draws</CardTitle>
          {paymentDraws && paymentDraws.length > 0 && (
            <div className="text-sm">
              <span className="text-slate-500">Total: </span>
              <span className="text-lg font-bold">
                {formatCurrency(paymentDraws.reduce((sum, draw) => sum + (draw.paymentAmount || 0), 0))}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {paymentDraws && paymentDraws.length > 0 ? (
          <div className="space-y-2">
            {paymentDraws.map((draw) => (
              <div
                key={draw.paymentDrawId}
                onClick={() => onView(draw)}
                className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200
                  p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="min-w-[120px]">
                      <div className="text-sm text-slate-500">Amount</div>
                      <div className="font-medium">{formatCurrency(draw.paymentAmount)}</div>
                    </div>
                    <div className="min-w-[120px]">
                      <div className="text-sm text-slate-500">Status</div>
                      <div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                            ${
                              draw.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : draw.status === 'requested'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                        >
                          {draw.status.charAt(0).toUpperCase() + draw.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-[150px]">
                      <div className="text-sm text-slate-500">Expected Payment Date</div>
                      <div className="font-medium">{formatDate(draw.expectedPaymentDate)}</div>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(draw);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="mb-4 text-slate-500">No payment draws have been created yet.</p>
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Payment Draw
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
