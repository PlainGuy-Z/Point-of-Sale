import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { authApi } from '../../services/authApi';
import { appApi, ApiError } from '../../services/appApi';
import { useToast } from '../../hooks/useToast';
import {
  User,
  Mail,
  Shield,
  Store,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Trash2,
} from 'lucide-react';

export default function CashierSettings() {
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [hasPin, setHasPin] = useState(Boolean(user?.pin));
  const [showPinForm, setShowPinForm] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    setHasPin(Boolean(user?.pin));
  }, [user?.pin]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password baru minimal 8 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setMessage({ type: 'success', text: 'Password berhasil diubah!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'Gagal mengubah password.';
      setMessage({ type: 'error', text });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const inputClass = `w-full px-4 py-3 pl-11 pr-11 rounded-xl border outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
    isDark
      ? 'bg-stone-950 border-stone-800 text-white placeholder-stone-600'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

  const pinInputClass = `w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
    isDark ? 'bg-stone-950 border-stone-800 text-white placeholder-stone-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-stone-300' : 'text-gray-700'}`;

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
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {ToastComponent}
      {/* Header */}
      <div className="mb-2">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Pengaturan Akun
        </h1>
        <p className={`mt-1 ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>
          Kelola profil dan keamanan akun Anda
        </p>
      </div>

      {/* Notification */}
      {message && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
          message.type === 'success'
            ? (isDark ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-green-50 border-green-200 text-green-700')
            : (isDark ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-700')
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      {/* Section 1: Profil Saya */}
      <div className={`rounded-2xl border shadow-lg ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'}`}>
        <div className={`p-6 border-b ${isDark ? 'border-stone-800' : 'border-gray-200'}`}>
          <h2 className={`flex items-center gap-2 font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <User className="w-5 h-5 text-amber-500" />
            Profil Saya
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
            Informasi akun Anda (hanya bisa diubah oleh Owner)
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-5 mb-6">
            {/* Avatar */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black uppercase ${
              isDark ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              {user?.name?.[0] || 'U'}
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'User'}</h3>
              <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>{user?.email || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <User className={`w-4 h-4 ${isDark ? 'text-stone-500' : 'text-gray-400'}`} />
                <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>Nama</span>
              </div>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name || '-'}</p>
            </div>
            {/* Email */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Mail className={`w-4 h-4 ${isDark ? 'text-stone-500' : 'text-gray-400'}`} />
                <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>Email</span>
              </div>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.email || '-'}</p>
            </div>
            {/* Role */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Shield className={`w-4 h-4 ${isDark ? 'text-stone-500' : 'text-gray-400'}`} />
                <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>Role</span>
              </div>
              <p className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Kasir</p>
            </div>
            {/* Toko */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-stone-950 border-stone-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Store className={`w-4 h-4 ${isDark ? 'text-stone-500' : 'text-gray-400'}`} />
                <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>Toko</span>
              </div>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.shop?.name || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* PIN Kasir */}
      <div className={`rounded-2xl border shadow-lg ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'}`}>
        <div className={`p-6 border-b ${isDark ? 'border-stone-800' : 'border-gray-200'}`}>
          <h2 className={`flex items-center gap-2 font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <KeyRound className="w-5 h-5 text-amber-500" />
            PIN Aplikasi Kasir
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
            PIN opsional untuk tindakan sensitif pada perangkat kasir Anda.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {!showPinForm && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                {hasPin ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                    PIN Aktif ✓
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-stone-200 px-3 py-1 text-xs font-bold text-stone-600 dark:bg-stone-700 dark:text-stone-300">
                    Belum ada PIN
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {hasPin ? (
                  <>
                    <button
                      type="button"
                      disabled={pinLoading}
                      onClick={() => setShowPinForm(true)}
                      className="rounded-3xl bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600 disabled:opacity-60"
                    >
                      Ubah PIN
                    </button>
                    <button
                      type="button"
                      disabled={pinLoading}
                      onClick={() => void removePin()}
                      className="flex items-center gap-2 rounded-3xl border border-red-300 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus PIN
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={pinLoading}
                    onClick={() => setShowPinForm(true)}
                    className="rounded-3xl bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-amber-600 disabled:opacity-60"
                  >
                    Buat PIN
                  </button>
                )}
              </div>
            </>
          )}

          {showPinForm && (
            <form onSubmit={savePin} className="space-y-4 pt-2">
              {pinError && (
                <p className="rounded-3xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{pinError}</p>
              )}
              <div>
                <label className={labelClass}>PIN Baru</label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={6}
                  pattern="\d{4,6}"
                  value={newPin}
                  onChange={(e) => digitsOnly(e.target.value) && setNewPin(e.target.value)}
                  placeholder="4–6 digit"
                  required
                  className={pinInputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Konfirmasi PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => digitsOnly(e.target.value) && setConfirmPin(e.target.value)}
                  placeholder="Ulangi PIN"
                  required
                  className={pinInputClass}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={pinLoading}
                  onClick={() => {
                    setShowPinForm(false);
                    setPinError(null);
                    setNewPin('');
                    setConfirmPin('');
                  }}
                  className="flex-1 rounded-3xl border border-stone-300 py-3 text-sm font-bold dark:border-stone-600 dark:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pinLoading}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-3xl py-3 text-sm font-bold text-white shadow-lg disabled:opacity-60 ${
                    pinLoading ? 'bg-stone-400' : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {pinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan PIN
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Section — Keamanan: Change Password */}
      <div className={`rounded-2xl border shadow-lg ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'}`}>
        <div className={`p-6 border-b ${isDark ? 'border-stone-800' : 'border-gray-200'}`}>
          <h2 className={`flex items-center gap-2 font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Lock className="w-5 h-5 text-amber-500" />
            Ubah Password
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
            Ubah password akun Anda
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-5">
          {/* Current Password */}
          <div>
            <label className={labelClass}>Password Saat Ini</label>
            <div className="relative">
              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-stone-600' : 'text-gray-400'}`} />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Masukkan password saat ini"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-stone-600' : 'text-gray-400'}`}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className={labelClass}>Password Baru</label>
            <div className="relative">
              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-stone-600' : 'text-gray-400'}`} />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Minimal 8 karakter"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-stone-600' : 'text-gray-400'}`}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-xs text-red-500 mt-1">Password harus minimal 8 karakter</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className={labelClass}>Konfirmasi Password Baru</label>
            <div className="relative">
              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-stone-600' : 'text-gray-400'}`} />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Ketik ulang password baru"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-stone-600' : 'text-gray-400'}`}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center gap-3 px-8 py-3 rounded-xl font-semibold shadow-lg transition-all active:scale-95 ${
              isSubmitting
                ? (isDark ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20 hover:shadow-xl'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Simpan Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
