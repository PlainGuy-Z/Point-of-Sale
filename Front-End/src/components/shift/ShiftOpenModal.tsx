import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useShift } from '../../contexts/ShiftContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Coffee, Loader2, X } from 'lucide-react';

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

  const [openingCash, setOpeningCash] = useState<string>('');
  const [error, setError] = useState<string>('');

  const now = new Date();
  const formattedDate = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
        onClick={() => onCancel?.()}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${
          isDark ? 'bg-stone-900 border border-stone-800' : 'bg-white border border-gray-200'
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
              className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
                isDark ? 'text-stone-400 hover:bg-stone-800' : 'text-gray-500 hover:bg-gray-100'
              }`}
              aria-label="Batal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {/* Header */}
          <div className="text-center space-y-2">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20`}>
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <h2 id="shift-open-title" className={`text-2xl font-black tracking-tight mt-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Mulai Shift Baru
            </h2>
            <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
              Masukkan jumlah uang modal awal di laci kasir
            </p>
          </div>

          {/* Info Cards */}
          <div className={`p-4 rounded-2xl space-y-3 ${isDark ? 'bg-stone-950/50' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-center text-sm">
              <span className={isDark ? 'text-stone-400' : 'text-gray-500'}>Kasir</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className={isDark ? 'text-stone-400' : 'text-gray-500'}>Tanggal</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className={isDark ? 'text-stone-400' : 'text-gray-500'}>Waktu Buka</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formattedTime} WIB</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
                Modal Awal (Rp)
              </label>
              <div className="relative">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                  Rp
                </span>
                <input
                  type="text"
                  value={formattedCashDisplay}
                  onChange={handleCashChange}
                  placeholder="0"
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl text-lg font-bold outline-none transition-all ${
                    isDark 
                      ? 'bg-stone-950 border border-stone-800 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500' 
                      : 'bg-white border border-gray-300 text-gray-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  }`}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !openingCash}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all active:scale-[0.98] ${
                isLoading || !openingCash
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/25'
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
                className={`w-full py-3 rounded-2xl font-semibold text-sm border transition-colors ${
                  isDark
                    ? 'border-stone-700 text-stone-300 hover:bg-stone-800 disabled:opacity-50'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                }`}
              >
                Batal
              </button>
            )}

            <p className={`text-xs text-center ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>
              Pastikan jumlah uang sudah sesuai sebelum memulai shift
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
