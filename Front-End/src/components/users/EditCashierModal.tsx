import { useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { appApi, ApiError } from '../../services/appApi';

export interface CashierUserRow {
  id: string;
  name: string;
  email: string;
  role: 'cashier';
  pin: boolean;
  is_active: boolean;
  created_at: string;
}

interface EditCashierModalProps {
  cashier: CashierUserRow;
  onClose: () => void;
  onSaved: (user: CashierUserRow) => void;
}

export default function EditCashierModal({ cashier, onClose, onSaved }: EditCashierModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [name, setName] = useState(cashier.name);
  const [email, setEmail] = useState(cashier.email);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const panelCls = `${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'} border`;
  const inputCls = `w-full rounded-3xl border px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 ${
    isDark ? 'border-stone-800 bg-stone-950 text-white placeholder:text-stone-600' : 'border-stone-200 bg-white text-stone-900 placeholder:text-stone-400'
  }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = name.trim();
    const em = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (n.length < 3) {
      setError('Nama lengkap minimal 3 karakter.');
      return;
    }
    if (!emailRegex.test(em)) {
      setError('Format email tidak valid.');
      return;
    }

    setLoading(true);
    try {
      const user = await appApi.put<CashierUserRow>(`/users/${encodeURIComponent(cashier.id)}`, {
        name: n,
        email: em,
      });
      onSaved(user);
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Gagal menyimpan perubahan.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className={`${panelCls} max-w-md w-full rounded-3xl shadow-2xl`} role="dialog" aria-labelledby="edit-cashier-title">
        <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
          <h2 id="edit-cashier-title" className={`text-lg font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
            Edit Akun Kasir
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
            <input required minLength={3} className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className={`mb-1.5 block text-sm font-semibold ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>Email</label>
            <input required type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Password tidak dapat diubah di sini. Gunakan Reset Password jika diperlukan.
          </p>

          <div className="flex gap-3 pt-2">
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
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
