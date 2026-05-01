import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'Unicup 입지·매출 의사결정 도구',
  description: '유니컵 프랜차이즈 입지 평가 내부 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
