import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Coffee } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { authApi } from '../../services/authApi';
import { ApiError } from '../../services/appApi';

const OTP_LENGTH = 6;
const INITIAL_OTP = Array.from({ length: OTP_LENGTH }, () => '');

export default function VerifyEmail() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [otp, setOtp] = useState<string[]>(INITIAL_OTP);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [timeLeft, setTimeLeft] = useState(180);
  const [cooldown, setCooldown] = useState(60);
  const [isVerified, setIsVerified] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const clearOtpFields = () => {
    setOtp(INITIAL_OTP);
    setTimeout(() => focusInput(0), 0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendOtp = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.sendOtp();
      setTimeLeft(response.expiresIn ?? 180);
      setCooldown(response.cooldown ?? 60);
      setAttemptsLeft(5);
      clearOtpFields();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || 'Gagal mengirim kode OTP.');
      } else {
        setError('Gagal mengirim kode OTP. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isVerified) {
      return;
    }

    const code = otp.join('');
    if (code.length !== OTP_LENGTH || otp.some((digit) => digit === '')) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await authApi.verifyOtp(code);
      setIsVerified(true);
      if (user) {
        user.is_verified = true;
      }
      setTimeout(() => {
        if (user?.role === 'cashier') {
          navigate('/pos', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const details = err.details as { attemptsLeft?: number } | undefined;
        if (err.code === 'INVALID_OTP') {
          if (details?.attemptsLeft !== undefined) {
            setAttemptsLeft(details.attemptsLeft);
          }
          setError(err.message || 'Kode OTP tidak valid.');
        } else if (err.code === 'MAX_ATTEMPTS_EXCEEDED') {
          clearOtpFields();
          setAttemptsLeft(5);
          setError(err.message || 'Jumlah percobaan OTP maksimum tercapai. Silakan minta kode baru.');
        } else if (err.code === 'OTP_EXPIRED') {
          setError(err.message || 'Kode kedaluwarsa. Silakan minta kode baru.');
        } else {
          setError(err.message || 'Gagal memverifikasi OTP. Silakan coba lagi.');
        }
      } else {
        setError('Gagal memverifikasi OTP. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, isVerified, navigate, otp, user]);

  useEffect(() => {
    sendOtp();

    const otpTimer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    const cooldownTimer = window.setInterval(() => {
      setCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(otpTimer);
      window.clearInterval(cooldownTimer);
    };
  }, [sendOtp]);

  useEffect(() => {
    if (otp.every((digit) => digit !== '') && !isSubmitting && !isVerified) {
      void handleSubmit();
    }
  }, [handleSubmit, isSubmitting, isVerified, otp]);

  const handleChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/\D/g, '').slice(-1);
    setOtp((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') return;
    event.preventDefault();

    setOtp((current) => {
      const next = [...current];
      if (next[index]) {
        next[index] = '';
      } else if (index > 0) {
        next[index - 1] = '';
        focusInput(index - 1);
      }
      return next;
    });
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) {
      return;
    }

    const digits = pasted.split('').slice(0, OTP_LENGTH);
    setOtp((current) => {
      const next = [...current];
      for (let i = 0; i < digits.length; i += 1) {
        next[i] = digits[i];
      }
      return next;
    });

    const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
    setTimeout(() => focusInput(nextIndex), 0);
  };

  const handleResend = async () => {
    if (cooldown > 0 || isLoading) {
      return;
    }
    await sendOtp();
  };

  const countdownClass = timeLeft > 30 ? (isDark ? 'text-amber-500' : 'text-teal-600') : 'text-rose-400';
  const cardBg = isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900';
  const subtextColor = isDark ? 'text-stone-400' : 'text-stone-500';

  return (
    <div className={isDark ? 'min-h-screen flex items-center justify-center bg-stone-950 px-4' : 'min-h-screen flex items-center justify-center bg-gray-50 px-4'}>
      <div className={`max-w-md w-full mx-auto rounded-3xl border p-8 ${cardBg}`}>
        <div className="mb-8 text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl ${isDark ? 'bg-amber-500' : 'bg-teal-500'} text-white`}>
            <Coffee className="h-8 w-8" />
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Verifikasi Email Anda</h1>
          <p className={`mt-2 text-sm ${subtextColor}`}>
            Kami mengirim kode 6 digit ke {user?.email ?? 'email Anda'}
          </p>
        </div>

        {isVerified ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h2 className="text-xl font-bold text-emerald-400">Email terverifikasi!</h2>
            <p className="text-sm text-stone-400">Mengalihkan...</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={digit}
                  ref={(element) => { inputRefs.current[index] = element; }}
                  onChange={(event) => handleChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={handlePaste}
                  className={
                    `w-12 h-14 rounded-2xl border text-center text-2xl font-bold outline-none transition ` +
                    `${isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-300'} ` +
                    `${isDark ? 'focus:border-amber-500 focus:ring-amber-500/20' : 'focus:border-teal-500 focus:ring-teal-500/20'} focus:ring-2`
                  }
                />
              ))}
            </div>

            <div className="mb-4 text-center">
              <p className={`text-sm ${countdownClass}`}>
                {timeLeft > 0 ? `Kode berlaku ${formatTime(timeLeft)}` : 'Kode kedaluwarsa. Minta kode baru.'}
              </p>
              {attemptsLeft < 5 && (
                <p className="mt-2 text-sm text-rose-400">{attemptsLeft} percobaan tersisa</p>
              )}
            </div>

            {error && (
              <div className="mb-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-200">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || otp.some((digit) => digit === '')}
              className={`mb-4 w-full rounded-3xl ${isDark ? 'bg-amber-500' : 'bg-teal-600'} px-4 py-3 text-white transition disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {isSubmitting ? 'Memverifikasi...' : 'Verifikasi'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isLoading}
              className={`w-full rounded-3xl border px-4 py-3 text-sm font-semibold transition ${
                cooldown > 0 || isLoading 
                  ? 'border-stone-600 text-stone-500' 
                  : isDark 
                    ? 'border-amber-500 text-amber-500 hover:bg-amber-500/10' 
                    : 'border-teal-600 text-teal-600 hover:bg-teal-50'
              }`}
            >
              {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim ulang kode'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (user?.role === 'cashier') {
                  navigate('/pos', { replace: true });
                } else {
                  navigate('/', { replace: true });
                }
              }}
              className={`mt-4 w-full rounded-3xl border px-4 py-3 text-xs ${isDark ? 'border-stone-700 text-stone-500' : 'border-stone-200 text-stone-400'}`}
            >
              Verifikasi nanti →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
