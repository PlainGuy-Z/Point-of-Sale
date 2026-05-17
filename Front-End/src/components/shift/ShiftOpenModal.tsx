import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { Coffee, Loader2, X } from 'lucide-react';
import logoIcon from '../../assets/icon.png';

interface ShiftOpenModalProps {
  onSuccess?: () => void;
  /** When set, shows Batal and allows closing without submitting */
  onCancel?: () => void;
}

export default function ShiftOpenModal({ onSuccess, onCancel }: ShiftOpenModalProps) {
  const { user } = useAuth();
  const { openShift, isLoading } = useShift();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { formatDate, formatTime } = useDateFormatter();

  const [openingCash, setOpeningCash] = useState<string>('');
  const [error, setError] = useState<string>('');

  const now = new Date();
  const formattedDate = formatDate(now);
  const formattedTime = formatTime(now);

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setOpeningCash(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!openingCash) {
      setError('Modal awal harus diisi');
      return;
    }

    try {
      await openShift(parseInt(openingCash, 10));
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal membuka shift');
    }
  };

  const formattedCashDisplay = openingCash
    ? parseInt(openingCash, 10).toLocaleString('id-ID')
    : '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
        onClick={() => onCancel?.()}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${
          isDark ? 'bg-stone-900 border border-stone-800' : 'bg-white border border-[#E2E8F0]'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-open-title"
      >
        <div className="p-6 md:p-8 space-y-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
                isDark ? 'text-stone-400 hover:bg-stone-800' : 'text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]'
              }`}
              aria-label="Batal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {/* Header */}
          <div className="text-center space-y-2">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg transition-all ${
              isDark ? 'bg-amber-500/10 border-amber-500/20 shadow-amber-500/10' : 'bg-teal-50 border-teal-100 shadow-teal-500/10'
            }`}>
              <img src={logoIcon} className="w-8 h-8 object-contain" alt="Logo" />
            </div>
            <h2 id="shift-open-title" className={`text-2xl font-bold tracking-tight mt-4 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              Mulai Shift Baru
            </h2>
            <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>
              Masukkan jumlah uang modal awal di laci kasir
            </p>
          </div>

          {/* Info Cards */}
          <div className={`p-4 rounded-xl space-y-3 ${isDark ? 'bg-stone-950/50' : 'bg-[#F8FAFC]'}`}>
            <div className="flex justify-between items-center text-sm">
              <span className={isDark ? 'text-stone-400' : 'text-[#475569]'}>Kasir</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{user?.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className={isDark ? 'text-stone-400' : 'text-[#475569]'}>Tanggal</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className={isDark ? 'text-stone-400' : 'text-[#475569]'}>Waktu Buka</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{formattedTime} WIB</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className={`block text-sm font-bold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>
                Modal Awal (Rp)
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
                  className={`w-full pl-12 pr-4 py-4 rounded-xl text-lg font-bold outline-none transition-all focus:border-teal-400 focus:bg-white ${
                    isDark 
                      ? 'bg-stone-950 border border-stone-800 text-white focus:ring-1 focus:ring-teal-500' 
                      : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]'
                  }`}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !openingCash}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all active:scale-[0.98] shadow-lg ${
                isLoading || !openingCash
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Membuka Shift...
                </>
              ) : (
                'Mulai Shift'
              )}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-bold text-sm border transition-all ${
                  isDark
                    ? 'border-stone-700 text-stone-300 hover:bg-stone-800 disabled:opacity-50'
                    : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50'
                }`}
              >
                Batal
              </button>
            )}

            <p className={`text-xs text-center font-medium ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
              Pastikan jumlah uang sudah sesuai sebelum memulai shift
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
