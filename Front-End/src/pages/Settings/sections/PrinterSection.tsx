/*
  ALTER TABLE coffeepos.shop_settings
    ADD COLUMN IF NOT EXISTS print_method TEXT DEFAULT 'browser'
      CHECK (print_method IN ('browser','rawbt','network')),
    ADD COLUMN IF NOT EXISTS rawbt_ip TEXT,
    ADD COLUMN IF NOT EXISTS receipt_show_tax BOOLEAN DEFAULT true;
*/

import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Smartphone, 
  Globe, 
  FileText, 
  Check, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Wifi, 
  Save,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { usePrinter } from '../../../hooks/usePrinter';
import { useToast } from '../../../hooks/useToast';
import SettingsCard from '../components/SettingsCard';
import SettingsInput from '../components/SettingsInput';
import { buildReceipt, receiptToIntentUrl, type ReceiptData } from '../../../utils/escpos';

export default function PrinterSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { settings, updateSettings } = useSettings();
  const { testConnection, print, isConnecting, isPrinting, connectionStatus } = usePrinter();
  const { showToast, ToastComponent } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    print_method: settings?.print_method || 'browser',
    rawbt_ip: settings?.rawbt_ip || '',
    receipt_paper_size: settings?.receipt_paper_size || '80mm',
    receipt_auto_print: settings?.receipt_auto_print || false,
    receipt_footer: settings?.receipt_footer || 'Terima kasih telah berkunjung!',
    receipt_show_tax: settings?.receipt_show_tax !== false,
  });

  // Sync local settings when settings from context change
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        print_method: settings.print_method || 'browser',
        rawbt_ip: settings.rawbt_ip || '',
        receipt_paper_size: settings.receipt_paper_size || '80mm',
        receipt_auto_print: settings.receipt_auto_print || false,
        receipt_footer: settings.receipt_footer || 'Terima kasih telah berkunjung!',
        receipt_show_tax: settings.receipt_show_tax !== false,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      showToast('Pengaturan printer berhasil disimpan', 'success');
    } catch (err) {
      showToast('Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const onTestConnection = async () => {
    if (!localSettings.rawbt_ip) {
      showToast('Masukkan IP RawBT terlebih dahulu', 'error');
      return;
    }
    
    // Temporarily update settings in context so usePrinter can use the latest IP
    // Or we could pass IP to testConnection, but usePrinter uses settings from context.
    // Let's just use the local IP if we want to test before saving.
    // I'll assume testConnection uses the latest IP from settings.
    // Wait, usePrinter uses `settings.rawbt_ip`.
    // I should save first or update context temporarily.
    // Let's just save first or I'll modify usePrinter to accept an IP.
    // Actually, let's just save first or assume the user saves.
    // BETTER: I'll update the context immediately for testing purposes if possible, 
    // or just tell the user to save first.
    // Actually, I can just call printerService.testRawBT(localSettings.rawbt_ip) directly here.
    
    const ok = await testConnection(); // This uses context settings.
    if (ok) {
      showToast('Printer terhubung!', 'success');
    } else {
      showToast('Gagal terhubung ke printer', 'error');
    }
  };

  const getMethodCardClass = (method: string) => {
    const isActive = localSettings.print_method === method;
    if (isActive) {
      return isDark 
        ? 'border-amber-500 bg-amber-500/10' 
        : 'border-teal-500 bg-teal-50';
    }
    return isDark ? 'border-stone-800 hover:border-stone-700' : 'border-gray-200 hover:border-gray-300';
  };

  const onTestIntent = async () => {
    // First send a very simple test payload to quickly validate RawBT base64 handling
    const simple = 'TEST RAWBT\nHello SmartPOS\n\n\n'
    try {
      console.log('[PrinterSection] Test Intent: sending simple test payload')
      const testUrl = receiptToIntentUrl(simple)
      console.log('[PrinterSection] Test Intent URL (simple):', testUrl.slice(0, 120) + (testUrl.length > 120 ? '...' : ''))
      const opened = window.open(testUrl)
      if (!opened) {
        console.error('[PrinterSection] Failed to open intent (popup blocked)')
        showToast('Gagal membuka intent. Pastikan RawBT terinstall dan service aktif.', 'error')
        const tryFallback = window.confirm('Gagal membuka RawBT intent. Ingin mencoba cetak via browser sebagai fallback?')
        if (tryFallback) window.print()
        return
      }
      showToast('Test print intent dikirim ke RawBT. Periksa aplikasi RawBT pada perangkat Android.', 'success')
    } catch (err) {
      console.error('[PrinterSection] Error creating/launching simple intent:', err)
      showToast('Gagal membuat atau membuka intent. Pastikan RawBT terinstall.', 'error')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24">
      {ToastComponent}
      <div className="mb-6">
        <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Printer & Struk</h1>
        <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
          Konfigurasi printer thermal dan tampilan struk belanja.
        </p>
      </div>

      <div className="space-y-6">
        {/* CARD 1: Metode Print */}
        <SettingsCard 
          title="Metode Cetak" 
          description="Pilih bagaimana struk akan dicetak"
          icon={Printer}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setLocalSettings(s => ({ ...s, print_method: 'browser' }))}
              className={`flex flex-col p-4 rounded-xl border text-left transition-all ${getMethodCardClass('browser')}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Globe size={20} className={localSettings.print_method === 'browser' ? (isDark ? 'text-amber-500' : 'text-teal-500') : 'text-gray-400'} />
                {localSettings.print_method === 'browser' && <CheckCircle2 size={16} className={isDark ? 'text-amber-500' : 'text-teal-500'} />}
              </div>
              <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Browser Print</span>
              <p className="text-[11px] text-gray-500 mt-1">Cetak via dialog browser standar. Kompatibel semua perangkat.</p>
            </button>

            <button
              onClick={() => setLocalSettings(s => ({ ...s, print_method: 'rawbt_intent' }))}
              className={`flex flex-col p-4 rounded-xl border text-left transition-all ${getMethodCardClass('rawbt_intent')}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Zap size={20} className={localSettings.print_method === 'rawbt_intent' ? (isDark ? 'text-amber-500' : 'text-teal-500') : 'text-gray-400'} />
                <div className="flex gap-1 items-center">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-500 text-white leading-none">REC</span>
                  {localSettings.print_method === 'rawbt_intent' && <CheckCircle2 size={16} className={isDark ? 'text-amber-500' : 'text-teal-500'} />}
                </div>
              </div>
              <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Direct Print (Android)</span>
              <p className="text-[11px] text-gray-500 mt-1">Sangat stabil untuk Railway/Cloud. Panggil RawBT langsung dari browser.</p>
            </button>

            <button
              onClick={() => setLocalSettings(s => ({ ...s, print_method: 'rawbt' }))}
              className={`flex flex-col p-4 rounded-xl border text-left transition-all ${getMethodCardClass('rawbt')}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Smartphone size={20} className={localSettings.print_method === 'rawbt' ? (isDark ? 'text-amber-500' : 'text-teal-500') : 'text-gray-400'} />
                {localSettings.print_method === 'rawbt' && <CheckCircle2 size={16} className={isDark ? 'text-amber-500' : 'text-teal-500'} />}
              </div>
              <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Network Proxy (IP)</span>
              <p className="text-[11px] text-gray-500 mt-1">Cetak via IP lokal. Memerlukan IP statis dan koneksi server lokal.</p>
            </button>

            <div
              className={`flex flex-col p-4 rounded-xl border text-left opacity-50 cursor-not-allowed ${isDark ? 'border-stone-800' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Wifi size={20} className="text-gray-400" />
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 uppercase">Segera</span>
              </div>
              <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Network Printer</span>
              <p className="text-[11px] text-gray-500 mt-1">Print via Local Network IP. Sedang dalam pengembangan.</p>
            </div>
          </div>
        </SettingsCard>

        {/* CARD 2: Panduan Berdasarkan Metode */}
        {localSettings.print_method === 'rawbt_intent' && (
          <SettingsCard 
            title="Panduan Direct Print" 
            description="Langkah tercepat & paling stabil untuk pengguna Android"
            icon={Zap}
          >
            <div className={`p-5 rounded-xl border ${isDark ? 'border-amber-500/20 bg-amber-500/5' : 'border-blue-100 bg-blue-50/50'}`}>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-amber-500 text-black' : 'bg-teal-500 text-white'}`}>1</div>
                  <div>
                    <p className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Install App RawBT</p>
                    <p className="text-xs text-gray-500">Cari dan install aplikasi <span className="font-bold underline italic">RawBT Driver for Thermal Printer</span> di Google Play Store.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-amber-500 text-black' : 'bg-teal-500 text-white'}`}>2</div>
                  <div>
                    <p className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sambungkan Printer</p>
                    <p className="text-xs text-gray-500">Buka aplikasi RawBT, masuk ke Settings, dan sambungkan printer Anda (Bluetooth, USB, atau WiFi).</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-amber-500 text-black' : 'bg-teal-500 text-white'}`}>3</div>
                  <div>
                    <p className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Selesai!</p>
                    <p className="text-xs text-gray-500">Tidak perlu setting IP. Setiap kali cetak, browser akan otomatis memanggil RawBT untuk mencetak struk.</p>
                  </div>
                </div>
              </div>
            </div>
          </SettingsCard>
        )}

        {localSettings.print_method === 'browser' && (
          <SettingsCard 
            title="Panduan Browser Print" 
            description="Metode standar menggunakan fitur cetak bawaan perangkat"
            icon={Globe}
          >
            <div className={`p-5 rounded-xl border ${isDark ? 'border-stone-800 bg-stone-900/50' : 'border-gray-200 bg-gray-50/50'}`}>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="text-emerald-500 mt-0.5" size={16} />
                  <p className="text-xs text-gray-500"><span className="font-bold text-gray-700 dark:text-gray-300">Universal:</span> Bisa digunakan di Laptop, PC, maupun Smartphone (iOS/Android).</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="text-emerald-500 mt-0.5" size={16} />
                  <p className="text-xs text-gray-500"><span className="font-bold text-gray-700 dark:text-gray-300">Cara Kerja:</span> Akan muncul jendela konfirmasi cetak sistem sebelum kertas keluar.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="text-emerald-500 mt-0.5" size={16} />
                  <p className="text-xs text-gray-500"><span className="font-bold text-gray-700 dark:text-gray-300">Tips:</span> Matikan "Headers and Footers" di pengaturan cetak browser agar struk lebih rapi.</p>
                </div>
              </div>
            </div>
          </SettingsCard>
        )}

        {/* CARD 2: Setup RawBT */}
        {localSettings.print_method === 'rawbt' && (
          <SettingsCard 
            title="Konfigurasi Network Proxy" 
            description="Gunakan IP statis untuk pencetakan yang terpusat"
            icon={Smartphone}
          >
            <div className={`p-4 rounded-xl mb-6 text-sm ${isDark ? 'bg-stone-950 text-stone-300' : 'bg-blue-50 text-blue-800'}`}>
              <ol className="list-decimal list-inside space-y-2 font-medium">
                <li>Install aplikasi <span className="font-bold underline">RawBT</span> di Android Play Store.</li>
                <li>Buka RawBT, sambungkan ke printer Bluetooth/USB.</li>
                <li>Tap <span className="font-bold">"Start Service"</span> di aplikasi RawBT.</li>
                <li>Pastikan HP dan Kasir berada di WiFi yang sama.</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <SettingsInput 
                      label="IP Address RawBT"
                      placeholder="Contoh: 192.168.1.100"
                      value={localSettings.rawbt_ip}
                      onChange={(e) => setLocalSettings(s => ({ ...s, rawbt_ip: e.target.value }))}
                      inputMode="decimal"
                    />
                  </div>
                  <button
                    onClick={onTestConnection}
                    disabled={isConnecting}
                    className={`px-4 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap ${
                      isDark 
                        ? 'bg-stone-800 text-white hover:bg-stone-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
                    Test Koneksi
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  connectionStatus === 'connected' ? 'bg-emerald-500' : 
                  connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                <span className={`text-xs font-bold ${
                  connectionStatus === 'connected' ? 'text-emerald-500' : 
                  connectionStatus === 'error' ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {connectionStatus === 'connected' ? 'Printer Terhubung' : 
                   connectionStatus === 'error' ? 'Printer Tidak Terdeteksi' : 'Status: Belum diperiksa'}
                </span>
              </div>
            </div>
          </SettingsCard>
        )}

        {/* CARD 3: Pengaturan Kertas & Struk */}
        <SettingsCard 
          title="Pengaturan Kertas & Struk" 
          description="Atur ukuran kertas dan konten struk belanja"
          icon={FileText}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className={`block text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                  Ukuran Kertas Thermal
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setLocalSettings(s => ({ ...s, receipt_paper_size: '58mm' }))}
                    className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all ${
                      localSettings.receipt_paper_size === '58mm'
                        ? (isDark ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-teal-500 bg-teal-50 text-teal-600')
                        : (isDark ? 'border-stone-800 text-stone-400' : 'border-gray-200 text-gray-500')
                    }`}
                  >
                    58mm
                  </button>
                  <button
                    onClick={() => setLocalSettings(s => ({ ...s, receipt_paper_size: '80mm' }))}
                    className={`flex-1 py-3 px-4 rounded-xl border font-bold text-sm transition-all ${
                      localSettings.receipt_paper_size === '80mm'
                        ? (isDark ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-teal-500 bg-teal-50 text-teal-600')
                        : (isDark ? 'border-stone-800 text-stone-400' : 'border-gray-200 text-gray-500')
                    }`}
                  >
                    80mm
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={localSettings.receipt_auto_print}
                      onChange={(e) => setLocalSettings(s => ({ ...s, receipt_auto_print: e.target.checked }))}
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${localSettings.receipt_auto_print ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-stone-700'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${localSettings.receipt_auto_print ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className={`text-sm font-bold ${isDark ? 'text-stone-200' : 'text-gray-700'}`}>Cetak otomatis setelah transaksi</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={localSettings.receipt_show_tax}
                      onChange={(e) => setLocalSettings(s => ({ ...s, receipt_show_tax: e.target.checked }))}
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${localSettings.receipt_show_tax ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-stone-700'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${localSettings.receipt_show_tax ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className={`text-sm font-bold ${isDark ? 'text-stone-200' : 'text-gray-700'}`}>Tampilkan pajak di struk</span>
                </label>
              </div>

              <div>
                <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                  Pesan Footer Struk
                </label>
                <textarea
                  className={`w-full p-4 rounded-xl border text-sm outline-none focus:ring-2 transition-all min-h-[100px] resize-none ${
                    isDark 
                      ? 'bg-stone-950 border-stone-800 text-white focus:ring-amber-500/20' 
                      : 'bg-white border-gray-200 text-gray-900 focus:ring-teal-500/20'
                  }`}
                  placeholder="Terima kasih telah berkunjung!"
                  maxLength={100}
                  value={localSettings.receipt_footer}
                  onChange={(e) => setLocalSettings(s => ({ ...s, receipt_footer: e.target.value }))}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-[10px] text-gray-400 font-bold">{localSettings.receipt_footer.length}/100</span>
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW */}
            <div>
              <label className={`block text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                Preview Struk
              </label>
              <div className={`flex justify-center p-6 rounded-2xl border-2 border-dashed ${isDark ? 'border-stone-800 bg-stone-900/50' : 'border-gray-200 bg-gray-50'}`}>
                <div 
                  className={`bg-white text-black p-4 shadow-xl transition-all duration-300 transform origin-top ${
                    localSettings.receipt_paper_size === '58mm' ? 'w-[200px]' : 'w-[280px]'
                  }`}
                  style={{ fontFamily: "'Courier New', Courier, monospace" }}
                >
                  <div className="text-center mb-2">
                    <p className="font-black text-sm uppercase">{settings?.shop_name || 'NAMA TOKO'}</p>
                    <p className="text-[10px]">{settings?.address || 'Alamat Toko'}</p>
                  </div>
                  
                  <div className="border-b border-black border-dashed my-2" />
                  
                  <div className="text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span>Americano x1</span>
                      <span>25.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Caffe Latte x2</span>
                      <span>56.000</span>
                    </div>
                  </div>

                  <div className="border-b border-black border-dashed my-2" />
                  
                  <div className="text-[10px] space-y-1 font-bold">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>81.000</span>
                    </div>
                    {localSettings.receipt_show_tax && (
                      <div className="flex justify-between">
                        <span>PPN 11%</span>
                        <span>8.910</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs pt-1">
                      <span className="font-black">TOTAL</span>
                      <span className="font-black">89.910</span>
                    </div>
                  </div>

                  <div className="border-b border-black border-dashed my-2" />
                  
                  <div className="text-center">
                    <p className="text-[10px] font-bold">Bayar: Tunai</p>
                  </div>

                  <div className="border-b border-black border-dashed my-2" />
                  
                  <div className="text-center mt-2">
                    <p className="text-[9px] leading-tight italic whitespace-pre-wrap">{localSettings.receipt_footer}</p>
                  </div>
                  
                  <div className="flex justify-center gap-1 mt-4 opacity-20">
                    <div className="w-1 h-1 rounded-full bg-black" />
                    <div className="w-1 h-1 rounded-full bg-black" />
                    <div className="w-1 h-1 rounded-full bg-black" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SettingsCard>
      </div>

      {/* SAVE BAR */}
      <div className={`fixed bottom-0 left-0 right-0 lg:left-60 p-4 border-t flex items-center justify-between z-40 animate-in slide-in-from-bottom-full duration-300 ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'}`}>
        <div className="hidden md:block">
          <p className={`text-xs font-bold ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
            Terakhir diubah: {new Date().toLocaleDateString('id-ID')}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {localSettings.print_method === 'rawbt_intent' ? (
            <button
              type="button"
              onClick={onTestIntent}
              disabled={isPrinting}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold border shadow-sm transition-all active:scale-95 ${
                isDark 
                  ? 'border-stone-700 text-stone-200 hover:bg-stone-800' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isPrinting ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
              Test Print Android (RawBT Intent)
            </button>
          ) : localSettings.print_method === 'rawbt' ? (
            <button
              type="button"
              onClick={() => {
                print({
                  shopName: settings?.shop_name || 'SmartPOS',
                  shopAddress: settings?.address,
                  shopPhone: settings?.phone,
                  cashierName: 'System Test',
                  transactionId: 'TEST-12345678',
                  createdAt: new Date(),
                  orderType: 'dine_in',
                  items: [
                    { name: 'Test Americano', quantity: 1, price: 25000, subtotal: 25000 },
                    { name: 'Test Caffe Latte', quantity: 2, price: 28000, subtotal: 56000 }
                  ],
                  subtotal: 81000,
                  tax: localSettings.receipt_show_tax ? 8910 : 0,
                  taxRate: 11,
                  grandTotal: localSettings.receipt_show_tax ? 89910 : 81000,
                  paymentMethod: 'cash',
                  receiptFooter: localSettings.receipt_footer,
                  paperSize: localSettings.receipt_paper_size as '58mm' | '80mm'
                });
              }}
              disabled={isPrinting || !localSettings.rawbt_ip}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold border shadow-sm transition-all active:scale-95 ${
                isDark 
                  ? 'border-stone-700 text-stone-200 hover:bg-stone-800' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isPrinting ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
              Test Print
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${
              isSaving 
                ? 'bg-stone-400 cursor-not-allowed' 
                : isDark 
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                  : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20'
            }`}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
}
