'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, List, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoutButton } from './logout-button';

const nav = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/evaluations/new', label: '신규 평가', icon: PlusCircle },
  { href: '/evaluations', label: '저장된 평가', icon: List },
];

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-60 flex-col border-r border-slate-200 bg-[#0f2744]">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-white/10">
        <Building2 className="h-6 w-6 text-blue-300" />
        <div>
          <div className="text-sm font-bold text-white leading-none">UNICUP</div>
          <div className="text-xs text-blue-200 mt-0.5">입지분석 시스템</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <LogoutButton email={userEmail} />
    </aside>
  );
}
