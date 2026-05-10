import { useState } from 'react';
import { X } from 'lucide-react';
import type { HistoryTransaction } from '../../types/historyTransaction';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { appApi, ApiError } from '../../services/appApi';

interface VoidRequestModalProps {
  transaction: HistoryTransaction;
  onClose: () => void;
  onSuccess: () => void;
  onToast?: (msg: string, type: 'success' | 'error') => void;
}

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function VoidRequestModal({ transaction: t, onClose, onSuccess, onToast }: VoidRequestModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const panelCls = `${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'} border rounded-3xl max-w-md w-full`;
  const inputCls = `w-full min-h-[120px] rounded-3xl border px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500/40 ${
    isDark ? 'border-stone-800 bg-stone-950 text-white' : 'border-stone-200 bg-white text-stone-900'
  }`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (reason.trim().length < 10) {
      setErr('Minimal 10 karakter.');
      return;
    }
    setLoading(true);
    try {
      await appApi.post(`/transactions/${encodeURIComponent(t.id)}/void-request`, { reason: reason.trim() });
      onToast?.('Permintaan void dikirim ke Owner', 'success');
      onSuccess();
      onClose();
    } catch (ex) {
      const msg =
        ex instanceof ApiError ? ex.message : ex instanceof Error ? ex.message : 'Gagal mengirim permintaan.';
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
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>Ajukan Pembatalan Transaksi</h2>
          <button type="button" aria-label="Tutup" onClick={() => !loading && onClose()} className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div
            className={`rounded-3xl border px-4 py-3 text-sm leading-relaxed ${
              isDark ? 'border-amber-900/40 bg-amber-950/30 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-950'
            }`}
          >
            Pembatalan transaksi memerlukan persetujuan Owner. Transaksi tidak akan langsung dibatalkan.
          </div>
          <div className={`rounded-3xl border px-4 py-3 text-sm ${isDark ? 'border-stone-800 bg-stone-950 text-stone-300' : 'border-stone-200 bg-stone-50 text-stone-700'}`}>
            <p>
              Total: <span className="font-bold text-amber-500">{format(t.total_amount)}</span>
              {' • '}
              Waktu: {fmtWhen(t.created_at)}
              {' • '}
              Pelanggan: {(t.customer_name || 'Umum').toString()}
            </p>
          </div>
          {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>Alasan Pembatalan</label>
            <textarea
              className={inputCls}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Pelanggan salah pesan, minta ganti menu"
              required
              minLength={10}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" disabled={loading} onClick={() => !loading && onClose()} className="flex-1 rounded-3xl border border-stone-300 py-3 text-sm font-bold dark:border-stone-600 dark:text-stone-200">
              Batal
            </button>
            <button type="submit" disabled={loading} className={`flex-1 rounded-3xl bg-amber-500 py-3 text-sm font-bold text-white ${loading ? 'opacity-70' : 'hover:bg-amber-600'}`}>
              {loading ? 'Mengirim...' : 'Kirim Permintaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
