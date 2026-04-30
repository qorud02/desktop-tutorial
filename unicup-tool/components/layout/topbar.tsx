'use client';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const labels: Record<string, string> = {
  '': '대시보드',
  evaluations: '평가 관리',
  new: '신규 평가',
  result: '평가 결과',
  scenarios: '시나리오 비교',
  report: '1페이지 리포트',
};

export function Topbar() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);

  const crumbs = [{ label: '대시보드', href: '/' }, ...parts.map((p, i) => ({
    label: labels[p] ?? p,
    href: '/' + parts.slice(0, i + 1).join('/'),
  }))];

  return (
    <header className="fixed top-0 left-60 right-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/95 backdrop-blur px-6">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            <span className={i === crumbs.length - 1 ? 'text-slate-800 font-medium' : ''}>
              {c.label}
            </span>
          </span>
        ))}
      </nav>
    </header>
  );
}
