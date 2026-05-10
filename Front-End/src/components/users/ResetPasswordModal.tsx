import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { appApi, ApiError } from '../../services/appApi';
import type { CashierUserRow } from './EditCashierModal';

interface ResetPasswordModalProps {
  cashier: CashierUserRow;
  onClose: () => void;
}

export default function ResetPasswordModal({ cashier, onClose }: ResetPasswordModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [phase, setPhase] = useState<'confirm' | 'result'>('confirm');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const panelCls = `${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'} border`;

  const runReset = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await appApi.post<{ temporary_password: string }>(
        `/users/${encodeURIComponent(cashier.id)}/reset-password`
      );
      setTemporaryPassword(res.temporary_password);
      setPhase('result');
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Gagal reset password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyPw = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading && phase === 'confirm') onClose();
      }}
    >
      <div className={`${panelCls} w-full rounded-3xl shadow-2xl ${phase === 'result' ? 'max-w-md' : 'max-w-sm'}`} role="dialog">
        {phase === 'confirm' ? (
          <>
            <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>Reset Password Kasir</h2>
              <button type="button" disabled={loading} onClick={() => !loading && onClose()} className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {error && (
                <p className="rounded-3xl border border-red-300 bg-red-50 px-4 py-3 text-sm dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                  {error}
                </p>
              )}
              <div
                className={`rounded-3xl border px-4 py-3 text-sm leading-relaxed ${
                  isDark ? 'border-amber-900/40 bg-amber-950/20 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-950'
                }`}
              >
                <p className="font-semibold">
                  ⚠️ Tindakan ini akan mengganti password <span className="font-black">{cashier.name}</span> dengan password sementara yang harus segera diubah oleh kasir setelah login.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" disabled={loading} onClick={() => !loading && onClose()} className="flex-1 rounded-3xl border border-stone-300 py-3 text-sm font-bold dark:border-stone-700 dark:text-stone-200">
                  Batal
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void runReset()}
                  className={`flex-1 rounded-3xl py-3 text-sm font-bold text-white shadow-lg ${loading ? 'bg-stone-400' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {loading ? 'Memproses...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>Password Berhasil Direset</h2>
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  Password Sementara
                </p>
                <div className="flex items-center gap-2 rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-950">
                  <span className="flex-1 break-all font-mono text-lg font-bold tracking-wide text-stone-900 dark:text-white">
                    {temporaryPassword}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyPw()}
                    className={`flex shrink-0 items-center gap-1 rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-wider ${
                      copied
                        ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                        : 'border-stone-300 dark:border-stone-600 dark:text-stone-200'
                    }`}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Tersalin!' : 'Salin'}
                  </button>
                </div>
              </div>

              <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Berikan password ini kepada kasir secara langsung. Password ini hanya ditampilkan sekali.
              </p>

              <button type="button" onClick={onClose} className="w-full rounded-3xl bg-amber-500 py-3 text-sm font-bold text-white hover:bg-amber-600">
                Selesai
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
