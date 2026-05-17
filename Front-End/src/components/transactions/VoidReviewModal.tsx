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

  const panelCls = `${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-[#E2E8F0]'} border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden`;
  const inputCls = `w-full rounded-xl border px-4 py-3 outline-none transition-all focus:border-teal-400 focus:bg-white ${
    isDark ? 'border-stone-800 bg-stone-950 text-white focus:ring-1 focus:ring-teal-500' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]'
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
        <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
            {action === 'approve' ? 'Setujui Pembatalan' : 'Tolak Pembatalan'}
          </h2>
          <button type="button" aria-label="Tutup" onClick={() => !loading && onClose()} className={`rounded-lg p-2 transition-colors ${isDark ? 'text-stone-500 hover:bg-stone-800' : 'text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]'}`}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div className={`rounded-xl border px-4 py-3 text-xs space-y-1 ${isDark ? 'border-stone-800 bg-stone-950 text-stone-300' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'}`}>
            <div className="flex justify-between">
              <span>Total Transaksi</span>
              <span className="font-bold text-teal-600">{format(t.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir</span>
              <span className="font-semibold">{t.cashier_name}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
              <p className="font-bold text-[10px] uppercase tracking-wider opacity-60">Alasan Kasir:</p>
              <p className="mt-1">{t.void_reason || '-'}</p>
            </div>
          </div>
          {action === 'approve' ? (
            <div className={`rounded-xl border px-4 py-3 text-xs font-medium leading-relaxed ${isDark ? 'border-red-900/40 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-800'}`}>
              ⚠️ Transaksi akan dibatalkan permanen. Data penjualan shift akan disesuaikan secara otomatis.
            </div>
          ) : null}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>
              {action === 'approve' ? 'Catatan (opsional)' : 'Alasan penolakan (wajib)'}
            </label>
            <textarea 
              className={`${inputCls} ${action === 'reject' ? 'min-h-[100px]' : 'min-h-[72px]'}`} 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              placeholder={action === 'approve' ? 'Catatan internal...' : 'Jelaskan alasan penolakan'} 
              required={action === 'reject'} 
            />
          </div>
          {err ? <p className="text-sm font-bold text-red-600">{err}</p> : null}
          <div className="flex gap-3 pt-2">
            <button type="button" disabled={loading} onClick={() => !loading && onClose()} className={`flex-1 rounded-xl py-3 text-sm font-bold border transition-all ${isDark ? 'border-stone-700 text-stone-200' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}>
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all ${action === 'approve' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'} ${loading ? 'opacity-70' : 'active:scale-[0.98]'}`}
            >
              {loading ? 'Menyimpan...' : action === 'approve' ? 'Setujui Void' : 'Tolak Permintaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
