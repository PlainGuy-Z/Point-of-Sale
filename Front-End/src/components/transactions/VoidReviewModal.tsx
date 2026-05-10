import { useState } from 'react';
import { X } from 'lucide-react';
import type { HistoryTransaction } from '../../types/historyTransaction';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { appApi, ApiError } from '../../services/appApi';

interface VoidReviewModalProps {
  transaction: HistoryTransaction;
  action: 'approve' | 'reject';
  onClose: () => void;
  onSuccess: () => void;
  onToast?: (msg: string, type: 'success' | 'error') => void;
}

export default function VoidReviewModal({
  transaction: t,
  action,
  onClose,
  onSuccess,
  onToast,
}: VoidReviewModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const panelCls = `${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'} border rounded-3xl max-w-md w-full`;
  const inputCls = `w-full rounded-3xl border px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500/40 ${
    isDark ? 'border-stone-800 bg-stone-950 text-white' : 'border-stone-200 bg-white text-stone-900'
  }`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (action === 'reject' && note.trim().length < 1) {
      setErr('Catatan penolakan wajib.');
      return;
    }
    setLoading(true);
    try {
      if (action === 'approve') {
        await appApi.post(`/transactions/${encodeURIComponent(t.id)}/void-approve`, {
          note: note.trim() || undefined,
        });
        onToast?.('Void disetujui', 'success');
      } else {
        await appApi.post(`/transactions/${encodeURIComponent(t.id)}/void-reject`, {
          note: note.trim(),
        });
        onToast?.('Permintaan void ditolak', 'success');
      }
      onSuccess();
      onClose();
    } catch (ex) {
      const msg = ex instanceof ApiError ? ex.message : ex instanceof Error ? ex.message : 'Gagal memproses.';
      setErr(msg);
      onToast?.(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={(e) => !loading && e.target === e.currentTarget && onClose()}>
      <div className={panelCls}>
        <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
            {action === 'approve' ? 'Setujui Pembatalan' : 'Tolak Pembatalan'}
          </h2>
          <button type="button" aria-label="Tutup" onClick={() => !loading && onClose()} className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div className={`rounded-3xl border px-4 py-3 text-sm ${isDark ? 'border-stone-800 bg-stone-950 text-stone-300' : 'border-stone-200 bg-stone-50 text-stone-700'}`}>
            <p>Total {format(t.total_amount)} • Kasir {t.cashier_name}</p>
            <p className="mt-2 font-semibold">Alasan dari kasir</p>
            <p>{t.void_reason || '-'}</p>
          </div>
          {action === 'approve' ? (
            <div className={`rounded-3xl border px-4 py-3 text-xs ${isDark ? 'border-red-900/40 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-900'}`}>
              Transaksi akan dibatalkan permanen. Data penjualan shift (jika sudah tutup shift) akan disesuaikan.
            </div>
          ) : null}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
              {action === 'approve' ? 'Catatan (opsional)' : 'Alasan penolakan (wajib)'}
            </label>
            <textarea className={`${inputCls} ${action === 'reject' ? 'min-h-[100px]' : 'min-h-[72px]'}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder={action === 'approve' ? 'Catatan internal...' : 'Jelaskan alasan penolakan'} required={action === 'reject'} />
          </div>
          {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
          <div className="flex gap-3">
            <button type="button" disabled={loading} onClick={() => !loading && onClose()} className="flex-1 rounded-3xl border border-stone-300 py-3 text-sm font-bold dark:border-stone-600 dark:text-stone-200">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-3xl py-3 text-sm font-bold text-white ${action === 'approve' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'} ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? 'Menyimpan...' : action === 'approve' ? 'Setujui Void' : 'Tolak Permintaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
