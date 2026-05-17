import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setExiting(true), 2700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const t = window.setTimeout(onClose, 300);
    return () => clearTimeout(t);
  }, [exiting, onClose]);

  const icons = {
    success: (
      <div className="rounded-full p-1 bg-emerald-50 dark:bg-emerald-900/30">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
      </div>
    ),
    error: (
      <div className="rounded-full p-1 bg-red-50 dark:bg-red-900/30">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-500 dark:text-red-400" aria-hidden />
      </div>
    ),
    warning: (
      <div className="rounded-full p-1 bg-amber-50 dark:bg-amber-900/30">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400" aria-hidden />
      </div>
    ),
    info: (
      <div className="rounded-full p-1 bg-teal-50 dark:bg-teal-900/30">
        <Info className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
      </div>
    ),
  };

  const borderStyles = {
    success: 'border-emerald-200 bg-white dark:bg-stone-900 dark:border-green-900/60',
    error: 'border-red-200 bg-white dark:bg-stone-900 dark:border-red-900/60',
    warning: 'border-amber-200 bg-white dark:bg-stone-900 dark:border-amber-900/50',
    info: 'border-teal-200 bg-white dark:bg-stone-900 dark:border-sky-900/50',
  };

  const shadowStyle = 'shadow-lg shadow-slate-200/80 dark:shadow-black/30';
  const visibleCls = exiting || !entered ? 'translate-x-16 opacity-0' : 'translate-x-0 opacity-100';

  return (
    <div
      role="status"
      className={`fixed bottom-4 right-4 z-[100] pointer-events-none flex max-w-sm gap-3 rounded-3xl border px-5 py-4 backdrop-blur-sm transition-all duration-300 ease-out ${visibleCls} ${borderStyles[type]} ${shadowStyle}`}
    >
      <div className="shrink-0">
        {icons[type]}
      </div>
      <p className="min-w-0 flex-1 text-sm font-semibold self-center text-[#0F172A] dark:text-stone-100">{message}</p>
      <button
        type="button"
        onClick={() => setExiting(true)}
        className="pointer-events-auto shrink-0 self-center rounded-xl p-1 text-[#94A3B8] transition hover:text-[#475569] hover:bg-[#F1F5F9] dark:hover:bg-stone-800"
        aria-label="Tutup"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
