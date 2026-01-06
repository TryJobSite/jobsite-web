'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Briefcase, Settings, LogOut, Users } from 'lucide-react';
import { Button } from '@/(components)/shadcn/ui/button';
import { useMe } from '@/(hooks)/useMe';
import { cn } from '@/utils/cn';

const navigationItems = [
  {
    name: 'Home',
    href: '/home',
    icon: Home,
  },
  {
    name: 'Jobs',
    href: '/jobs',
    icon: Briefcase,
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useMe();

  return (
    <aside className="flex h-screen w-44 flex-col border-r border-slate-200 bg-white">
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="mb-4 text-xl font-semibold tracking-tight">Job Site</div>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn('w-full justify-start gap-3', isActive && 'bg-primary text-primary-foreground')}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </div>
      <div className="border-t border-slate-200 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
