import { useState, useMemo } from 'react';
import { Search, Calendar, ShoppingBag, ArrowUpRight, User, Filter } from 'lucide-react';
import { useApp } from '../../../contexts/AppContext'; // Sesuaikan path jika perlu
import { useTheme } from '../../../contexts/ThemeContext';
import type { Transaction } from '../../../types';

export default function VisitHistory() {
  const { transactions, customers } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'member' | 'guest'>('all');

  // Gabungkan data transaksi dengan nama customer yang up-to-date
  const enrichedTransactions = useMemo(() => {
    return transactions.map(t => {
      const customer = t.customerId ? customers.find(c => c.id === t.customerId) : null;
      return {
        ...t,
        customerName: customer ? customer.name : (t.customerName || 'Guest'),
        isMember: !!t.customerId
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Urutkan terbaru
  }, [transactions, customers]);

  // Filter Logic
  const filteredData = useMemo(() => {
    return enrichedTransactions.filter(t => {
      const matchesSearch = 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = 
        filterType === 'all' ? true :
        filterType === 'member' ? t.isMember :
        !t.isMember;

      return matchesSearch && matchesType;
    });
  }, [enrichedTransactions, searchTerm, filterType]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Visit History</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Rekam jejak transaksi dan kunjungan pelanggan
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari ID / Nama..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-64 ${
                isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'
              }`}
            />
          </div>

          {/* Filter */}
          <div className={`flex items-center p-1 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <button 
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'all' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterType('member')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'member' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              Members
            </button>
            <button 
              onClick={() => setFilterType('guest')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'guest' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              Guest
            </button>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={isDark ? 'bg-gray-900/50' : 'bg-gray-50'}>
              <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Transaction Info</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items Summary</th>
                <th className="p-4">Payment</th>
                <th className="p-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {filteredData.map((t) => (
                <tr key={t.id} className={`group transition-colors ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}`}>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className={`font-bold font-mono text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>#{t.id}</span>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        {new Date(t.date).toLocaleString('id-ID', { 
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        t.isMember 
                          ? 'bg-amber-500/10 text-amber-600' 
                          : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        <User size={14} />
                      </div>
                      <div>
                        <div className={`font-medium text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{t.customerName}</div>
                        {t.isMember && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">MEMBER</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t.items.length} Items
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">
                        {t.items.map(i => i.quantity + 'x ' + (i.note || 'Product')).join(', ')}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {t.paymentMethod}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Rp {t.total.toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No transactions found matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}