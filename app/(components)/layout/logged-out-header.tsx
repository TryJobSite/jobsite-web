import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../shadcn/ui/button';

export default function LoggedOutHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Image src="/Jobsite-logo.png" alt="Jobsite" width={120} height={40} className="object-contain" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a href="/#product" className="transition-colors hover:text-slate-600">
            Product
          </a>
          <a href="/#pricing" className="transition-colors hover:text-slate-600">
            Pricing
          </a>
          <a href="/#about" className="transition-colors hover:text-slate-600">
            About
          </a>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
