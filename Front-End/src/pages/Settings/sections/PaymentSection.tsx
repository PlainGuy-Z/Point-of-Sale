import { useTheme } from '../../../contexts/ThemeContext';

export default function PaymentSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className="p-6">
      <h1 className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Pembayaran & Pajak</h1>
      <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>Pengaturan ini sedang disiapkan.</p>
    </div>
  );
}
