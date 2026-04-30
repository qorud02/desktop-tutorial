'use client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton({ email }: { email: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="border-t border-white/10 px-4 py-4 space-y-3">
      <div>
        <p className="text-xs text-blue-300/70 truncate">{email}</p>
        <p className="text-xs text-blue-300/40 mt-0.5">내부 전용 시스템</p>
      </div>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        로그아웃
      </button>
    </div>
  );
}
