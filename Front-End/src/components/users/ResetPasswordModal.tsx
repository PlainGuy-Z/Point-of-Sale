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

  const panelCls = `${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-[#E2E8F0]'} border rounded-2xl shadow-2xl overflow-hidden`;

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
      <div className={`${panelCls} w-full ${phase === 'result' ? 'max-w-md' : 'max-w-sm'}`} role="dialog">
        {phase === 'confirm' ? (
          <>
            <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Reset Password</h2>
              <button type="button" disabled={loading} onClick={() => !loading && onClose()} className={`rounded-lg p-2 transition-colors ${isDark ? 'text-stone-500 hover:bg-stone-800' : 'text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]'}`}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {error}
                </p>
              )}
              <div
                className={`rounded-xl border px-4 py-3 text-sm leading-relaxed font-medium ${
                  isDark ? 'border-amber-900/40 bg-amber-950/20 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                ⚠️ Tindakan ini akan mengganti password <span className="font-bold underline decoration-2">{cashier.name}</span> dengan password sementara.
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" disabled={loading} onClick={() => !loading && onClose()} className={`flex-1 rounded-xl border py-3 text-sm font-bold transition-all ${isDark ? 'border-stone-700 text-stone-200' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'}`}>
                  Batal
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void runReset()}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all ${loading ? 'bg-stone-400 opacity-60' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20 active:scale-[0.98]'}`}
                >
                  {loading ? 'Memproses...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-stone-800' : 'border-[#F1F5F9]'}`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Password Direset</h2>
              <button type="button" onClick={onClose} className={`rounded-lg p-2 transition-colors ${isDark ? 'text-stone-500 hover:bg-stone-800' : 'text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]'}`}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>
                  Password Sementara
                </p>
                <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${isDark ? 'border-stone-700 bg-stone-950' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
                  <span className="flex-1 break-all font-mono text-xl font-black tracking-wider text-teal-600">
                    {temporaryPassword}
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyPw()}
                    className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                      copied
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : isDark ? 'border-stone-600 text-stone-200' : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Tersalin!' : 'Salin'}
                  </button>
                </div>
              </div>

              <p className={`text-sm font-medium ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>
                ℹ️ Berikan password ini kepada kasir. Password ini hanya ditampilkan sekali.
              </p>

              <button type="button" onClick={onClose} className="w-full rounded-xl bg-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700 transition-all active:scale-[0.98]">
                Selesai
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
