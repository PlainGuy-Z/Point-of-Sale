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

  const panelCls = `${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-[#E2E8F0]'} border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden`;
  const inputCls = `w-full rounded-xl border px-4 py-3 outline-none transition-all focus:border-teal-400 focus:bg-white ${
    isDark ? 'border-stone-800 bg-stone-950 text-white placeholder:text-stone-600 focus:ring-1 focus:ring-teal-500' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] placeholder:text-[#94A3B8]'
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
      <div className={panelCls} role="dialog" aria-labelledby="add-cashier-title">
        <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
          <h2 id="add-cashier-title" className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
            Tambah Akun Kasir
          </h2>
          <button type="button" onClick={() => !loading && onClose()} className={`rounded-lg p-2 transition-colors ${isDark ? 'text-stone-500 hover:bg-stone-800' : 'text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]'}`}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </p>
          )}

          <div>
            <label className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>Nama Lengkap</label>
            <input required className={inputCls} minLength={3} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kasir" />
          </div>

          <div>
            <label className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>Email</label>
            <input required type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
          </div>

          <div>
            <label className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>Password</label>
            <input required type="password" className={inputCls} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" />
          </div>

          <div>
            <label className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>Konfirmasi Password</label>
            <input required type="password" className={inputCls} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password" />
          </div>

          <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>ℹ️ Role otomatis diset sebagai Kasir.</p>

          <div className="flex gap-3 pt-2">
            <button type="button" disabled={loading} onClick={() => !loading && onClose()} className={`flex-1 rounded-xl py-3 text-sm font-bold border transition-all ${isDark ? 'border-stone-700 text-stone-200' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}>
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all ${
                loading ? 'bg-stone-400 opacity-60' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20 active:scale-[0.98]'
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
