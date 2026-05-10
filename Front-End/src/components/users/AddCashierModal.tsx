import { useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { appApi, ApiError } from '../../services/appApi';

export interface CreatedCashier {
  id: string;
  name: string;
  email: string;
  role: 'cashier';
  pin: boolean;
  is_active: boolean;
  created_at: string;
}

interface AddCashierModalProps {
  onClose: () => void;
  onCreated: (user: CreatedCashier) => void;
}

export default function AddCashierModal({ onClose, onCreated }: AddCashierModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const panelCls = `${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'} border`;
  const inputCls = `w-full rounded-3xl border px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 ${
    isDark ? 'border-stone-800 bg-stone-950 text-white placeholder:text-stone-600' : 'border-stone-200 bg-white text-stone-900 placeholder:text-stone-400'
  }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 3) {
      setError('Nama lengkap minimal 3 karakter.');
      return;
    }
    const emailTrim = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) {
      setError('Format email tidak valid.');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const user = await appApi.post<CreatedCashier>('/users', {
        name: name.trim(),
        email: emailTrim,
        password,
        role: 'cashier',
      });
      onCreated(user);
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Gagal membuat akun kasir.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className={`${panelCls} max-w-md w-full rounded-3xl shadow-2xl`} role="dialog" aria-labelledby="add-cashier-title">
        <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
          <h2 id="add-cashier-title" className={`text-lg font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
            Tambah Akun Kasir
          </h2>
          <button type="button" onClick={() => !loading && onClose()} className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <p className="rounded-3xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          )}

          <div>
            <label className={`mb-1.5 block text-sm font-semibold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>Nama Lengkap</label>
            <input required className={inputCls} minLength={3} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kasir" />
          </div>

          <div>
            <label className={`mb-1.5 block text-sm font-semibold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>Email</label>
            <input required type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
          </div>

          <div>
            <label className={`mb-1.5 block text-sm font-semibold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>Password</label>
            <input required type="password" className={inputCls} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" />
          </div>

          <div>
            <label className={`mb-1.5 block text-sm font-semibold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>Konfirmasi Password</label>
            <input required type="password" className={inputCls} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password" />
          </div>

          <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>Role otomatis diset sebagai Kasir.</p>

          <div className={`flex gap-3 pt-2 ${isDark ? '' : ''}`}>
            <button type="button" disabled={loading} onClick={() => !loading && onClose()} className="flex-1 rounded-3xl border border-stone-300 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-3xl py-3 text-sm font-bold text-white shadow-lg transition disabled:opacity-60 ${
                loading ? 'bg-stone-400' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
              }`}
            >
              {loading ? 'Menyimpan...' : 'Buat Akun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
