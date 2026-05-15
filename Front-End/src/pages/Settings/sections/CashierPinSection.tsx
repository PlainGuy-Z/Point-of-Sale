import { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../hooks/useToast';
import { appApi, ApiError } from '../../../services/appApi';
import { Save, X, Check, Loader2, Trash2 } from 'lucide-react';
import SettingsCard from '../components/SettingsCard';
import SettingsInput from '../components/SettingsInput';

export default function CashierPinSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const [hasPin, setHasPin] = useState(Boolean(user?.pin));
  const [showPinForm, setShowPinForm] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    setHasPin(Boolean(user?.pin));
  }, [user?.pin]);

  const digitsOnly = (v: string) => /^\d*$/.test(v);

  const savePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (!digitsOnly(newPin) || !digitsOnly(confirmPin)) {
      setPinError('PIN hanya boleh angka.');
      return;
    }
    if (newPin.length < 4 || newPin.length > 6) {
      setPinError('PIN harus 4–6 digit.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('Konfirmasi PIN tidak cocok.');
      return;
    }
    setPinLoading(true);
    try {
      await appApi.put<{ success: boolean }>('/users/me/pin', { pin: newPin });
      setHasPin(true);
      setShowPinForm(false);
      setNewPin('');
      setConfirmPin('');
      showToast('PIN berhasil disimpan', 'success');
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Gagal menyimpan PIN.';
      setPinError(msg);
      showToast(msg, 'error');
    } finally {
      setPinLoading(false);
    }
  };

  const removePin = async () => {
    if (!window.confirm('Hapus PIN? Anda bisa membuat PIN baru kapan saja.')) return;
    setPinLoading(true);
    setPinError(null);
    try {
      await appApi.delete<{ success: boolean }>('/users/me/pin');
      setHasPin(false);
      setShowPinForm(false);
      setNewPin('');
      setConfirmPin('');
      showToast('PIN dihapus', 'success');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Gagal menghapus PIN.';
      showToast(msg, 'error');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      {ToastComponent}

      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          PIN Aplikasi Kasir
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
          PIN opsional untuk tindakan sensitif pada perangkat kasir
        </p>
      </div>

      {/* PIN Form Card */}
      <SettingsCard title="PIN Keamanan">
        <div className="space-y-4">
          {!showPinForm ? (
            <>
              {/* Status */}
              <div className="flex items-center gap-3 pb-4">
                {hasPin ? (
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                      isDark
                        ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}
                  >
                    <Check size={14} />
                    PIN Aktif
                  </span>
                ) : (
                  <span
                    className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${
                      isDark
                        ? 'bg-stone-800 text-stone-400'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Belum ada PIN
                  </span>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3">
                {hasPin ? (
                  <>
                    <button
                      type="button"
                      disabled={pinLoading}
                      onClick={() => setShowPinForm(true)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 ${
                        isDark
                          ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                          : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
                      }`}
                    >
                      Ubah PIN
                    </button>
                    <button
                      type="button"
                      disabled={pinLoading}
                      onClick={() => void removePin()}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold border transition-all disabled:opacity-50 ${
                        isDark
                          ? 'border-red-800 text-red-400 hover:bg-red-500/10'
                          : 'border-red-300 text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 size={16} />
                      Hapus PIN
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={pinLoading}
                    onClick={() => setShowPinForm(true)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${
                      isDark
                        ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                        : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
                    }`}
                  >
                    Buat PIN
                  </button>
                )}
              </div>
            </>
          ) : (
            /* PIN Form */
            <form onSubmit={savePin} className="space-y-4">
              {pinError && (
                <div
                  className={`text-sm p-3 rounded-xl border ${
                    isDark
                      ? 'bg-red-950/30 border-red-800 text-red-300'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {pinError}
                </div>
              )}

              <SettingsInput
                label="PIN Baru"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={6}
                pattern="\d{4,6}"
                value={newPin}
                onChange={(e) => digitsOnly(e.target.value) && setNewPin(e.target.value)}
                placeholder="4–6 digit"
                required
              />

              <SettingsInput
                label="Konfirmasi PIN"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => digitsOnly(e.target.value) && setConfirmPin(e.target.value)}
                placeholder="Ulangi PIN"
                required
              />

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={pinLoading}
                  onClick={() => {
                    setShowPinForm(false);
                    setPinError(null);
                    setNewPin('');
                    setConfirmPin('');
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all disabled:opacity-50 ${
                    isDark
                      ? 'border-stone-700 text-stone-300 hover:bg-stone-800'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pinLoading}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 ${
                    isDark
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                      : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
                  }`}
                >
                  {pinLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Simpan PIN
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </SettingsCard>
    </div>
  );
}
