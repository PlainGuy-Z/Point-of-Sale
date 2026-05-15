import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../hooks/useToast';
import { authApi } from '../../../services/authApi';
import SettingsCard from '../components/SettingsCard';
import SettingsInput from '../components/SettingsInput';
import { User, Shield, LogOut, Edit2, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


export default function AccountSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, logout } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const navigate = useNavigate();

  // Profile edit
  const [name, setName] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  // Password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setIsSavingName(true);
    try {
      await authApi.updateProfile({ name });
      setIsEditingName(false);
      showToast('Nama berhasil diperbarui', 'success');
      // Delay to let toast show before we reload to reflect changes in AuthContext
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan nama';
      showToast(msg, 'error');
    } finally {
      setIsSavingName(false);
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { length: 0, color: isDark ? 'bg-stone-800' : 'bg-gray-200', text: '' };
    if (pass.length < 8) return { length: 1, color: 'bg-gray-400', text: 'Terlalu pendek' };
    
    let score = 0;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (pass.length < 12 || score < 3) return { length: 1, color: 'bg-red-500', text: 'Lemah' };
    if (score === 3) return { length: 2, color: 'bg-amber-500', text: 'Sedang' };
    return { length: 3, color: 'bg-green-500', text: 'Kuat' };
  };

  const strength = getPasswordStrength(passwordForm.newPassword);

  const handleSavePassword = async () => {
    setPasswordError('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Semua kolom password wajib diisi');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password baru minimal 8 karakter');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Konfirmasi password tidak cocok');
      return;
    }

    setIsSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password berhasil diubah', 'success');
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'INVALID_CREDENTIALS') {
        setPasswordError('Password saat ini salah');
      } else {
        const msg = err instanceof Error ? err.message : 'Gagal mengubah password';
        setPasswordError(msg);
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari semua perangkat?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="p-6">
      <h1 className={`text-xl font-black mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Akun & Keamanan
      </h1>

      <SettingsCard title="Informasi Akun" icon={User}>
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${
            isDark ? 'bg-amber-500' : 'bg-teal-500'
          }`}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-lg border outline-none ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => {
                    setName(user?.name || '');
                    setIsEditingName(false);
                  }}
                  disabled={isSavingName}
                  className={`p-1.5 rounded-lg ${isDark ? 'bg-stone-700 text-stone-300 hover:bg-stone-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'} disabled:opacity-50`}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.name}
                </h3>
                <button
                  onClick={() => setIsEditingName(true)}
                  className={`p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}
            <p className={`text-sm mb-2 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>{user?.email}</p>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border ${
                isDark ? 'bg-amber-500/20 text-amber-500 border-amber-500/20' : 'bg-teal-50 text-teal-600 border-teal-200'
              }`}>
                {user?.role === 'owner' ? 'Owner' : 'Cashier'}
              </span>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Keamanan" icon={Shield}>
        <div className="space-y-4 max-w-md">
          <SettingsInput
            label="Password Saat Ini"
            type={showPasswords.current ? 'text' : 'password'}
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
            required
            suffix={
              <button type="button" onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}>
                {showPasswords.current ? <span className="text-xs">Sembunyikan</span> : <span className="text-xs">Tampilkan</span>}
              </button>
            }
          />
          
          <div>
            <SettingsInput
              label="Password Baru"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              required
              suffix={
                <button type="button" onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}>
                  {showPasswords.new ? <span className="text-xs">Sembunyikan</span> : <span className="text-xs">Tampilkan</span>}
                </button>
              }
            />
            {/* Password strength bar */}
            {passwordForm.newPassword && (
              <div className="flex items-center gap-2 mt-[-8px] mb-4">
                <div className="flex-1 flex gap-1 h-1.5">
                  <div className={`flex-1 rounded-full ${strength.length >= 1 ? strength.color : isDark ? 'bg-stone-800' : 'bg-gray-200'}`} />
                  <div className={`flex-1 rounded-full ${strength.length >= 2 ? strength.color : isDark ? 'bg-stone-800' : 'bg-gray-200'}`} />
                  <div className={`flex-1 rounded-full ${strength.length >= 3 ? strength.color : isDark ? 'bg-stone-800' : 'bg-gray-200'}`} />
                </div>
                <span className={`text-[10px] font-bold w-16 text-right ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                  {strength.text}
                </span>
              </div>
            )}
          </div>

          <SettingsInput
            label="Konfirmasi Password Baru"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            required
            suffix={
              <button type="button" onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}>
                {showPasswords.confirm ? <span className="text-xs">Sembunyikan</span> : <span className="text-xs">Tampilkan</span>}
              </button>
            }
          />
          
          {passwordError && (
            <p className="text-xs text-red-500 font-medium">{passwordError}</p>
          )}

          <button
            onClick={handleSavePassword}
            disabled={isSavingPassword}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg mt-2 ${
              isDark ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20'
            }`}
          >
            {isSavingPassword ? 'Menyimpan...' : 'Ubah Password'}
          </button>
        </div>
      </SettingsCard>

      <SettingsCard title="Sesi & Keamanan" icon={LogOut}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Perangkat aktif: Browser
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
              Anda sedang masuk di perangkat ini.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl text-sm font-bold text-red-500 border border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all whitespace-nowrap"
          >
            Keluar dari Semua Perangkat
          </button>
        </div>
      </SettingsCard>
      {ToastComponent}
    </div>
  );
}
