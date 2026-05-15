import { useTheme } from '../../../contexts/ThemeContext';
import { Bell, Info, ShoppingCart, TrendingUp, ShieldAlert } from 'lucide-react';

export default function NotificationSection() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifikasi</h1>
        <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>Pemberitahuan stok rendah dan aktivitas transaksi.</p>
      </div>

      {/* Main Placeholder */}
      <div className={`
        flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed
        ${isDark ? 'border-stone-800 bg-stone-900/20' : 'border-gray-200 bg-gray-50/50'}
      `}>
        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center mb-4
          ${isDark ? 'bg-stone-800 text-stone-500' : 'bg-gray-100 text-gray-400'}
        `}>
          <Bell size={32} />
        </div>
        <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sistem Notifikasi Pintar</h3>
        <p className={`text-sm text-center max-w-xs ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
          Fitur ini sedang dalam tahap pengembangan intensif untuk memberikan wawasan real-time bagi bisnis Anda.
        </p>
        <div className={`mt-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-teal-500/10 text-teal-600'}`}>
          Coming Soon
        </div>
      </div>

      {/* Planned Features Info */}
      <div className={`p-6 rounded-3xl border-2 ${isDark ? 'border-stone-800 bg-stone-900/40' : 'border-gray-100 bg-white shadow-sm'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-teal-50 text-teal-600'}`}>
            <Info size={20} />
          </div>
          <div>
            <h4 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Informasi Pengembangan</h4>
            <p className={`text-[11px] ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Apa yang akan hadir di versi mendatang:</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-50 text-gray-400'}`}>
              <ShoppingCart size={18} />
            </div>
            <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Peringatan Stok</h5>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Dapatkan peringatan instan saat produk mencapai ambang batas minimum stok.</p>
          </div>

          <div className="space-y-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-50 text-gray-400'}`}>
              <TrendingUp size={18} />
            </div>
            <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Laporan Penjualan</h5>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Ringkasan performa harian yang dikirim langsung saat shift berakhir.</p>
          </div>

          <div className="space-y-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-50 text-gray-400'}`}>
              <ShieldAlert size={18} />
            </div>
            <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Keamanan Kasir</h5>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Pemberitahuan khusus untuk transaksi yang dibatalkan (*void*) atau diubah.</p>
          </div>
        </div>

        <div className={`mt-8 pt-6 border-t ${isDark ? 'border-stone-800' : 'border-gray-50'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-amber-500' : 'bg-teal-500'}`}></div>
            <span className={`text-[10px] font-bold ${isDark ? 'text-stone-400' : 'text-gray-400'}`}>Tahap Pengembangan: 65% Selesai</span>
          </div>
        </div>
      </div>
    </div>
  );
}


