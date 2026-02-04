'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/(components)/shadcn/ui/dialog';
import { Button } from '@/(components)/shadcn/ui/button';
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

type Bid = {
  bidId: string;
  title: string;
  description: string | null;
  lineItems: Array<{
    description: string;
    price?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    contractor?: string | null;
  }>;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

type SendBidEmailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bid: Bid | null;
  onSend: () => Promise<void>;
  isSubmitting: boolean;
};

export function SendBidEmailModal({ open, onOpenChange, bid, onSend, isSubmitting }: SendBidEmailModalProps) {
  if (!bid) return null;

  const totalPrice = bid.lineItems.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Bid to Client</DialogTitle>
          <DialogDescription>Review the email draft before sending to the client.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white p-6">
            <div className="space-y-4">
              {/* Email Header */}
              <div className="border-b border-slate-200 pb-4">
                <div className="text-sm text-slate-500">To:</div>
                <div className="font-medium">
                  {bid.customer
                    ? `${bid.customer.firstName} ${bid.customer.lastName} <${bid.customer.email}>`
                    : 'No customer email'}
                </div>
              </div>

              {/* Email Subject */}
              <div className="border-b border-slate-200 pb-4">
                <div className="text-sm text-slate-500">Subject:</div>
                <div className="font-medium">Bid Proposal: {bid.title}</div>
              </div>

              {/* Email Body */}
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-semibold text-slate-900">{bid.title}</div>
                </div>

                {bid.description && (
                  <div>
                    <div className="whitespace-pre-wrap text-slate-700">{bid.description}</div>
                  </div>
                )}

                {bid.lineItems && bid.lineItems.length > 0 && (
                  <div>
                    <div className="mb-3 text-lg font-semibold text-slate-900">Scope of Work</div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">
                              Description
                            </th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-slate-700">Price</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">
                              Start Date
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">
                              End Date
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">
                              Contractor
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {bid.lineItems.map((item, index) => (
                            <tr key={index} className="border-b border-slate-100">
                              <td className="px-4 py-3 text-sm text-slate-900">{item.description}</td>
                              <td className="px-4 py-3 text-right text-sm text-slate-900">
                                {item.price !== null && item.price !== undefined
                                  ? formatCurrency(item.price)
                                  : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-900">
                                {item.startDate ? formatDate(item.startDate) : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-900">
                                {item.endDate ? formatDate(item.endDate) : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-900">{item.contractor || 'N/A'}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50 font-semibold">
                            <td className="px-4 py-3 text-sm text-slate-900">Total</td>
                            <td className="px-4 py-3 text-right text-sm text-slate-900">
                              {formatCurrency(totalPrice)}
                            </td>
                            <td colSpan={3}></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={onSend} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Bid to Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
