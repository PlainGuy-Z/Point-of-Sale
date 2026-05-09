import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { useShift } from '../../contexts/ShiftContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import ShiftOpenModal from '../../components/shift/ShiftOpenModal';
import {
  ShoppingCart,
  DollarSign,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRight,
  Trash2,
  Coffee,
  Zap,
} from 'lucide-react';

export default function CashierDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { transactions } = useApp();
  const { format } = useCurrencyFormatter();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const { activeShift } = useShift();
  const [showOpenModal, setShowOpenModal] = useState(false);

  useEffect(() => {
    if (!activeShift) {
      setShowOpenModal(true);
    }
  }, [activeShift]);

  // Live clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Today's transactions (scoped to current cashier)
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const todayTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = new Date(t.date).getTime();
      return tDate >= todayStart;
    });
  }, [transactions, todayStart]);

  const todayCount = todayTransactions.length;
  const todayTotal = todayTransactions.reduce((sum, t) => sum + (t.total || 0), 0);

  // Shift: assume shift started at 06:00 today (simple heuristic)
  const shiftStart = useMemo(() => {
    const d = new Date();
    d.setHours(6, 0, 0, 0);
    return d.getTime();
  }, []);

  const shiftTransactions = useMemo(() => {
    return todayTransactions.filter((t) => new Date(t.date).getTime() >= shiftStart);
  }, [todayTransactions, shiftStart]);

  const shiftCount = shiftTransactions.length;
  const shiftTotal = shiftTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const isShiftActive = now.getHours() >= 6 && now.getHours() < 22;

  // Recent 10 transactions
  const recentTransactions = useMemo(() => {
    return [...todayTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [todayTransactions]);

  const getPaymentBadge = (method: string) => {
    const m = method?.toLowerCase() || '';
    if (m.includes('cash') || m.includes('tunai'))
      return { label: 'Cash', icon: Banknote, color: 'text-green-500', bg: isDark ? 'bg-green-500/10' : 'bg-green-50' };
    if (m.includes('qris'))
      return { label: 'QRIS', icon: Smartphone, color: 'text-purple-500', bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50' };
    return { label: 'Transfer', icon: CreditCard, color: 'text-blue-500', bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50' };
  };

  const statCards = [
    { title: 'Transaksi Hari Ini', value: todayCount.toString(), icon: ShoppingCart, gradient: 'from-amber-500 to-orange-500' },
    { title: 'Penjualan Hari Ini', value: format(todayTotal), icon: DollarSign, gradient: 'from-green-500 to-emerald-500' },
    { title: 'Transaksi Shift Ini', value: shiftCount.toString(), icon: Clock, gradient: 'from-blue-500 to-cyan-500' },
    { title: 'Penjualan Shift Ini', value: format(shiftTotal), icon: Zap, gradient: 'from-purple-500 to-violet-500' },
  ];

  return (
    <>
      {showOpenModal && (
        <ShiftOpenModal onSuccess={() => setShowOpenModal(false)} />
      )}
      <div className="space-y-6 animate-in fade-in duration-500">
      {/* Greeting Header */}
      <div className={`rounded-2xl p-6 ${isDark
        ? 'bg-gradient-to-r from-stone-900 to-stone-900 border border-stone-800'
        : 'bg-gradient-to-r from-white to-gray-50 border border-gray-100'
      } shadow-sm`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Selamat datang, <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{user?.name || 'Kasir'}</span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>
                {formattedDate}
              </p>
              <span className={`font-mono text-sm font-bold px-3 py-1 rounded-lg ${isDark ? 'bg-stone-800 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                {formattedTime}
              </span>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 ${
            isShiftActive
              ? (isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200')
              : (isDark ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-yellow-50 text-yellow-700 border border-yellow-200')
          }`}>
            <div className={`w-2 h-2 rounded-full ${isShiftActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            {isShiftActive ? 'Shift Aktif' : 'Belum Buka Shift'}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`rounded-2xl p-5 border ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'} shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-medium ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>{card.title}</p>
              <div className={`p-2 rounded-xl bg-gradient-to-br ${card.gradient}`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Aksi Cepat</h2>

          <button
            onClick={() => navigate('/pos')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-lg active:scale-[0.98] ${
              isDark
                ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40'
                : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400'
            }`}
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Buka POS</p>
              <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>Mulai transaksi baru</p>
            </div>
            <ArrowRight className={`w-5 h-5 ${isDark ? 'text-stone-500' : 'text-gray-400'}`} />
          </button>

          <button
            onClick={() => navigate('/operation/waste-log')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-lg active:scale-[0.98] ${
              isDark
                ? 'bg-stone-900 border-stone-800 hover:border-stone-700'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-500">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Catat Waste</p>
              <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>Catat produk terbuang</p>
            </div>
            <ArrowRight className={`w-5 h-5 ${isDark ? 'text-stone-500' : 'text-gray-400'}`} />
          </button>

          {/* Shop info mini card */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Coffee className="w-5 h-5 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.shop?.name || 'Toko'}</p>
                <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>
                  Login sebagai <span className="text-amber-500 font-semibold uppercase">{user?.role}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Transaksi Terakhir
          </h2>
          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'}`}>
            {recentTransactions.length === 0 ? (
              <div className={`p-12 text-center ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>
                <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Belum ada transaksi hari ini</p>
                <p className="text-sm mt-1">Mulai transaksi pertama Anda di POS</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-800/50 dark:divide-stone-800">
                {recentTransactions.map((t) => {
                  const time = new Date(t.date).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const itemCount = t.items?.length || 0;
                  const badge = getPaymentBadge(t.paymentMethod || '');
                  const BadgeIcon = badge.icon;

                  return (
                    <div key={t.id} className={`flex items-center gap-4 p-4 transition-colors ${isDark ? 'hover:bg-stone-800/50' : 'hover:bg-gray-50'}`}>
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-stone-800' : 'bg-gray-100'}`}>
                        <Clock className={`w-4 h-4 ${isDark ? 'text-stone-400' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{time}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-100 text-gray-600'}`}>
                            {itemCount} item{itemCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>
                          {t.items?.map((i) => i.name).join(', ') || 'Transaksi'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${badge.bg} ${badge.color}`}>
                          <BadgeIcon className="w-3.5 h-3.5" />
                          {badge.label}
                        </div>
                        <p className={`font-bold text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {format(t.total || 0)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
