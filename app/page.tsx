'use client';

import Link from 'next/link';
import { Inter } from 'next/font/google';
import { Button } from '@/(components)/shadcn/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/(components)/shadcn/ui/card';
import { Check } from 'lucide-react';
import { useApi } from './(hooks)/useApi';
import { useQuery } from '@tanstack/react-query';

const inter = Inter({ subsets: ['latin'] });

const coreFeatures = [
  {
    title: 'Bid Smarter',
    description:
      'Generate accurate bids with cost templates, supplier price sync, and margin guidance built for specialty trades.',
  },
  {
    title: 'Contracts in Minutes',
    description:
      'Convert accepted bids into contracts with pre-built legal language, e-signatures, and client portals.',
  },
  {
    title: 'Stay on Top of Change Orders',
    description:
      'Track scope changes, approvals, and budget impact in real-time so nothing slips through the cracks.',
  },
];

const pricingTiers = [
  {
    name: 'Basic',
    price: '$39',
    cadence: 'per month',
    description: 'For solo contractors getting organized and winning more jobs.',
    features: [
      'Unlimited bid templates',
      'Digital estimate delivery',
      'Simple client approvals',
      'Dashboard for active jobs',
    ],
  },
  {
    name: 'Standard',
    price: '$89',
    cadence: 'per month',
    description: 'For growing crews that need visibility from bid to contract.',
    features: [
      'Everything in Basic',
      'Contract generation & e-sign',
      'Cost code and labor tracking',
      'Change order workflow with logs',
    ],
  },
  {
    name: 'Professional',
    price: '$149',
    cadence: 'per month',
    description: 'For established teams managing multiple projects and partners.',
    features: [
      'Everything in Standard',
      'Multi-project financial reporting',
      'Vendor and subcontractor portals',
      'API & accounting integrations',
    ],
  },
];

export default function Home() {
  const { api } = useApi();
  const { data } = useQuery({
    queryKey: ['home'],
    queryFn: () => api.GET('/test/foo', {}),
  });
  return (
    <div className={`${inter.className} flex min-h-screen flex-col bg-slate-50 text-slate-900`}>
      <main className="flex-1">
        <section
          id="product"
          className="border-b border-slate-200 bg-gradient-to-b from-white via-white to-slate-100"
        >
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 py-20 text-center">
            <span
              className="rounded-full bg-slate-200/60 px-3 py-1 text-xs font-semibold tracking-wide
                text-slate-600 uppercase"
            >
              Built for general contractors and subcontractors of all trades
            </span>
            <div className="max-w-3xl space-y-6">
              <h1 className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
                Win more bids, deliver rock-solid contracts, and stay ahead of change orders.
              </h1>
              <p className="text-lg text-slate-600">
                TradeForge keeps your estimating, contract management, and change order workflows in one
                place. Spend less time on paperwork and more time on job sites.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <a href="#cta">Get Started</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
            <div className="grid gap-6 pt-12 md:grid-cols-3">
              {coreFeatures.map((feature) => (
                <Card key={feature.title} className="h-full text-left">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-slate-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold tracking-widest text-slate-500 uppercase">Pricing</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Flexible plans for every crew size.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Start with the essentials or scale with advanced project controls. Cancel anytime.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {pricingTiers.map((tier) => (
                <Card key={tier.name} className="flex h-full flex-col border-slate-200 shadow-sm">
                  <CardHeader className="space-y-2">
                    <p className="text-sm font-semibold tracking-widest text-slate-500 uppercase">
                      {tier.name}
                    </p>
                    <div>
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="ml-2 text-sm text-slate-500">{tier.cadence}</span>
                    </div>
                    <CardDescription className="text-base text-slate-600">{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    <ul className="space-y-2 text-sm text-slate-600">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="px-6 pb-6">
                    <Button variant={tier.name === 'Standard' ? 'default' : 'outline'} className="w-full">
                      Choose {tier.name}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="bg-slate-100 py-20">
          <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 md:flex-row md:items-center">
            <div className="flex-1 space-y-5">
              <p className="text-sm font-semibold tracking-widest text-slate-500 uppercase">
                About TradeForge
              </p>
              <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Built with field-tested workflows, trusted by contractors nationwide.
              </h3>
              <p className="text-lg text-slate-600">
                TradeForge was crafted alongside estimators, project managers, and operations leaders from
                electrical, plumbing, HVAC, and specialty trade companies. We focus on the paperwork so crews
                can focus on craftsmanship.
              </p>
              <p className="text-lg text-slate-600">
                With dedicated onboarding, real-time support, and integrations with the tools you already use,
                we help businesses grow from bid to close-out.
              </p>
            </div>
            <Card className="flex-1 border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Why teams pick TradeForge</CardTitle>
                <CardDescription>
                  A single workspace for estimating, contracting, and change management across every project.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-slate-600">
                  {[
                    'Dedicated onboarding coach and success roadmap',
                    'Secure client and subcontractor collaboration portals',
                    'Real-time dashboards for pipeline, margins, and risk',
                    'Mobile-friendly experience for crews on the go',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="cta" className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h4 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to modernize your estimating and contract workflows?
            </h4>
            <p className="mt-4 text-lg text-slate-600">
              Join thousands of contractors who trust TradeForge to stay organized, profitable, and responsive
              to clients.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg">Start Free Trial</Button>
              <Button size="lg" variant="outline" asChild>
                <a href="mailto:sales@tradeforge.com">Talk to Sales</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div
          className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm
            text-slate-500 md:flex-row"
        >
          <p>© {new Date().getFullYear()} TradeForge. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#product" className="hover:text-slate-700">
              Product
            </Link>
            <Link href="#pricing" className="hover:text-slate-700">
              Pricing
            </Link>
            <Link href="#about" className="hover:text-slate-700">
              About
            </Link>
            <Link href="#cta" className="hover:text-slate-700">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
