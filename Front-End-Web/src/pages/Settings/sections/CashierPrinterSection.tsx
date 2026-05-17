import React, { useState, useEffect } from 'react';
import {
  Printer,
  Eye,
  Activity,
  Wifi,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { usePrinter } from '../../../hooks/usePrinter';
import { useToast } from '../../../hooks/useToast';
import { useAuth } from '../../../contexts/AuthContext';
import SettingsCard from '../components/SettingsCard';

export default function CashierPrinterSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { settings } = useSettings();
  const { testConnection, print, isConnecting, isPrinting, connectionStatus } = usePrinter();
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const [localConnectionStatus, setLocalConnectionStatus] = useState<'connected' | 'error' | 'unknown'>('unknown');

  useEffect(() => {
    setLocalConnectionStatus(connectionStatus || 'unknown');
  }, [connectionStatus]);

  const printMethod = settings?.print_method || 'browser';
  const paperSize = (settings?.receipt_paper_size || '80mm') as '58mm' | '80mm';

  const getPrintMethodLabel = () => {
    switch (printMethod) {
      case 'rawbt_intent':
        return 'Direct Print (Android)';
      case 'rawbt':
        return 'Network Proxy (IP)';
      case 'browser':
      default:
        return 'Browser Print';
    }
  };

  const getPrintMethodBadgeColor = () => {
    switch (printMethod) {
      case 'rawbt_intent':
        return isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700';
      case 'rawbt':
        return isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700';
      case 'browser':
      default:
        return isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600';
    }
  };

  const handleTestConnection = async () => {
    const ok = await testConnection();
    if (ok) {
      setLocalConnectionStatus('connected');
      showToast('Printer terhubung!', 'success');
    } else {
      setLocalConnectionStatus('error');
      showToast('Gagal terhubung ke printer', 'error');
    }
  };

  const handleTestPrint = () => {
    const testData = {
      shopName: settings?.shop_name || 'SmartPOS',
      shopAddress: settings?.address,
      cashierName: user?.name || 'Kasir',
      transactionId: `TEST-${Date.now().toString().slice(-8)}`,
      createdAt: new Date(),
      orderType: 'dine_in' as const,
      items: [
        { name: 'Americano', quantity: 1, price: 25000, subtotal: 25000 },
        { name: 'Caffe Latte', quantity: 1, price: 28000, subtotal: 28000 },
      ],
      subtotal: 53000,
      tax: 0,
      taxRate: 0,
      grandTotal: 53000,
      paymentMethod: 'cash' as const,
      receiptFooter: '-- STRUK TEST --',
      paperSize: paperSize,
    };
    print(testData);
  };

  return (
    <div className="p-6 max-w-4xl pb-24">
      {ToastComponent}

      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Printer & Struk
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
          Cek koneksi dan test cetak struk
        </p>
      </div>

      <div className="space-y-6">
        {/* Current Config Card (Read Only) */}
        <SettingsCard title="Konfigurasi Aktif" icon={Eye}>
          <div className="space-y-4">
            {/* Print Method Badge */}
            <div className="flex items-center gap-3">
              <span className={`text-xs uppercase tracking-wider font-bold ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>
                Metode Cetak
              </span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${getPrintMethodBadgeColor()}`}>
                {getPrintMethodLabel()}
              </span>
            </div>

            {/* Paper Size Badge */}
            <div className="flex items-center gap-3">
              <span className={`text-xs uppercase tracking-wider font-bold ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>
                Ukuran Kertas
              </span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${isDark ? 'bg-stone-800' : 'bg-gray-100'}`}>
                {paperSize}
              </span>
            </div>

            {/* Auto Print Badge */}
            <div className="flex items-center gap-3">
              <span className={`text-xs uppercase tracking-wider font-bold ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>
                Cetak Otomatis
              </span>
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full ${
                  settings?.receipt_auto_print
                    ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                    : (isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-100 text-gray-600')
                }`}
              >
                {settings?.receipt_auto_print ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>

            {/* Info Banner */}
            <div
              className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${
                isDark
                  ? 'bg-blue-950/20 border-blue-800/30'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <AlertCircle
                size={16}
                className={`flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`}
              />
              <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                Untuk mengubah konfigurasi printer, hubungi Owner toko Anda.
              </p>
            </div>
          </div>
        </SettingsCard>

        {/* Connection Status Card (only if not browser) */}
        {printMethod !== 'browser' && (
          <SettingsCard title="Status Koneksi" icon={Activity}>
            <div className="space-y-4">
              {/* Status Indicator */}
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    localConnectionStatus === 'connected'
                      ? 'bg-emerald-500'
                      : localConnectionStatus === 'error'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                  }`}
                />
                <div className="text-center">
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {localConnectionStatus === 'connected'
                      ? 'Printer Terhubung'
                      : localConnectionStatus === 'error'
                      ? 'Printer Tidak Terdeteksi'
                      : 'Belum Diperiksa'}
                  </p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                    {localConnectionStatus === 'connected'
                      ? 'Siap mencetak struk'
                      : localConnectionStatus === 'error'
                      ? 'Periksa aplikasi RawBT dan koneksi'
                      : 'Tap tombol di bawah untuk cek'}
                  </p>
                </div>
              </div>
            </div>
          </SettingsCard>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {printMethod !== 'browser' && (
            <button
              onClick={handleTestConnection}
              disabled={isConnecting}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border transition-all disabled:opacity-50 ${
                isDark
                  ? 'border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-200'
                  : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              {isConnecting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memeriksa...
                </>
              ) : (
                <>
                  <Wifi size={18} />
                  Cek Koneksi Printer
                </>
              )}
            </button>
          )}

          <button
            onClick={handleTestPrint}
            disabled={isPrinting}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 ${
              isDark
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
            }`}
          >
            {isPrinting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Mencetak...
              </>
            ) : (
              <>
                <Printer size={18} />
                Test Print Struk
              </>
            )}
          </button>
        </div>

        {/* Guide Section - Conditional based on print method */}
        {printMethod === 'rawbt_intent' && (
          <SettingsCard title="Panduan 3 Langkah" description="Setup RawBT untuk Direct Print">
            <div className={`p-5 rounded-xl border space-y-4 ${isDark ? 'border-amber-500/20 bg-amber-500/5' : 'border-blue-100 bg-blue-50/50'}`}>
              <div className="flex gap-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    isDark ? 'bg-amber-500 text-black' : 'bg-teal-500 text-white'
                  }`}
                >
                  1
                </div>
                <div>
                  <p className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Pastikan RawBT terinstall di Android
                  </p>
                  <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                    Cari aplikasi <span className="font-bold">RawBT Driver for Thermal Printer</span> di Google Play Store
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    isDark ? 'bg-amber-500 text-black' : 'bg-teal-500 text-white'
                  }`}
                >
                  2
                </div>
                <div>
                  <p className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Buka RawBT dan pastikan printer terhubung
                  </p>
                  <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                    Masuk ke Settings dan sambungkan printer (Bluetooth, USB, atau WiFi)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    isDark ? 'bg-amber-500 text-black' : 'bg-teal-500 text-white'
                  }`}
                >
                  3
                </div>
                <div>
                  <p className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Tap 'Test Print' untuk memastikan printer siap
                  </p>
                  <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                    Browser akan otomatis memanggil RawBT untuk mencetak struk
                  </p>
                </div>
              </div>
            </div>
          </SettingsCard>
        )}

        {printMethod === 'browser' && (
          <SettingsCard title="Browser Print Aktif">
            <div className={`p-4 rounded-xl ${isDark ? 'bg-stone-900/50' : 'bg-gray-50'}`}>
              <p className={`text-sm ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
                Browser Print aktif. Saat cetak struk, dialog print browser akan muncul otomatis untuk
                Anda memilih printer atau mengatur opsi cetak.
              </p>
            </div>
          </SettingsCard>
        )}

        {printMethod === 'rawbt' && (
          <SettingsCard title="Network Proxy aktif">
            <div className={`p-4 rounded-xl ${isDark ? 'bg-stone-900/50' : 'bg-gray-50'}`}>
              <p className={`text-sm ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
                Pastikan HP dengan RawBT dan perangkat kasir Anda terhubung ke WiFi yang sama agar
                komunikasi berjalan lancar.
              </p>
            </div>
          </SettingsCard>
        )}
      </div>
    </div>
  );
}
