import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { X, Loader2, LogOut, AlertTriangle } from 'lucide-react';

interface ShiftCloseModalProps {
  onClose: () => void;
}

export default function ShiftCloseModal({ onClose }: ShiftCloseModalProps) {
  const { logout } = useAuth();
  const { activeShift, closeShift, isLoading } = useShift();
  const { theme } = useTheme();
  const { format } = useCurrencyFormatter();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [closingCash, setClosingCash] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!activeShift) return null;

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setClosingCash(val);
  };

  const expectedCash = activeShift.current_expected_cash || 0;
  const actualCash = closingCash ? parseInt(closingCash, 10) : 0;
  const selisih = actualCash - expectedCash;

  const getSelisihLabel = () => {
    if (!closingCash) return { text: '-', color: isDark ? 'text-stone-500' : 'text-[#94A3B8]' };
    if (selisih === 0) return { text: 'Pas', color: 'text-emerald-500' };
    if (selisih > 0) return { text: 'Lebih', color: 'text-emerald-500' };
    return { text: 'Kurang', color: 'text-red-500' };
  };

  const selisihStatus = getSelisihLabel();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!closingCash) {
      setError('Uang di laci harus diisi');
      return;
    }

    try {
      await closeShift(actualCash, notes);
      onClose();
      await logout();
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Gagal menutup shift');
    }
  };

  const formattedCashDisplay = closingCash
    ? parseInt(closingCash, 10).toLocaleString('id-ID')
    : '';

  const openedAtTime = new Date(activeShift.opened_at).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${
        isDark ? 'bg-stone-900 border border-stone-800' : 'bg-white border border-[#E2E8F0]'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-teal-500/10' : 'bg-teal-50'}`}>
              <LogOut className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            </div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              Tutup Shift
            </h2>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-stone-800 text-stone-400' : 'text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(100vh-120px)] horizontal-scrollbar-thin">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>Waktu Buka</p>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{openedAtTime} WIB</p>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>Total Transaksi</p>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{activeShift.current_total_transactions} trx</p>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>Total Penjualan</p>
                <p className={`font-bold text-emerald-600`}>{format(activeShift.current_total_sales || 0)}</p>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-amber-500/70' : 'text-amber-700/70'}`}>Kas Seharusnya</p>
                <p className={`font-black ${isDark ? 'text-amber-500' : 'text-amber-700'}`}>{format(expectedCash)}</p>
              </div>
            </div>

            <div className={`h-px w-full ${isDark ? 'bg-stone-800' : 'bg-[#F1F5F9]'}`} />

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>
                  Uang di Laci Sekarang (Rp)
                </label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>
                    Rp
                  </span>
                  <input
                    type="text"
                    value={formattedCashDisplay}
                    onChange={handleCashChange}
                    placeholder="0"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl text-lg font-bold outline-none transition-all focus:border-teal-400 focus:bg-white ${
                      isDark 
                        ? 'bg-stone-950 border border-stone-800 text-white focus:ring-1 focus:ring-teal-500' 
                        : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]'
                    }`}
                    autoFocus
                  />
                </div>
              </div>

              {/* Selisih Display */}
              <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <span className={`font-bold ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>Selisih:</span>
                <div className="flex items-center gap-2">
                  <span className={`font-black text-lg ${selisihStatus.color}`}>
                    {closingCash ? format(Math.abs(selisih)) : '-'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    selisih === 0 ? 'bg-emerald-500/20 text-emerald-500' : 
                    selisih > 0 ? 'bg-emerald-500/20 text-emerald-500' : 
                    closingCash ? 'bg-red-500/20 text-red-500' : 'bg-transparent'
                  }`}>
                    {selisihStatus.text}
                  </span>
                </div>
              </div>

              {/* Warning if selisih */}
              {closingCash && selisih !== 0 && (
                <div className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-yellow-500/10 text-yellow-500' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">
                    Terdapat selisih kas. Pastikan uang dihitung dengan benar atau tambahkan catatan jika memang ada selisih.
                  </p>
                </div>
              )}

              <div>
                <label className={`block text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>
                  Catatan (opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Ada kembalian kurang Rp 5.000"
                  className={`w-full p-3 rounded-xl outline-none transition-all resize-none h-24 focus:border-teal-400 focus:bg-white ${
                    isDark 
                      ? 'bg-stone-950 border border-stone-800 text-white focus:ring-1 focus:ring-teal-500' 
                      : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]'
                  }`}
                />
              </div>

              {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${
                  isDark
                    ? 'bg-stone-800 text-white hover:bg-stone-700'
                    : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading || !closingCash}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg ${
                  isLoading || !closingCash
                    ? 'bg-teal-400/50 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/25 active:scale-[0.98]'
                }`}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tutup Shift'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
