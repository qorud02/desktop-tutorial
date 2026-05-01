'use client';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType }
interface ToastCtx { toast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast: t, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => { return () => {}; }, []);
  const Icon = t.type === 'success' ? CheckCircle : t.type === 'error' ? AlertCircle : Info;
  const colors = {
    success: 'bg-white border-emerald-200 text-emerald-700',
    error: 'bg-white border-red-200 text-red-700',
    info: 'bg-white border-blue-200 text-blue-700',
  };
  const iconColors = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    info: 'text-blue-500',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-xl border shadow-lg px-4 py-3 text-sm font-medium min-w-64 max-w-sm animate-in slide-in-from-right-4 fade-in ${colors[t.type]}`}
    >
      <Icon className={`h-4 w-4 flex-shrink-0 ${iconColors[t.type]}`} />
      <span className="flex-1 text-slate-700">{t.message}</span>
      <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
