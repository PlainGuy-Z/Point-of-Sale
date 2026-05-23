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

  const panelCls = `${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-[#E2E8F0]'} border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden`;
  const inputCls = `w-full rounded-xl border px-4 py-3 outline-none transition-all focus:border-teal-400 ${
    isDark ? 'border-stone-800 bg-stone-950 focus:bg-stone-950 text-white placeholder:text-stone-600 focus:ring-1 focus:ring-teal-500' : 'focus:bg-white border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] placeholder:text-[#94A3B8]'
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
      <div className={panelCls} role="dialog" aria-labelledby="edit-cashier-title">
        <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
          <h2 id="edit-cashier-title" className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
            Edit Akun Kasir
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
            <input required minLength={3} className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className={`mb-1.5 block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-[#475569]'}`}>Email</label>
            <input required type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <p className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>
            ℹ️ Password tidak dapat diubah di sini. Gunakan Reset Password jika diperlukan.
          </p>

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
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
