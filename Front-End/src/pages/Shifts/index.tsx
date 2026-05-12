import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { appApi } from '../../services/appApi';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { ClipboardList, Calendar, DollarSign, Search, ArrowRight } from 'lucide-react';
import { Skeleton, SkeletonCard } from '../../components/common/Skeleton';

export default function ShiftReport() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();
  const navigate = useNavigate();

  const [shifts, setShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });

  // Stats
  const [totalShifts, setTotalShifts] = useState(0);
  const [avgSales, setAvgSales] = useState(0);
  const [totalDifference, setTotalDifference] = useState(0);

  const fetchShifts = async () => {
    setIsLoading(true);
    try {
      const response = await appApi.get(`/shifts?page=${pagination.page}&limit=${pagination.limit}`);
      setShifts(response.data || []);
      setPagination(response.pagination);

      // Calculate stats based on current page (in a real app, backend should provide global stats)
      const shiftsData = response.data || [];
      setTotalShifts(response.pagination?.total || 0);

      if (shiftsData.length > 0) {
        const sumSales = shiftsData.reduce((acc: number, s: any) => acc + (s.total_sales || 0), 0);
        setAvgSales(sumSales / shiftsData.length);

        const sumDiff = shiftsData.reduce((acc: number, s: any) => acc + (s.cash_difference || 0), 0);
        setTotalDifference(sumDiff);
      }
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [pagination.page]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Laporan Shift
        </h1>
        <p className={isDark ? 'text-stone-400' : 'text-gray-600'}>
          Pantau aktivitas shift dan rekonsiliasi kas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <Skeleton className="h-28" rounded="rounded-2xl" />
            <Skeleton className="h-28" rounded="rounded-2xl" />
            <Skeleton className="h-28" rounded="rounded-2xl" />
          </>
        ) : (
          <>
            <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Total Shift (Bulan Ini)</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {totalShifts}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-stone-950' : 'bg-gray-50'}`}>
                  <ClipboardList className={`w-6 h-6 ${isDark ? 'text-stone-400' : 'text-stone-500'}`} />
                </div>
              </div>
            </div>

            <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Rata-rata Penjualan / Shift</p>
                  <p className={`text-2xl font-bold text-green-500`}>
                    {format(avgSales)}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>

            <div className={`rounded-2xl shadow-sm border p-6 transition-colors ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Total Selisih Kas</p>
                  <p className={`text-2xl font-bold ${totalDifference < 0 ? 'text-red-500' : totalDifference > 0 ? 'text-green-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                    {format(totalDifference)}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${totalDifference < 0 ? (isDark ? 'bg-red-900/20' : 'bg-red-50') : isDark ? 'bg-stone-950' : 'bg-gray-50'}`}>
                  <DollarSign className={`w-6 h-6 ${totalDifference < 0 ? 'text-red-500' : isDark ? 'text-stone-400' : 'text-stone-500'}`} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Table Container */}
      <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'
        }`}>
        <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-stone-800' : 'border-gray-200'}`}>
          <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Riwayat Shift</h2>
          <button className={`p-2 rounded-xl border ${isDark ? 'border-stone-700 text-stone-400' : 'border-gray-200 text-gray-500'}`}>
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b text-xs uppercase tracking-wider ${isDark ? 'border-stone-800 text-stone-500 bg-stone-950/50' : 'border-gray-200 text-gray-500 bg-gray-50'}`}>
                <th className="text-left py-4 px-6 font-medium">Waktu</th>
                <th className="text-left py-4 px-6 font-medium">Kasir</th>
                <th className="text-right py-4 px-6 font-medium">Penjualan</th>
                <th className="text-right py-4 px-6 font-medium">Kas Aktual</th>
                <th className="text-right py-4 px-6 font-medium">Selisih</th>
                <th className="text-center py-4 px-6 font-medium">Status</th>
                <th className="text-right py-4 px-6 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className={`border-b ${isDark ? 'border-stone-800' : 'border-gray-100'}`}>
                    <td className="py-4 px-6"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 px-6 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="py-4 px-6 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="py-4 px-6 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="py-4 px-6 text-center"><Skeleton className="h-6 w-12 mx-auto" rounded="rounded-full" /></td>
                    <td className="py-4 px-6 text-right"><Skeleton className="h-8 w-8 ml-auto" rounded="rounded-xl" /></td>
                  </tr>
                ))
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <ClipboardList className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-stone-800' : 'text-stone-300'}`} />
                    <p className={isDark ? 'text-stone-500' : 'text-gray-500'}>Belum ada data shift</p>
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => {
                  const openedAt = new Date(shift.opened_at);
                  const closedAt = shift.closed_at ? new Date(shift.closed_at) : null;

                  return (
                    <tr
                      key={shift.id}
                      className={`border-b transition-colors cursor-pointer ${isDark ? 'border-stone-800 hover:bg-stone-800/50' : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      onClick={() => navigate(`/shifts/${shift.id}`)}
                    >
                      <td className="py-4 px-6">
                        <div className={`font-medium ${isDark ? 'text-stone-200' : 'text-gray-900'}`}>
                          {openedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
                          {openedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} -
                          {closedAt ? closedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Sekarang'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`font-medium ${isDark ? 'text-stone-200' : 'text-gray-900'}`}>
                          {shift.cashier_name}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`font-semibold ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
                          {format(shift.total_sales)}
                        </span>
                        <div className={`text-xs ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
                          {shift.total_transactions} trx
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`font-semibold ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
                          {shift.closing_cash !== null ? format(shift.closing_cash) : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {shift.cash_difference !== null ? (
                          <span className={`font-bold ${shift.cash_difference > 0 ? 'text-green-500' :
                              shift.cash_difference < 0 ? 'text-red-500' :
                                isDark ? 'text-stone-400' : 'text-gray-500'
                            }`}>
                            {shift.cash_difference > 0 ? '+' : ''}{format(shift.cash_difference)}
                          </span>
                        ) : (
                          <span className={isDark ? 'text-stone-600' : 'text-gray-400'}>-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${shift.status === 'open'
                            ? (isDark ? 'bg-yellow-500/10 text-yellow-500' : 'bg-yellow-50 text-yellow-600')
                            : (isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-100 text-gray-500')
                          }`}>
                          {shift.status === 'open' ? 'Aktif' : 'Selesai'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-stone-700 text-stone-400' : 'hover:bg-gray-200 text-gray-500'
                          }`}>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
