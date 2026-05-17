import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Wallet,
  TrendingUp,
  Receipt,
  ArrowLeft,
  Lock,
  Unlock,
} from 'lucide-react';
import { useShift } from '../../contexts/ShiftContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import ShiftOpenModal from '../../components/shift/ShiftOpenModal';
import ShiftCloseModal from '../../components/shift/ShiftCloseModal';

export default function CashierShiftHub() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();
  const navigate = useNavigate();
  const { activeShift, isLoading, refreshShift } = useShift();

  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`p-2 rounded-xl border transition-colors ${
            isDark ? 'border-stone-800 hover:bg-stone-900 text-stone-400' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
          }`}
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Shift & <span className={isDark ? 'text-amber-500' : 'text-teal-600'}>Rekonsiliasi</span>
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>
            Mulai shift, pantau penjualan, dan tutup shift dengan hitung kas akhir
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'}`}>
          <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg transition-all mb-4 ${
            isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-teal-50 border-teal-100 shadow-teal-500/10'
          }`}>
            <Coffee className={`w-8 h-8 ${isDark ? 'text-amber-500' : 'text-teal-600'}`} />
          </div>
          <p className={isDark ? 'text-stone-400' : 'text-gray-500'}>Memuat status shift…</p>
        </div>
      ) : !activeShift ? (
        <div
          className={`rounded-2xl border p-8 space-y-6 ${
            isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${isDark ? 'bg-amber-500/15' : 'bg-teal-500/15'}`}>
              <Unlock className={`w-8 h-8 ${isDark ? 'text-amber-500' : 'text-teal-600'}`} />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Belum ada shift aktif</h2>
              <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>
                Buka shift dengan mencatat modal awal kas. Setelah itu Anda dapat menggunakan POS dan waste log.
              </p>
              <button
                type="button"
                onClick={() => setOpenModal(true)}
                className={`mt-2 px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r transition-all active:scale-[0.98] ${
                  isDark 
                    ? 'from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20' 
                    : 'from-teal-500 to-teal-600 shadow-lg shadow-teal-500/20'
                  }`}
              >
                Mulai shift sekarang
              </button>
            </div>
          </div>

          <div className={`grid sm:grid-cols-3 gap-3 text-sm ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
            <div className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? 'bg-stone-950/50' : 'bg-gray-50'}`}>
              <Wallet className={`w-4 h-4 shrink-0 ${isDark ? 'text-amber-500' : 'text-teal-500'}`} />
              <span>Catat uang di laci saat buka</span>
            </div>
            <div className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? 'bg-stone-950/50' : 'bg-gray-50'}`}>
              <Receipt className={`w-4 h-4 shrink-0 ${isDark ? 'text-amber-500' : 'text-teal-500'}`} />
              <span>Transaksi tercatat per shift</span>
            </div>
            <div className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? 'bg-stone-950/50' : 'bg-gray-50'}`}>
              <Lock className={`w-4 h-4 shrink-0 ${isDark ? 'text-amber-500' : 'text-teal-500'}`} />
              <span>Tutup shift dengan rekonsiliasi</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200 shadow-sm'
            }`}
          >
            <div
              className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
                isDark ? 'border-stone-800 bg-emerald-500/5' : 'border-gray-100 bg-emerald-50/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Shift berjalan</span>
              </div>
              <button
                type="button"
                onClick={() => refreshShift()}
                className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${
                  isDark ? 'border-stone-700 text-stone-300 hover:bg-stone-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Refresh
              </button>
            </div>

            <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-2xl border ${isDark ? 'border-stone-800 bg-stone-950/40' : 'border-gray-100 bg-gray-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Modal awal</p>
                <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{format(activeShift.opening_cash)}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'border-stone-800 bg-stone-950/40' : 'border-gray-100 bg-gray-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Penjualan (shift)</p>
                <p className={`text-xl font-black ${isDark ? 'text-amber-500' : 'text-teal-600'}`}>{format(activeShift.current_total_sales ?? 0)}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'border-stone-800 bg-stone-950/40' : 'border-gray-100 bg-gray-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Jumlah transaksi</p>
                <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {activeShift.current_total_transactions ?? 0}
                </p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'border-stone-800 bg-stone-950/40' : 'border-gray-100 bg-gray-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Kas di laci (estimasi)</p>
                <p className={`text-xl font-black ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                  {format(activeShift.current_expected_cash ?? activeShift.opening_cash)}
                </p>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
                  Modal + penjualan tunai tercatat
                </p>
              </div>
            </div>

            <div className={`px-6 pb-6 flex flex-wrap gap-3`}>
              <button
                type="button"
                onClick={() => navigate('/pos')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white shadow-md hover:opacity-95 bg-gradient-to-r ${
                  isDark ? 'from-amber-500 to-orange-500' : 'from-teal-500 to-teal-600'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Ke POS
              </button>
              <button
                type="button"
                onClick={() => setCloseModal(true)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold border ${
                  isDark ? 'border-stone-600 text-stone-200 hover:bg-stone-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Tutup shift & rekonsiliasi
              </button>
            </div>
          </div>

          <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
            Estimasi kas mengikuti pembayaran tunai pada transaksi di shift ini. Saat tutup shift, hitung uang fisik di laci dan
            bandingkan dengan nilai yang diharapkan.
          </p>
        </div>
      )}

      {openModal && (
        <ShiftOpenModal
          onSuccess={() => {
            setOpenModal(false);
            void refreshShift();
          }}
          onCancel={() => setOpenModal(false)}
        />
      )}
      {closeModal && <ShiftCloseModal onClose={() => setCloseModal(false)} />}
    </div>
  );
}
