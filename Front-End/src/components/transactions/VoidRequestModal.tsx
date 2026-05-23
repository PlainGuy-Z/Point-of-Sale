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

  const panelCls = `${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-[#E2E8F0]'} border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden`;
  const inputCls = `w-full min-h-[120px] rounded-xl border px-4 py-3 outline-none transition-all focus:border-teal-400 ${
    isDark ? 'border-stone-800 bg-stone-950 focus:bg-stone-950 text-white focus:ring-1 focus:ring-teal-500' : 'focus:bg-white border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A]'
  }`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (reason.trim().length < 5) {
      setErr('Minimal 5 karakter.');
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
        <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Ajukan Pembatalan</h2>
          <button type="button" aria-label="Tutup" onClick={() => !loading && onClose()} className={`rounded-lg p-2 transition-colors ${isDark ? 'text-stone-500 hover:bg-stone-800' : 'text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]'}`}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div
            className={`rounded-xl border px-4 py-3 text-sm leading-relaxed font-medium ${
              isDark ? 'border-amber-900/40 bg-amber-950/30 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            ⚠️ Pembatalan transaksi memerlukan persetujuan Owner. Transaksi tidak akan langsung dibatalkan.
          </div>
          <div className={`rounded-xl border px-4 py-3 text-xs space-y-1 ${isDark ? 'border-stone-800 bg-stone-950 text-stone-300' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'}`}>
            <div className="flex justify-between">
              <span>Total Transaksi</span>
              <span className="font-bold text-teal-600">{format(t.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu</span>
              <span className="font-semibold">{fmtWhen(t.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan</span>
              <span className="font-semibold">{t.customer_name || 'Umum'}</span>
            </div>
          </div>
          {err ? <p className="text-sm font-bold text-red-600">{err}</p> : null}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>Alasan Pembatalan</label>
            <textarea
              className={inputCls}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Pelanggan salah pesan, minta ganti menu"
              required
              minLength={5}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" disabled={loading} onClick={() => !loading && onClose()} className={`flex-1 rounded-xl py-3 text-sm font-bold border transition-all ${isDark ? 'border-stone-700 text-stone-200' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}>
              Batal
            </button>
            <button type="submit" disabled={loading} className={`flex-1 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all ${loading ? 'opacity-70' : 'hover:bg-teal-700 active:scale-[0.98]'}`}>
              {loading ? 'Mengirim...' : 'Kirim Permintaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
