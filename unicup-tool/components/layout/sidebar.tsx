'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, List, Building2, Zap, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoutButton } from './logout-button';
import type { Plan } from '@/lib/subscription';

const nav = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/evaluations/new', label: '신규 평가', icon: PlusCircle },
  { href: '/evaluations', label: '저장된 평가', icon: List },
];

export function Sidebar({ userEmail, plan }: { userEmail: string; plan: Plan }) {
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

        {/* Pricing link */}
        <Link
          href="/pricing"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            pathname.startsWith('/pricing')
              ? 'bg-white/15 text-white'
              : 'text-blue-200 hover:bg-white/10 hover:text-white'
          )}
        >
          <CreditCard className="h-4 w-4 flex-shrink-0" />
          요금제
        </Link>
      </nav>

      {/* Plan badge + upgrade prompt */}
      <div className="px-3 pb-3">
        {plan === 'pro' ? (
          <div className="flex items-center gap-2 rounded-lg bg-blue-600/20 border border-blue-400/30 px-3 py-2">
            <Zap className="h-3.5 w-3.5 text-blue-300 flex-shrink-0" />
            <span className="text-xs font-semibold text-blue-200">Pro 플랜</span>
          </div>
        ) : (
          <Link
            href="/pricing"
            className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2 hover:bg-white/10 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-300 font-medium">Free 플랜</span>
            </div>
            <span className="text-xs text-blue-400 group-hover:text-white transition-colors font-medium">
              업그레이드 →
            </span>
          </Link>
        )}
      </div>

      <LogoutButton email={userEmail} />
    </aside>
  );
}
