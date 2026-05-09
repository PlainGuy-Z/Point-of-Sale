import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { appApi } from '../../services/appApi';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { ArrowLeft, Clock, DollarSign, ReceiptText, User, AlertTriangle, Calendar } from 'lucide-react';

export default function ShiftDetail() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();
  const navigate = useNavigate();

  const [shift, setShift] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShiftDetail = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await appApi.get(`/shifts/${id}`);
        setShift(response);
        setTransactions(response.transactions || []);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat detail shift');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchShiftDetail();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={isDark ? 'text-stone-400' : 'text-gray-500'}>Memuat detail shift...</p>
        </div>
      </div>
    );
  }

  if (error || !shift) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-bold mb-2">Gagal Memuat Data</p>
          <p className={isDark ? 'text-stone-400' : 'text-gray-500'}>{error}</p>
          <button 
            onClick={() => navigate('/shifts')}
            className="mt-6 px-4 py-2 bg-amber-500 text-white rounded-xl font-bold"
          >
            Kembali ke Laporan
          </button>
        </div>
      </div>
    );
  }

  const openedAt = new Date(shift.opened_at);
  const closedAt = shift.closed_at ? new Date(shift.closed_at) : null;
  const isClosed = shift.status === 'closed';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/shifts')}
          className={`p-2.5 rounded-xl border transition-colors ${
            isDark 
              ? 'border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-white' 
              : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Detail Shift
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className={isDark ? 'text-stone-400' : 'text-gray-500'}>
              {openedAt.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              isClosed 
                ? (isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-200 text-gray-600')
                : (isDark ? 'bg-yellow-500/20 text-yellow-500' : 'bg-yellow-100 text-yellow-700')
            }`}>
              {isClosed ? 'Selesai' : 'Aktif'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Shift Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'}`}>
            <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <User className="w-5 h-5 text-amber-500" />
              Informasi Kasir
            </h2>
            <div className="space-y-4">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Nama Kasir</p>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{shift.cashier_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Waktu Buka</p>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {openedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Waktu Tutup</p>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {closedAt ? closedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-6 ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'}`}>
            <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <DollarSign className="w-5 h-5 text-amber-500" />
              Rekonsiliasi Kas
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-dashed border-stone-700">
                <span className={isDark ? 'text-stone-400' : 'text-gray-600'}>Modal Awal</span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{format(shift.opening_cash)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-dashed border-stone-700">
                <span className={isDark ? 'text-stone-400' : 'text-gray-600'}>Penjualan Kas</span>
                <span className={`font-semibold text-green-500`}>
                  {format(shift.expected_cash ? shift.expected_cash - shift.opening_cash : 0)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-stone-700">
                <span className={isDark ? 'text-stone-400' : 'text-gray-600'}>Kas Seharusnya</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{format(shift.expected_cash || 0)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-stone-700">
                <span className={isDark ? 'text-stone-400' : 'text-gray-600'}>Kas Aktual (Dihitung)</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {shift.closing_cash !== null ? format(shift.closing_cash) : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold uppercase text-sm">Selisih</span>
                {shift.cash_difference !== null ? (
                  <span className={`font-black text-lg ${
                    shift.cash_difference > 0 ? 'text-green-500' :
                    shift.cash_difference < 0 ? 'text-red-500' :
                    isDark ? 'text-stone-300' : 'text-gray-700'
                  }`}>
                    {shift.cash_difference > 0 ? '+' : ''}{format(shift.cash_difference)}
                  </span>
                ) : (
                  <span className={isDark ? 'text-stone-600' : 'text-gray-400'}>-</span>
                )}
              </div>
            </div>
            
            {shift.notes && (
              <div className={`mt-6 p-4 rounded-xl text-sm ${isDark ? 'bg-stone-800 text-stone-300' : 'bg-gray-50 text-gray-700'}`}>
                <p className="font-semibold mb-1">Catatan Kasir:</p>
                <p className="italic">"{shift.notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Transactions */}
        <div className="lg:col-span-2">
          <div className={`rounded-2xl border h-full flex flex-col ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-stone-800' : 'border-gray-200'}`}>
              <h2 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <ReceiptText className="w-5 h-5 text-amber-500" />
                Transaksi dalam Shift ({shift.total_transactions})
              </h2>
              <div className="text-right">
                <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>Total Penjualan</p>
                <p className="font-bold text-amber-500">{format(shift.total_sales || 0)}</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className={`sticky top-0 ${isDark ? 'bg-stone-950/90' : 'bg-gray-50/90'} backdrop-blur-sm z-10`}>
                  <tr className={`border-b text-xs uppercase tracking-wider ${isDark ? 'border-stone-800 text-stone-500' : 'border-gray-200 text-gray-500'}`}>
                    <th className="text-left py-3 px-6 font-medium">ID / Waktu</th>
                    <th className="text-left py-3 px-6 font-medium">Customer</th>
                    <th className="text-center py-3 px-6 font-medium">Metode</th>
                    <th className="text-right py-3 px-6 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center">
                        <ReceiptText className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-stone-800' : 'text-stone-300'}`} />
                        <p className={isDark ? 'text-stone-500' : 'text-gray-500'}>Tidak ada transaksi di shift ini</p>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const txTime = new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                      const method = tx.paymentMethod?.toLowerCase() || '';
                      
                      let badgeClass = isDark ? 'bg-stone-800 text-stone-400' : 'bg-gray-100 text-gray-600';
                      if (method.includes('cash') || method.includes('tunai')) {
                        badgeClass = isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700';
                      } else if (method.includes('qris')) {
                        badgeClass = isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-700';
                      } else if (method.includes('card') || method.includes('debit')) {
                        badgeClass = isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700';
                      }

                      return (
                        <tr key={tx.id} className={`border-b last:border-0 transition-colors ${isDark ? 'border-stone-800 hover:bg-stone-800/30' : 'border-gray-100 hover:bg-gray-50'}`}>
                          <td className="py-3 px-6">
                            <div className={`font-mono text-xs ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                              {tx.id.substring(0, 8)}...
                            </div>
                            <div className={`font-medium text-sm mt-0.5 ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
                              {txTime}
                            </div>
                          </td>
                          <td className="py-3 px-6">
                            <div className={`text-sm ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
                              {tx.customerName || 'Guest'}
                            </div>
                          </td>
                          <td className="py-3 px-6 text-center">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                              {tx.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-right">
                            <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {format(tx.total)}
                            </span>
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
      </div>
    </div>
  );
}
