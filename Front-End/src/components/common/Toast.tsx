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
    success: <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" aria-hidden />,
    error: <AlertCircle className="h-5 w-5 shrink-0 text-red-500" aria-hidden />,
    warning: <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />,
    info: <Info className="h-5 w-5 shrink-0 text-sky-500" aria-hidden />,
  };

  const borderStyles = {
    success: 'border-green-200 bg-white dark:bg-stone-900 dark:border-green-900/60',
    error: 'border-red-200 bg-white dark:bg-stone-900 dark:border-red-900/60',
    warning: 'border-amber-200 bg-white dark:bg-stone-900 dark:border-amber-900/50',
    info: 'border-sky-200 bg-white dark:bg-stone-900 dark:border-sky-900/50',
  };

  const visibleCls = exiting || !entered ? 'translate-x-16 opacity-0' : 'translate-x-0 opacity-100';

  return (
    <div
      role="status"
      className={`fixed bottom-4 right-4 z-[100] flex max-w-sm gap-3 rounded-3xl border px-5 py-4 shadow-xl backdrop-blur-sm transition-all duration-300 ease-out ${visibleCls} ${borderStyles[type]}`}
    >
      {icons[type]}
      <p className="min-w-0 flex-1 text-sm font-medium text-stone-800 dark:text-stone-100">{message}</p>
      <button
        type="button"
        onClick={() => setExiting(true)}
        className="shrink-0 rounded-xl p-1 text-stone-500 transition hover:bg-stone-100 dark:hover:bg-stone-800"
        aria-label="Tutup"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
