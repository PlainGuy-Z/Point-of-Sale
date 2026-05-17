import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useApp } from '../../../contexts/AppContext';
import { useToast } from '../../../hooks/useToast';
import { appApi } from '../../../services/appApi';
import { getApiBaseUrl } from '../../../services/apiBaseUrl';
import SettingsCard from '../components/SettingsCard';
import { Download, Archive, AlertTriangle, FileText, Package, Trash2, X, AlertCircle } from 'lucide-react';

export default function DataSection() {
  const { theme } = useTheme();
  const { createBackup, resetAllData } = useApp();
  const { showToast, ToastComponent } = useToast();
  const isDark = theme === 'dark';

  const [exportDates, setExportDates] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Reset Data 3-step state
  const [resetStep, setResetStep] = useState(0); // 0: none, 1: confirm, 2: type HAPUS, 3: countdown
  const [confirmText, setConfirmText] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [isResetting, setIsResetting] = useState(false);

  const handleExportProducts = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/app/export/products`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coffee-pos-token')}`
        }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      showToast('Gagal mengekspor data produk', 'error');
    }
  };

  const handleExportTransactions = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/app/export/transactions?from=${exportDates.from}&to=${exportDates.to}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coffee-pos-token')}`
        }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${exportDates.from}_to_${exportDates.to}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      showToast('Gagal mengekspor data transaksi', 'error');
    }
  };

  // Countdown effect
  useEffect(() => {
    let timer: any;
    if (resetStep === 3 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (resetStep === 3 && countdown === 0) {
      executeReset();
    }
    return () => clearInterval(timer);
  }, [resetStep, countdown]);

  const executeReset = async () => {
    setIsResetting(true);
    try {
      await appApi.resetTransactions();
      showToast('Seluruh data transaksi dan waste log telah dihapus.', 'success');
      window.location.reload(); // Refresh to update all stats
    } catch (err) {
      showToast('Terjadi kesalahan saat mereset data.', 'error');
      setResetStep(0);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Data & Backup</h1>
        <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>Kelola ekspor data, cadangan, dan pembersihan sistem.</p>
      </div>

      {/* CARD 1: Export Data */}
      <SettingsCard title="Export Data" icon={Download}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* Export Transaksi */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-teal-50 text-teal-600'}`}>
                <FileText size={20} />
              </div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Export Transaksi</h3>
            </div>
            
            <div className="space-y-3 mb-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-50 block mb-1">Dari</label>
                  <input 
                    type="date" 
                    value={exportDates.from}
                    onChange={(e) => setExportDates(p => ({ ...p, from: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${isDark ? 'bg-stone-950 border-stone-800 text-white' : 'bg-white border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase opacity-50 block mb-1">Sampai</label>
                  <input 
                    type="date" 
                    value={exportDates.to}
                    onChange={(e) => setExportDates(p => ({ ...p, to: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${isDark ? 'bg-stone-950 border-stone-800 text-white' : 'bg-white border-gray-200'}`}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleExportTransactions}
              className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isDark ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'}`}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          {/* Export Produk */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-teal-50 text-teal-600'}`}>
                <Package size={20} />
              </div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Export Produk</h3>
            </div>
            <p className={`text-xs mb-6 ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Unduh seluruh daftar produk, kategori, stok, dan harga dalam format CSV.</p>
            
            <button
              onClick={handleExportProducts}
              className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isDark ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'}`}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* CARD 2: Backup */}
      <SettingsCard title="Backup" icon={Archive}>
        <div className={`mt-2 p-6 rounded-2xl border-2 border-dashed ${isDark ? 'border-stone-800 bg-stone-900/20' : 'border-gray-100 bg-gray-50/50'}`}>
          <div className="flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-stone-800 text-stone-400' : 'bg-white text-gray-400 shadow-sm'}`}>
              <Archive size={24} />
            </div>
            <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Cadangan Sistem</h3>
            <p className={`text-xs max-w-sm mb-6 ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Unduh cadangan seluruh data toko Anda (Produk, Transaksi terakhir, dan Pengaturan) dalam satu file JSON.</p>
            
            <button
              onClick={() => {
                const ok = createBackup();
                if (ok) showToast('File cadangan berhasil diunduh.', 'success');
              }}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${isDark ? 'bg-amber-500 text-stone-950 hover:bg-amber-400' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
            >
              <Download size={14} /> Download Backup JSON
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* CARD 3: Reset Data (ZONA BERBAHAYA) */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-red-950/10 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/20 text-red-500">
            <AlertTriangle size={20} />
          </div>
          <h3 className="font-black text-red-500 uppercase tracking-wider">Zona Berbahaya</h3>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <p className={`text-sm font-bold mb-1 ${isDark ? 'text-red-200' : 'text-red-900'}`}>Reset Data Transaksi</p>
            <p className={`text-xs ${isDark ? 'text-red-900/70' : 'text-red-800/70'}`}>
              Tindakan ini akan menghapus seluruh riwayat transaksi dan waste log secara permanen. 
              Daftar produk dan pengaturan toko akan tetap tersimpan.
            </p>
          </div>
          
          <button
            onClick={() => setResetStep(1)}
            className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all whitespace-nowrap"
          >
            Reset Data Transaksi
          </button>
        </div>
      </div>

      {/* ── MODALS ── */}
      {resetStep > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-white border-gray-100'}`}>
            
            {resetStep === 1 && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Yakin ingin menghapus?</h3>
                <p className={`text-sm mb-8 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>Tindakan ini tidak dapat dibatalkan. Seluruh riwayat penjualan akan hilang.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setResetStep(0)}
                    className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-wider ${isDark ? 'bg-stone-900 text-white' : 'bg-gray-100 text-gray-900'}`}
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => setResetStep(2)}
                    className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-wider bg-red-600 text-white"
                  >
                    Lanjutkan
                  </button>
                </div>
              </div>
            )}

            {resetStep === 2 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Konfirmasi Terakhir</h3>
                  <button onClick={() => setResetStep(0)} className="p-2 text-stone-500 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <p className={`text-sm mb-4 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>Ketik <span className="font-black text-red-500">HAPUS</span> di bawah ini untuk mengonfirmasi penghapusan seluruh data transaksi.</p>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="HAPUS"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className={`w-full p-4 rounded-2xl border-2 mb-6 text-center font-black tracking-widest uppercase transition-all ${
                    confirmText === 'HAPUS' 
                    ? (isDark ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-red-500 bg-red-50 text-red-600') 
                    : (isDark ? 'border-stone-800 bg-stone-900 text-white' : 'border-gray-200 bg-gray-50')
                  }`}
                />
                <button 
                  disabled={confirmText !== 'HAPUS'}
                  onClick={() => setResetStep(3)}
                  className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                    confirmText === 'HAPUS' ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20' : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                  }`}
                >
                  Mulai Penghapusan
                </button>
              </div>
            )}

            {resetStep === 3 && (
              <div className="text-center py-4">
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-red-500/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-red-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-black text-red-600">{countdown}</span>
                  </div>
                </div>
                <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sedang Memproses...</h3>
                <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>Data Anda akan segera dihapus selamanya dalam beberapa detik.</p>
                <button 
                  onClick={() => setResetStep(0)}
                  className="mt-8 text-xs font-bold text-stone-500 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  Batal Cepat
                </button>
              </div>
            )}

          </div>
        </div>
      )}
      {ToastComponent}
    </div>
  );
}
