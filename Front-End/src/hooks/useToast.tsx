import { useCallback, useState } from 'react';
import Toast from '../components/common/Toast';
import type { ToastProps } from '../components/common/Toast';

type ToastType = ToastProps['type'];

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const dismiss = useCallback(() => setToast(null), []);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const ToastComponent =
    toast !== null ? (
      <Toast key={toast.id} message={toast.message} type={toast.type} onClose={dismiss} />
    ) : null;

  return { showToast, ToastComponent };
}
