// src/pages/Dashboard/index.tsx
import { TrendingUp, TrendingDown, Package, DollarSign, Users, ShoppingCart, Clock, BarChart3, AlertCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import StatCard from '../../components/dashboard/StatCard';
import TopProducts from '../../components/dashboard/TopProducts';
import LowStockAlert from '../../components/dashboard/LowStockAlert';
import ProfitChart from '../../components/dashboard/ProfitChart';

export default function Dashboard() {
  const { products, transactions, customers } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Hitung metrics
  const today = new Date().toDateString();
  const todayTransactions = transactions.filter(t => 
    new Date(t.date).toDateString() === today
  );
  
  // Data untuk 7 hari terakhir
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toDateString();
  });

  const dailyRevenue: Record<string, number> = {};
  const dailyTransactions: Record<string, number> = {};
  
  transactions.forEach(t => {
    const date = new Date(t.date).toDateString();
    dailyRevenue[date] = (dailyRevenue[date] || 0) + t.total;
    dailyTransactions[date] = (dailyTransactions[date] || 0) + 1;
  });

  // Revenue metrics
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  const yesterdayRevenue = dailyRevenue[last7Days[1]] || 0;
  const revenueChange = yesterdayRevenue > 0 
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
    : 0;
  
  // Transaction metrics
  const todayTransactionCount = todayTransactions.length;
  const yesterdayTransactionCount = dailyTransactions[last7Days[1]] || 0;
  const transactionChange = yesterdayTransactionCount > 0
    ? ((todayTransactionCount - yesterdayTransactionCount) / yesterdayTransactionCount) * 100
    : 0;

  // Profit metrics
  const todayProfit = todayTransactions.reduce((sum, t) => sum + t.profit, 0);
  const avgTicket = todayTransactions.length > 0 
    ? todayRevenue / todayTransactions.length 
    : 0;

  // Customer metrics
  const newCustomers = customers.filter(c => {
    const joinDate = new Date(c.joinDate).toDateString();
    return joinDate === today;
  }).length;

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header dengan gradient */}
      <div className={`rounded-2xl p-6 ${isDark 
        ? 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700' 
        : 'bg-gradient-to-r from-white to-gray-50 border border-gray-100'
      } shadow-sm`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Business <span className="text-gray-900 dark:text-white">Dashboard</span>
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {new Date().toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${isDark 
              ? 'bg-gray-700 text-amber-400' 
              : 'bg-amber-100 text-amber-700'
            }`}>
              <Clock className="inline w-3 h-3 mr-1" />
              Live Data
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${isDark 
              ? 'bg-gray-700 text-green-400' 
              : 'bg-green-100 text-green-700'
            }`}>
              {transactions.length} Total Orders
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid dengan animasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Revenue"
          value={`Rp ${todayRevenue.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6" />}
          trend={revenueChange >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(revenueChange).toFixed(1)}%`}
          subtitle="vs yesterday"
          gradient="from-green-500 to-emerald-500"
          delay="100"
        />
        
        <StatCard
          title="Transactions"
          value={todayTransactionCount}
          icon={<ShoppingCart className="w-6 h-6" />}
          trend={transactionChange >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(transactionChange).toFixed(1)}%`}
          subtitle="completed today"
          gradient="from-blue-500 to-cyan-500"
          delay="200"
        />
        
        <StatCard
          title="New Customers"
          value={newCustomers}
          icon={<Users className="w-6 h-6" />}
          trend={newCustomers > 0 ? "up" : "stable"}
          trendValue="Today"
          subtitle="joined today"
          gradient="from-purple-500 to-violet-500"
          delay="300"
        />
        
        <StatCard
          title="Avg Ticket"
          value={`Rp ${avgTicket.toLocaleString()}`}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={avgTicket > 30000 ? "up" : "stable"}
          trendValue=""
          subtitle="per transaction"
          gradient="from-amber-500 to-orange-500"
          delay="400"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profit Chart */}
          <ProfitChart transactions={transactions} />
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border ${isDark 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Stock Alerts
                </h4>
                <AlertCircle className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {lowStockProducts.length}
                </p>
                <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  items need attention
                </p>
              </div>
            </div>
            
            <div className={`p-5 rounded-2xl border ${isDark 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Out of Stock
                </h4>
                <Package className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {outOfStockProducts.length}
                </p>
                <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  items unavailable
                </p>
              </div>
            </div>
            
            <div className={`p-5 rounded-2xl border ${isDark 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white border-gray-100 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Margin Rate
                </h4>
                <BarChart3 className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todayRevenue > 0 ? ((todayProfit / todayRevenue) * 100).toFixed(1) : 0}%
                </p>
                <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  profit margin
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <LowStockAlert products={lowStockProducts} />
          
          {/* Top Products */}
          <TopProducts transactions={todayTransactions} products={products} />
        </div>
      </div>

      {/* Inventory Summary */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6`}>
        <div className={`p-5 rounded-2xl border ${isDark 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Total Products</h3>
            <Package className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{products.length}</p>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Across {new Set(products.map(p => p.category)).size} categories
          </p>
        </div>

        <div className={`p-5 rounded-2xl border ${isDark 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Stock Value</h3>
            <DollarSign className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">
            Rp {products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}
          </p>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Total inventory value
          </p>
        </div>

        <div className={`p-5 rounded-2xl border ${isDark 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Success Rate</h3>
            <TrendingUp className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">
            {todayTransactions.length > 0 ? '95.2' : '0'}%
          </p>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Transaction completion
          </p>
        </div>
      </div>
    </div>
  );
}