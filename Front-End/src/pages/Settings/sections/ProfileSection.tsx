import { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../hooks/useToast';
import { authApi } from '../../../services/authApi';
import SettingsCard from '../components/SettingsCard';
import SettingsInput from '../components/SettingsInput';
import { Store, MapPin, Clock, Image as ImageIcon, Upload } from 'lucide-react';

export default function ProfileSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const [form, setForm] = useState({
    shop_name: settings?.shop_name || '',
    address: settings?.address || '',
    phone: settings?.phone || '',
    open_time: settings?.open_time || '08:00',
    close_time: settings?.close_time || '22:00',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        shop_name: settings.shop_name || '',
        address: settings.address || '',
        phone: settings.phone || '',
        open_time: settings.open_time || '08:00',
        close_time: settings.close_time || '22:00',
      });
      setIsDirty(false);
    }
  }, [settings]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (form.shop_name !== user?.shop?.name) {
        await authApi.updateProfile({ shop_name: form.shop_name });
      }

      await updateSettings({
        address: form.address,
        phone: form.phone,
        open_time: form.open_time,
        close_time: form.close_time,
      });

      setIsDirty(false);
      showToast('Profil toko berhasil disimpan', 'success');
      
      // Force reload if shop name changed so layout updates since we can't modify AuthContext
      if (form.shop_name !== user?.shop?.name) {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 pb-24 relative">
      <h1 className={`text-xl font-black mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Profil Toko
      </h1>

      <SettingsCard title="Identitas Toko" icon={Store}>
        <SettingsInput
          label="Nama Toko"
          value={form.shop_name}
          onChange={(e) => handleChange('shop_name', e.target.value)}
          required
        />
        {/* Tagline is not in DB schema but requested in UI layout. We use a dummy for now */}
        <SettingsInput
          label="Tagline / Motto"
          description="Opsional, akan tampil di struk"
          placeholder="e.g. Kopi Terbaik di Kota"
          disabled
        />
      </SettingsCard>

      <SettingsCard title="Kontak & Lokasi" icon={MapPin}>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className={`text-sm font-semibold ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
              Alamat Lengkap
            </label>
          </div>
          <textarea
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            rows={3}
            className={`w-full p-3 rounded-xl border text-sm outline-none transition-all resize-none ${
              isDark
                ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500 focus:ring-2 focus:ring-amber-500/30'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500/30'
            }`}
            placeholder="Jalan, Nomor, RT/RW, Kota"
          />
        </div>
        <SettingsInput
          label="Nomor Telepon"
          type="tel"
          value={form.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="08123456789"
        />
      </SettingsCard>

      <SettingsCard title="Jam Operasional" icon={Clock} description="Ditampilkan di struk dan halaman toko">
        <div className="grid grid-cols-2 gap-4">
          <SettingsInput
            label="Jam Buka"
            type="time"
            value={form.open_time}
            onChange={(e) => handleChange('open_time', e.target.value)}
          />
          <SettingsInput
            label="Jam Tutup"
            type="time"
            value={form.close_time}
            onChange={(e) => handleChange('close_time', e.target.value)}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Logo Toko" icon={ImageIcon}>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {settings?.logo_url && (
            <img src={settings.logo_url} alt="Logo Toko" className="w-20 h-20 rounded-2xl object-cover border dark:border-stone-800 flex-shrink-0" />
          )}
          <div className={`flex-1 w-full border-2 border-dashed rounded-2xl p-6 text-center ${isDark ? 'border-stone-700' : 'border-gray-200'}`}>
            <Upload size={24} className={`mx-auto mb-2 ${isDark ? 'text-stone-500' : 'text-gray-400'}`} />
            <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>Upload logo toko</p>
            <p className={`text-xs mb-3 ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>PNG, JPG max 2MB</p>
            <div className="inline-block relative">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-stone-800 dark:text-stone-500`}
                disabled
              >
                Pilih File
              </button>
              <span className={`absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold whitespace-nowrap ${
                isDark ? 'bg-amber-500' : 'bg-teal-500'
              }`}>
                Coming Soon
              </span>
            </div>
            <input type="file" accept="image/*" className="hidden" />
          </div>
        </div>
      </SettingsCard>

      {/* Sticky Footer */}
      {isDirty && (
        <div className={`fixed bottom-0 left-0 right-0 lg:left-60 p-4 border-t flex items-center justify-between z-50 animate-in slide-in-from-bottom-full duration-300 ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200 shadow-2xl shadow-black/5'}`}>
          <div className={`text-sm font-medium ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
            Ada perubahan yang belum disimpan
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (settings) {
                  setForm({
                    shop_name: settings.shop_name || '',
                    address: settings.address || '',
                    phone: settings.phone || '',
                    open_time: settings.open_time || '08:00',
                    close_time: settings.close_time || '22:00',
                  });
                }
                setIsDirty(false);
              }}
              disabled={isSaving}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                isDark ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg ${
                isDark ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20'
              }`}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      )}
      {ToastComponent}
    </div>
  );
}
