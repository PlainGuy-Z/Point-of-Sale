
import React, { useState, useEffect, useMemo } from 'react';
import { Percent, Handshake, CreditCard, Save, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useToast } from '../../../hooks/useToast';
import SettingsCard from '../components/SettingsCard';
import SettingsInput from '../components/SettingsInput';
import ErrorBoundary from '../../../components/common/ErrorBoundary';



function _PaymentSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { settings, updateSettings } = useSettings();
  const { showToast, ToastComponent } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    tax_enabled: false,
    tax_rate: 0,
    tax_label: 'PPN',
    tax_inclusive: false,
    service_charge_enabled: false,
    service_charge_rate: 0,
    service_charge_label: 'Service Charge',
    payment_cash: true,
    payment_qris: true,
    payment_transfer: true,
  });

  // Sync form with settings when they load or change
  useEffect(() => {
    if (settings) {
      setForm({
        tax_enabled: settings.tax_enabled ?? false,
        tax_rate: settings.tax_rate ?? 0,
        tax_label: settings.tax_label ?? 'PPN',
        tax_inclusive: settings.tax_inclusive ?? false,
        service_charge_enabled: settings.service_charge_enabled ?? false,
        service_charge_rate: settings.service_charge_rate ?? 0,
        service_charge_label: settings.service_charge_label ?? 'Service Charge',
        payment_cash: settings.payment_cash ?? true,
        payment_qris: settings.payment_qris ?? true,
        payment_transfer: settings.payment_transfer ?? true,
      });
    }
  }, [settings]);

  const isDirty = useMemo(() => {
    if (!settings) return false;
    return (
      form.tax_enabled !== settings.tax_enabled ||
      form.tax_rate !== settings.tax_rate ||
      form.tax_label !== settings.tax_label ||
      form.tax_inclusive !== settings.tax_inclusive ||
      form.service_charge_enabled !== settings.service_charge_enabled ||
      form.service_charge_rate !== settings.service_charge_rate ||
      form.service_charge_label !== settings.service_charge_label ||
      form.payment_cash !== settings.payment_cash ||
      form.payment_qris !== settings.payment_qris ||
      form.payment_transfer !== settings.payment_transfer
    );
  }, [form, settings]);

  const allPaymentsDisabled = !form.payment_cash && !form.payment_qris && !form.payment_transfer;
  const isSaveDisabled = isSaving || allPaymentsDisabled || !isDirty;

  const handleSave = async () => {
    if (allPaymentsDisabled) {
      showToast('Minimal 1 metode pembayaran harus aktif', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings(form);
      showToast('Pengaturan pembayaran berhasil disimpan', 'success');
    } catch (err) {
      showToast('Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateForm = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Preview Calculations
  const previewPrice = 20000;
  let taxAmount = 0;
  let finalTotal = previewPrice;

  if (form.tax_inclusive) {
    // Inclusive: Tax is already inside the 20,000
    // formula: base_price = total / (1 + rate)
    const basePrice = previewPrice / (1 + form.tax_rate / 100);
    taxAmount = previewPrice - basePrice;
    finalTotal = previewPrice;
  } else {
    // Exclusive: Tax is added to the 20,000
    taxAmount = previewPrice * (form.tax_rate / 100);
    finalTotal = previewPrice + taxAmount;
  }

  // Common Toggle Component
  const Toggle = ({ 
    checked, 
    onChange, 
    label 
  }: { 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
    label: string; 
  }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={`w-10 h-5 rounded-full transition-colors ${
            checked ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-stone-700'
          }`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </div>
      <span className={`text-sm font-bold ${isDark ? 'text-stone-200' : 'text-gray-700'}`}>
        {label}
      </span>
    </label>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24">
      {ToastComponent}
      <div className="mb-6">
        <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Pembayaran & Pajak
        </h1>
        <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
          Atur metode pembayaran, pajak (PPN), dan service charge.
        </p>
      </div>

      <div className="space-y-6">
        {/* CARD 1: Pajak (PPN) */}
        <SettingsCard
          title="Pajak (PPN)"
          description="Pengaturan penambahan pajak pada setiap transaksi"
          icon={Percent}
        >
          <div className="mb-6">
            <Toggle
              checked={form.tax_enabled}
              onChange={(v) => updateForm('tax_enabled', v)}
              label="Aktifkan Pajak"
            />
          </div>

          {form.tax_enabled && (
            <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsInput
                  label="Persentase Pajak"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  suffix="%"
                  value={form.tax_rate}
                  onChange={(e) => updateForm('tax_rate', parseFloat(e.target.value) || 0)}
                />
                <SettingsInput
                  label="Label di Struk"
                  placeholder="Contoh: PPN"
                  value={form.tax_label}
                  onChange={(e) => updateForm('tax_label', e.target.value)}
                />
              </div>

              <div>
                <label className={`block text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                  Jenis Pajak
                </label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="radio"
                        name="tax_type"
                        className="sr-only"
                        checked={!form.tax_inclusive}
                        onChange={() => updateForm('tax_inclusive', false)}
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!form.tax_inclusive ? (isDark ? 'border-amber-500' : 'border-teal-500') : (isDark ? 'border-stone-600' : 'border-gray-300')}`}>
                        {!form.tax_inclusive && <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-amber-500' : 'bg-teal-500'}`} />}
                      </div>
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isDark ? 'text-stone-200' : 'text-gray-700'}`}>Eksklusif (Belum termasuk pajak)</p>
                      <p className={`text-[11px] ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Pajak ditambahkan ke harga produk.</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="radio"
                        name="tax_type"
                        className="sr-only"
                        checked={form.tax_inclusive}
                        onChange={() => updateForm('tax_inclusive', true)}
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.tax_inclusive ? (isDark ? 'border-amber-500' : 'border-teal-500') : (isDark ? 'border-stone-600' : 'border-gray-300')}`}>
                        {form.tax_inclusive && <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-amber-500' : 'bg-teal-500'}`} />}
                      </div>
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isDark ? 'text-stone-200' : 'text-gray-700'}`}>Inklusif (Sudah termasuk pajak)</p>
                      <p className={`text-[11px] ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Harga produk sudah termasuk pajak.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* LIVE PREVIEW */}
              <div className={`p-4 rounded-xl border-2 border-dashed mt-4 ${isDark ? 'border-stone-800 bg-stone-900/50' : 'border-gray-200 bg-gray-50/50'}`}>
                <p className={`text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                  Live Preview
                </p>
                <div className="space-y-1 text-sm font-medium">
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-stone-300' : 'text-gray-600'}>Contoh: Produk</span>
                    <span className={isDark ? 'text-stone-300' : 'text-gray-600'}>Rp 20.000</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-stone-400' : 'text-gray-500'}>
                      Pajak {form.tax_label} {form.tax_rate}% {form.tax_inclusive ? '(Inklusif)' : '(Eksklusif)'}
                    </span>
                    <span className={isDark ? 'text-stone-400' : 'text-gray-500'}>
                      Rp {taxAmount.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className={`flex justify-between font-bold pt-2 border-t mt-2 ${isDark ? 'border-stone-700 text-white' : 'border-gray-200 text-gray-900'}`}>
                    <span>Total yang dibayar pelanggan:</span>
                    <span>Rp {finalTotal.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SettingsCard>

        {/* CARD 2: Service Charge */}
        <SettingsCard
          title="Service Charge"
          description="Tambahan biaya layanan pada transaksi"
          icon={Handshake}
        >
          <div className="mb-6">
            <Toggle
              checked={form.service_charge_enabled}
              onChange={(v) => updateForm('service_charge_enabled', v)}
              label="Aktifkan Service Charge"
            />
          </div>

          {form.service_charge_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
              <SettingsInput
                label="Persentase"
                type="number"
                min="0"
                max="100"
                step="0.01"
                suffix="%"
                value={form.service_charge_rate}
                onChange={(e) => updateForm('service_charge_rate', parseFloat(e.target.value) || 0)}
              />
              <SettingsInput
                label="Label"
                placeholder="Contoh: Service Charge"
                value={form.service_charge_label}
                onChange={(e) => updateForm('service_charge_label', e.target.value)}
              />
            </div>
          )}
        </SettingsCard>

        {/* CARD 3: Metode Pembayaran */}
        <SettingsCard
          title="Metode Pembayaran"
          description="Pilih metode pembayaran yang akan ditampilkan di POS"
          icon={CreditCard}
        >
          <div className="space-y-4">
            <Toggle
              checked={form.payment_cash}
              onChange={(v) => updateForm('payment_cash', v)}
              label="Tunai (Cash)"
            />
            <Toggle
              checked={form.payment_qris}
              onChange={(v) => updateForm('payment_qris', v)}
              label="QRIS / E-Wallet"
            />
            <Toggle
              checked={form.payment_transfer}
              onChange={(v) => updateForm('payment_transfer', v)}
              label="Transfer Bank"
            />
          </div>

          {allPaymentsDisabled && (
            <div className={`mt-4 p-3 rounded-xl flex items-start gap-3 border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">Minimal 1 metode pembayaran harus aktif agar kasir dapat memproses transaksi.</p>
            </div>
          )}
        </SettingsCard>
      </div>

      {/* SAVE BAR */}
      <div className={`fixed bottom-0 left-0 right-0 lg:left-60 p-4 border-t flex items-center justify-between z-40 animate-in slide-in-from-bottom-full duration-300 ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'}`}>
        <div className="hidden md:block">
          {isDirty && (
            <p className={`text-xs font-bold ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
              Ada perubahan yang belum disimpan
            </p>
          )}
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${
              isSaveDisabled 
                ? (isDark ? 'bg-stone-800 text-stone-500 cursor-not-allowed shadow-none' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none')
                : (isDark ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20')
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


export default function PaymentSection() {
  return (
    <ErrorBoundary>
      <_PaymentSection />
    </ErrorBoundary>
  );
}
