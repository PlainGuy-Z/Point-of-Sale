import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { authApi } from '../../services/authApi';
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
} from 'lucide-react';

export default function CashierSettings() {
  const { user } = useAuth();
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
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengubah password.' });
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

  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-stone-300' : 'text-gray-700'}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
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

      {/* Section 2: Keamanan — Change Password */}
      <div className={`rounded-2xl border shadow-lg ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'}`}>
        <div className={`p-6 border-b ${isDark ? 'border-stone-800' : 'border-gray-200'}`}>
          <h2 className={`flex items-center gap-2 font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Lock className="w-5 h-5 text-amber-500" />
            Keamanan
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
