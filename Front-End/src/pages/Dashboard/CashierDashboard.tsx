import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useShift } from '../../contexts/ShiftContext';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import ShiftOpenModal from '../../components/shift/ShiftOpenModal';
import { Skeleton } from '../../components/common/Skeleton';
import { appApi, ApiError } from '../../services/appApi';
import type { TxSummaryToday } from '../../types/historyTransaction';
import { ShoppingCart, DollarSign, Clock, Zap, ArrowRight, Trash2 } from 'lucide-react';

export default function CashierDashboard() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { format } = useCurrencyFormatter();
    const navigate = useNavigate();
    const isDark = theme === 'dark';

    const { activeShift, isLoading: shiftLoading, refreshShift } = useShift();
    const [showOpenModal, setShowOpenModal] = useState(false);

    const [todaySummary, setTodaySummary] = useState<TxSummaryToday | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const loadTodaySummary = useCallback(async () => {
        if (!user?.id || user.role !== 'cashier') return;
        setSummaryLoading(true);
        setSummaryError(null);
        try {
            const q = `/transactions/summary?scope=today&cashier_id=${encodeURIComponent(user.id)}`;
            const res = await appApi.get<TxSummaryToday>(q);
            setTodaySummary(res);
        } catch (e) {
            const msg = e instanceof ApiError ? e.message : 'Gagal memuat ringkasan hari ini.';
            setSummaryError(msg);
            setTodaySummary(null);
        } finally {
            setSummaryLoading(false);
        }
    }, [user?.id, user?.role]);

    useEffect(() => {
        void loadTodaySummary();
    }, [loadTodaySummary]);

    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = useMemo(
        () =>
            new Intl.DateTimeFormat('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Jakarta',
            }).format(now),
        [now],
    );

    const formattedTime = useMemo(
        () =>
            now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Asia/Jakarta',
            }),
        [now],
    );

    const hasOpenShift = Boolean(activeShift);
    const shiftTx = activeShift?.current_total_transactions ?? activeShift?.total_transactions ?? 0;
    const shiftSales = activeShift?.current_total_sales ?? activeShift?.total_sales ?? 0;

    const statCards = [
        { title: 'Transaksi Hari Ini', value: (todaySummary?.today_count ?? 0).toLocaleString('id-ID'), icon: ShoppingCart },
        { title: 'Penjualan Hari Ini', value: format(todaySummary?.today_sales ?? 0), icon: DollarSign },
        { title: 'Transaksi Shift Ini', value: shiftTx.toLocaleString('id-ID'), icon: Clock },
        { title: 'Penjualan Shift Ini', value: format(shiftSales), icon: Zap },
    ];

    const showCardsSkeleton = shiftLoading || summaryLoading;

    return (
        <>
            {showOpenModal && (
                <ShiftOpenModal
                    onSuccess={async () => {
                        setShowOpenModal(false);
                        await refreshShift();
                    }}
                    onCancel={() => setShowOpenModal(false)}
                />
            )}
            <div className="space-y-6 animate-in fade-in duration-500">
                {!shiftLoading && !activeShift && (
                    <div
                        className={`rounded-3xl border p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isDark ? 'bg-amber-500/10 border-amber-500/25' : 'bg-teal-50 border-teal-200'
                            }`}
                    >
                        <div>
                            <p className={`font-bold ${isDark ? 'text-amber-200' : 'text-teal-900'}`}>Shift belum dibuka</p>
                            <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-teal-800/90'}`}>
                                Buka shift untuk mencatat kas dan menggunakan POS. Anda bisa menunda — gunakan halaman Shift kapan saja.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowOpenModal(true)}
                                className={`px-4 py-2.5 rounded-3xl font-bold text-white bg-gradient-to-r ${isDark ? 'from-amber-500 to-orange-500' : 'from-teal-500 to-teal-600'} text-sm shadow-md transition-all active:scale-95`}
                            >
                                Mulai shift
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/cashier/shift')}
                                className={`px-4 py-2.5 rounded-3xl font-bold text-sm border transition-all ${isDark ? 'border-stone-600 text-stone-200 hover:bg-stone-900' : 'border-teal-300 text-teal-900 hover:bg-teal-50'
                                    }`}
                            >
                                Halaman shift
                            </button>
                        </div>
                    </div>
                )}

                <div
                    className={`rounded-3xl p-6 ${isDark ? 'bg-gradient-to-r from-stone-900 to-stone-950 border border-stone-800' : 'bg-gradient-to-r from-white to-gray-50 border border-gray-100'
                        } shadow-sm`}
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                                Selamat datang,{' '}
                                <span className={`bg-gradient-to-r ${isDark ? 'from-amber-500 to-orange-500' : 'from-teal-600 to-emerald-600'} bg-clip-text text-transparent`}>{user?.name || 'Kasir'}</span>
                            </h1>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>{formattedDate}</p>
                                <span
                                    className={`font-mono text-sm font-bold px-3 py-1 rounded-3xl ${isDark ? 'bg-stone-800 text-amber-400' : 'bg-teal-50 text-teal-700'
                                        }`}
                                >
                                    {formattedTime} WIB
                                </span>
                            </div>
                        </div>
                        {shiftLoading ? (
                            <Skeleton className="h-8 w-32" rounded="rounded-full" />
                        ) : (
                            <div
                                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border ${hasOpenShift
                                        ? isDark
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-green-50 text-green-700 border-green-200'
                                        : isDark
                                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${hasOpenShift ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                                {hasOpenShift ? 'Shift Aktif' : 'Belum Buka Shift'}
                            </div>
                        )}
                    </div>
                </div>

                {summaryError ? (
                    <div className={`rounded-3xl border px-4 py-3 text-sm ${isDark ? 'border-red-900/40 text-red-300' : 'border-red-200 text-red-800'}`}>
                        {summaryError}
                    </div>
                ) : null}

                {showCardsSkeleton ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className={`rounded-3xl p-5 border ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'} shadow-sm`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <Skeleton className="h-4 w-32" rounded="rounded-lg" />
                                    <Skeleton className="h-8 w-8" rounded="rounded-xl" />
                                </div>
                                <Skeleton className="h-8 w-24" rounded="rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {statCards.map((card) => (
                            <div
                                key={card.title}
                                className={`rounded-3xl p-5 border ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'} shadow-sm`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <p className={`text-sm font-semibold ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>{card.title}</p>
                                    <div className={`p-2 rounded-3xl border ${isDark ? 'border-amber-500/30 bg-amber-500/10' : 'border-teal-500/30 bg-teal-500/10'}`}>
                                        <card.icon className={`w-4 h-4 ${isDark ? 'text-amber-500' : 'text-teal-600'}`} />
                                    </div>
                                </div>
                                <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{card.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div>
                    <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Aksi Cepat</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/pos')}
                            className={`flex items-center gap-4 p-4 rounded-3xl border transition-all hover:shadow-lg active:scale-[0.98] ${isDark
                                    ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40'
                                    : 'bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200 hover:border-teal-400'
                                }`}
                        >
                            <div className={`p-3 rounded-3xl bg-gradient-to-br ${isDark ? 'from-amber-500 to-orange-500' : 'from-teal-500 to-teal-600'}`}>
                                <ShoppingCart className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left flex-1">
                                <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Buka POS</p>
                                <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>Mulai transaksi baru</p>
                            </div>
                            <ArrowRight className={`w-5 h-5 ${isDark ? 'text-stone-500' : 'text-gray-400'}`} />
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/operation/waste-log')}
                            className={`flex items-center gap-4 p-4 rounded-3xl border transition-all hover:shadow-lg active:scale-[0.98] ${isDark ? 'bg-stone-900 border-stone-800 hover:border-stone-700' : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="p-3 rounded-3xl bg-gradient-to-br from-red-500 to-pink-500">
                                <Trash2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left flex-1">
                                <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Catat Waste</p>
                                <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>Catat produk terbuang</p>
                            </div>
                            <ArrowRight className={`w-5 h-5 ${isDark ? 'text-stone-500' : 'text-gray-400'}`} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
