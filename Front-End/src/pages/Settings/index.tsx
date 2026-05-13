import React, { useState, useEffect } from 'react';
import { useSettings, type ShopSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { authApi } from '../../services/authApi';
import { ApiError } from '../../services/appApi';
import {
  Store,
  Percent,
  Receipt,
  Lock,
  Save,
  Loader2,
  Clock,
  Phone,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  Mail,
  User as UserIcon,
  Printer,
  FileText
} from 'lucide-react';

type TabType = 'store' | 'tax' | 'receipt' | 'security';

export default function Settings() {
  const { settings, isLoading, updateSettings } = useSettings();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast, ToastComponent } = useToast();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const hash = window.location.hash.replace('#', '');
    return (['store', 'tax', 'receipt', 'security'] as TabType[]).includes(hash as TabType) 
      ? (hash as TabType) 
      : 'store';
  });

  const [formData, setFormData] = useState<Partial<ShopSettings>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Security states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formData);
      showToast('Pengaturan berhasil disimpan!', 'success');
    } catch (err) {
      showToast('Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileSave = async () => {
    if (!profileName.trim()) return;
    setProfileSaving(true);
    try {
      await authApi.updateProfile({ name: profileName });
      showToast('Profil berhasil diperbarui!', 'success');
    } catch (err) {
      showToast('Gagal memperbarui profil', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi password tidak cocok', 'error');
      return;
    }
    setPwSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      showToast('Password berhasil diubah!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Gagal mengubah password';
      showToast(msg, 'error');
    } finally {
      setPwSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
      </div>
    );
  }

  const inputClass = `w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-4 focus:ring-teal-100 focus:border-teal-400 ${
    isDark ? 'bg-stone-900 border-stone-800 text-white placeholder:text-stone-600' : 'bg-white border-[#E2E8F0] text-[#0F172A]'
  }`;

  const labelClass = `block text-sm font-semibold mb-2 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`;

  const Card = ({ children, title, subtitle, icon: Icon }: { children: React.ReactNode, title: string, subtitle?: string, icon: any }) => (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-[#E2E8F0]'}`}>
      <div className={`px-6 py-5 border-b flex items-center gap-4 ${isDark ? 'border-stone-800 bg-stone-900/50' : 'border-[#F1F5F9] bg-white'}`}>
        <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-teal-500/10 text-teal-500' : 'bg-[#F0FDFA] text-teal-600'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{title}</h3>
          {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDark ? '' : 'bg-[#F8FAFC]'} -m-6 p-6`}>
      <div className="max-w-6xl mx-auto pb-20">
        {ToastComponent}
        
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight text-[#0F172A] dark:text-white">Settings</h1>
          <p className="text-[#475569] dark:text-stone-400 mt-2 font-medium">Manage your shop configuration and security preferences.</p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'store', label: 'Toko', icon: Store },
            { id: 'tax', label: 'Pajak & Biaya', icon: Percent },
            { id: 'receipt', label: 'Struk & Printer', icon: Receipt },
            { id: 'security', label: 'Keamanan', icon: Lock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25 scale-[1.02]'
                  : `text-[#475569] hover:bg-white border border-transparent hover:border-[#E2E8F0] dark:hover:bg-stone-800 ${isDark ? 'hover:text-stone-300' : ''}`
              }`}
            >
              <tab.icon className="h-4.5 w-4.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave}>
          {activeTab === 'store' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Identitas Toko" icon={Store} subtitle="Informasi dasar yang muncul di struk dan aplikasi.">
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Nama Toko</label>
                      <input name="shop_name" value={formData.shop_name || ''} onChange={handleChange} className={inputClass} placeholder="Contoh: Kopi Senja" />
                    </div>
                    <div>
                      <label className={labelClass}>Nomor Telepon</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input name="phone" value={formData.phone || ''} onChange={handleChange} className={`${inputClass} pl-11`} placeholder="0812..." />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Alamat Lengkap</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4 h-4 w-4 text-stone-400" />
                        <textarea name="address" value={formData.address || ''} onChange={handleChange} rows={3} className={`${inputClass} pl-11 pt-3.5`} placeholder="Jl. Raya..." />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="Jam Operasional" icon={Clock} subtitle="Jadwal buka dan tutup toko Anda.">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Jam Buka</label>
                      <input type="time" name="open_time" value={formData.open_time || '08:00'} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Jam Tutup</label>
                      <input type="time" name="close_time" value={formData.close_time || '22:00'} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                  <div className={`mt-6 p-4 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-teal-500/5 border-teal-500/20' : 'bg-[#F0FDFA] border-[#99F6E4]'}`}>
                    <AlertCircle className="h-5 w-5 text-teal-600 mt-0.5" />
                    <p className={`text-xs ${isDark ? 'text-teal-400' : 'text-teal-700'} font-medium leading-relaxed`}>
                      Jam operasional digunakan untuk laporan harian dan sinkronisasi shift kasir.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Pajak (PPN)" icon={Percent} subtitle="Pengaturan pajak pertambahan nilai untuk setiap transaksi.">
                  <div className="space-y-6">
                    <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'border-stone-800 bg-stone-900/50' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
                      <div>
                        <p className="font-bold text-[#0F172A] dark:text-white">Aktifkan Pajak</p>
                        <p className="text-xs text-stone-500">Otomatis tambahkan pajak ke struk.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="tax_enabled" checked={!!formData.tax_enabled} onChange={handleChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-stone-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    <div className={!formData.tax_enabled ? 'opacity-40 pointer-events-none' : ''}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Persentase (%)</label>
                          <input type="number" name="tax_rate" value={formData.tax_rate || 0} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Label Pajak</label>
                          <input name="tax_label" value={formData.tax_label || 'PPN'} onChange={handleChange} className={inputClass} placeholder="Contoh: PPN" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <input type="checkbox" name="tax_inclusive" checked={!!formData.tax_inclusive} onChange={handleChange} className="w-4 h-4 rounded border-[#E2E8F0] text-teal-600 focus:ring-teal-500" />
                        <label className="text-sm font-medium text-[#475569] dark:text-stone-300">Harga sudah termasuk pajak (Inclusive)</label>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="Service Charge" icon={Smartphone} subtitle="Biaya layanan tambahan jika ada.">
                  <div className="space-y-6">
                    <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'border-stone-800 bg-stone-900/50' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
                      <div>
                        <p className="font-bold text-[#0F172A] dark:text-white">Biaya Layanan</p>
                        <p className="text-xs text-stone-500">Aktifkan biaya layanan tambahan.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="service_charge_enabled" checked={!!formData.service_charge_enabled} onChange={handleChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-stone-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    <div className={!formData.service_charge_enabled ? 'opacity-40 pointer-events-none' : ''}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Persentase (%)</label>
                          <input type="number" name="service_charge_rate" value={formData.service_charge_rate || 0} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Label Biaya</label>
                          <input name="service_charge_label" value={formData.service_charge_label || 'Service'} onChange={handleChange} className={inputClass} placeholder="Contoh: Service" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Desain Struk" icon={FileText} subtitle="Kustomisasi tampilan struk belanja.">
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Pesan Kaki Struk (Footer)</label>
                      <textarea name="receipt_footer" value={formData.receipt_footer || ''} onChange={handleChange} rows={3} className={inputClass} placeholder="Terima kasih atas kunjungan Anda!" />
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'border-stone-800' : 'border-[#E2E8F0]'}`}>
                      <div>
                        <p className="text-sm font-bold text-[#0F172A] dark:text-white">Tampilkan Logo</p>
                        <p className="text-xs text-stone-500">Cetak logo di bagian atas struk.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="receipt_show_logo" checked={!!formData.receipt_show_logo} onChange={handleChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-stone-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                      </label>
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'border-stone-800' : 'border-[#E2E8F0]'}`}>
                      <div>
                        <p className="text-sm font-bold text-[#0F172A] dark:text-white">Rincian Pajak</p>
                        <p className="text-xs text-stone-500">Tampilkan rincian pajak di struk.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="receipt_show_tax" checked={!!formData.receipt_show_tax} onChange={handleChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-stone-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                      </label>
                    </div>
                  </div>
                </Card>

                <Card title="Printer & Hardware" icon={Printer} subtitle="Pengaturan ukuran kertas dan pencetakan otomatis.">
                  <div className="space-y-6">
                    <div>
                      <label className={labelClass}>Ukuran Kertas</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['58mm', '80mm'].map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, receipt_paper_size: size as any }))}
                            className={`px-4 py-4 rounded-2xl border-2 font-bold transition-all ${
                              formData.receipt_paper_size === size
                                ? 'border-teal-500 bg-teal-50 text-teal-600'
                                : `border-[#F1F5F9] dark:border-stone-800 text-[#94A3B8] hover:border-[#E2E8F0]`
                            }`}
                          >
                            {size === '58mm' ? '58mm (Kecil)' : '80mm (Besar)'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-teal-500/5 border-teal-500/20' : 'bg-[#F0FDFA] border-[#99F6E4]'}`}>
                      <div>
                        <p className="text-sm font-bold text-[#0F172A] dark:text-white">Cetak Otomatis</p>
                        <p className={`text-xs ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>Cetak struk langsung setelah checkout.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="receipt_auto_print" checked={!!formData.receipt_auto_print} onChange={handleChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-stone-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                      </label>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Profil Pemilik" icon={UserIcon} subtitle="Perbarui nama lengkap yang terdaftar.">
                  <div className="space-y-5">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="h-16 w-16 rounded-full bg-teal-600 flex items-center justify-center text-white text-2xl font-black">
                        {user?.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-[#0F172A] dark:text-white">{user?.name}</p>
                        <p className="text-sm text-[#475569] dark:text-stone-500">{user?.email}</p>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Nama Lengkap</label>
                      <input value={profileName} onChange={e => setProfileName(e.target.value)} className={inputClass} />
                    </div>
                    <button
                      type="button"
                      onClick={handleProfileSave}
                      disabled={profileSaving}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0F172A] dark:bg-white dark:text-stone-900 text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Simpan Perubahan
                    </button>
                  </div>
                </Card>

                <Card title="Ganti Password" icon={Lock} subtitle="Gunakan minimal 8 karakter dengan kombinasi angka.">
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Password Sekarang</label>
                      <div className="relative">
                        <input type={showPw.current ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} />
                        <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
                          {showPw.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Password Baru</label>
                      <div className="relative">
                        <input type={showPw.new ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} />
                        <button type="button" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
                          {showPw.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Konfirmasi Password</label>
                      <div className="relative">
                        <input type={showPw.confirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} />
                        <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
                          {showPw.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handlePasswordChange}
                      disabled={pwSaving}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 w-full"
                    >
                      {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      Ubah Password
                    </button>
                  </div>
                </Card>
              </div>

              {/* Danger Zone */}
              <div className={`mt-10 p-6 rounded-2xl border ${isDark ? 'bg-red-950/10 border-red-900/20' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="text-red-500 h-6 w-6" />
                  <h3 className="text-red-800 dark:text-red-400 font-bold text-lg">Danger Zone</h3>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-red-700 dark:text-red-300 font-medium">Hapus Akun & Data Toko</p>
                    <p className="text-red-600/70 dark:text-red-400/60 text-xs">Tindakan ini tidak dapat dibatalkan. Seluruh data akan hilang selamanya.</p>
                  </div>
                  <button className="px-6 py-2.5 bg-white border border-red-300 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all text-sm">
                    Delete Shop Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Global Save Button (Float) */}
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-40 ${activeTab === 'security' ? 'hidden' : ''}`}>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-3 py-4 bg-teal-600 text-white font-black text-lg rounded-3xl shadow-2xl shadow-teal-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
              SIMPAN SEMUA PENGATURAN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}