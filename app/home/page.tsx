'use client';
import { useMe } from '@/(hooks)/useMe';
import { Card, CardContent } from '@/(components)/shadcn/ui/card';
import { Button } from '@/(components)/shadcn/ui/button';
import { Copy, Gift } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const { me } = useMe();
  const [copied, setCopied] = useState(false);
  const referralCode = me?.user?.referralCode;

  const handleCopyReferralCode = async () => {
    if (referralCode) {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {referralCode && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-slate-900">Refer & Earn $100</h3>
                </div>
                <p className="mb-4 text-slate-600">
                  Share your referral code and earn{' '}
                  <span className="font-semibold text-primary">$100 credit</span> for each successful
                  referral!
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 rounded-md border-2 border-primary/30 bg-white px-4 py-2 font-mono
                      text-lg font-semibold text-slate-900"
                  >
                    {referralCode}
                  </div>
                  <Button onClick={handleCopyReferralCode} variant="outline" size="lg" className="shrink-0">
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <div>
        Welcome, {me?.user?.firstName} with {me?.company?.companyName}
      </div>
    </div>
  );
}
