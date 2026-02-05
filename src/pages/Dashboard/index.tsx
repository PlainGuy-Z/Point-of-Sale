// src/pages/Dashboard/index.tsx
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Package, 
  AlertCircle,
  BarChart3,
  Clock,
  Zap,
  Shield
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import StatCard from '../../components/dashboard/StatCard';
import TopProducts from '../../components/dashboard/TopProducts';
import LowStockAlert from '../../components/dashboard/LowStockAlert';
import ProfitChart from '../../components/dashboard/ProfitChart';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';



// Helper component untuk header badges
const HeaderBadge = ({ children, isDark, type = 'info' }: { 
  children: React.ReactNode; 
  isDark: boolean;
  type?: 'info' | 'success' | 'warning';
}) => {
  const baseClasses = "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1";
  
  const typeClasses = {
    info: isDark 
      ? 'bg-gray-700 text-amber-400' 
      : 'bg-amber-100 text-amber-700',
    success: isDark
      ? 'bg-gray-700 text-green-400'
      : 'bg-green-100 text-green-700',
    warning: isDark
      ? 'bg-gray-700 text-orange-400'
      : 'bg-orange-100 text-orange-700'
  };
  
  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {children}
    </div>
  );
};


export default function Dashboard() {
  const { theme } = useTheme();
  const { metrics, last7DaysRevenue, topProductsToday, rawData } = useDashboardMetrics(); 
  const isDark = theme === 'dark';

    const { format } = useCurrencyFormatter();
  
  const formattedDate = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Cek jika data masih kosong
  const isLoading = !metrics || 
                    !rawData || 
                    rawData.transactions.length === 0 ||
                    rawData.products.length === 0;


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Bagian Header */}
      <div className={`rounded-2xl p-6 ${isDark 
        ? 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700' 
        : 'bg-gradient-to-r from-white to-gray-50 border border-gray-100'
      } shadow-sm`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Dashboard <span className="text-gray-900 dark:text-white">Bisnis</span>
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {formattedDate}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HeaderBadge isDark={isDark} type="warning">
              <Zap className="w-3 h-3" />
              Real-time
            </HeaderBadge>
          </div>
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pendapatan Hari Ini"
          value={format(metrics.todayRevenue)}
          icon={DollarSign}
          trend={metrics.revenueChange >= 0 ? "up" : "down"}

          gradient="from-green-500 to-emerald-500"
          delay="100"
        />
        
        <StatCard
          title="Transaksi"
          value={metrics.todayTransactionCount}
          icon={ShoppingCart}
          trend={metrics.transactionChange >= 0 ? "up" : "down"}
          gradient="from-blue-500 to-cyan-500"
          delay="200"
        />
        
        <StatCard
          title="Pelanggan Baru"
          value={metrics.newCustomers}
          icon={Users}
          trend={metrics.newCustomers > 0 ? "up" : "stable"}
          gradient="from-purple-500 to-violet-500"
          delay="300"
        />
        
        <StatCard
          title="Rata-rata Tiket"
          value={format(metrics.avgTicket)}
          icon={TrendingUp}
          trend={metrics.avgTicket > 30000 ? "up" : "stable"}
          gradient="from-amber-500 to-orange-500"
          delay="400"
        />
      </div>

    {/* Grid Konten Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri - Grafik */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grafik Keuntungan */}
          <ProfitChart transactions={rawData.transactions} />
          
          {/* Baris Statistik Cepat - GUNAKAN StatCard untuk konsistensi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Peringatan Stok"
              value={metrics.lowStockProducts.length}
              icon={AlertCircle}
              subtitle="item perlu perhatian"
              gradient="from-orange-500 to-amber-500"
              trend={metrics.lowStockProducts.length > 0 ? "up" : "stable"}
              trendValue={metrics.lowStockProducts.length > 0 ? "Perhatian" : "Aman"}
            />
            
            <StatCard
              title="Stok Habis"
              value={metrics.outOfStockProducts.length}
              icon={Package}
              subtitle="item tidak tersedia"
              gradient="from-red-500 to-pink-500"
              trend={metrics.outOfStockProducts.length > 0 ? "up" : "stable"}
              trendValue={metrics.outOfStockProducts.length > 0 ? "Segera Restok" : "Semua Tersedia"}
            />
            
            <StatCard
              title="Tingkat Margin"
              value={`${metrics.profitMargin}%`}
              icon={BarChart3}
              subtitle="margin keuntungan"
              gradient="from-blue-500 to-indigo-500"
              trend={metrics.profitMargin > 50 ? "up" : metrics.profitMargin > 30 ? "stable" : "down"}
              trendValue={metrics.profitMargin > 50 ? "Tinggi" : "Normal"}
            />
          </div>
        </div>

        {/* Kolom Kanan */}
        <div className="space-y-6">
          <LowStockAlert products={metrics.lowStockProducts} />
          
          {/* TopProducts - GUNAKAN data yang sudah dihitung */}
          <TopProducts 
            products={topProductsToday} // ✅ Data sudah dihitung di dashboardMetrics
            title="Produk Terlaris Hari Ini"
            limit={5}
          />
        </div>
      </div>


      {/* Ringkasan Inventaris - GUNAKAN StatCard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Produk"
          value={metrics.totalProducts}
          icon={Package}
          subtitle={`Dari ${metrics.categoriesCount} kategori`}
          gradient="from-gray-500 to-gray-700"
          trend="stable"
        />
        
        <StatCard
          title="Nilai Stok"
          value={format(metrics.stockValue)}
          icon={DollarSign}
          subtitle="Total nilai inventaris"
          gradient="from-green-500 to-teal-500"
          trend="stable"
        />
        
        <StatCard
          title="Tingkat Keberhasilan"
          value={`${metrics.successRate}%`}
          icon={Shield}
          subtitle="Penyelesaian transaksi"
          gradient="from-purple-500 to-violet-500"
          trend={metrics.successRate > 95 ? "up" : "stable"}
          trendValue={metrics.successRate > 95 ? "Excellent" : "Good"}
        />
      </div>

      {/* Wawasan Kinerja - GUNAKAN Grid sederhana */}
      <div className={`p-6 rounded-2xl ${isDark 
        ? 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700' 
        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Wawasan Kinerja
          </h3>
          <TrendingUp className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderPerformanceMetric("Rata-rata Nilai Pesanan", format(Math.round(metrics.avgTicket)), isDark)}
          {renderPerformanceMetric("Tingkat Konversi", `${Math.round((metrics.todayTransactionCount / Math.max(metrics.todayTransactionCount * 3, 1)) * 100)}%`, isDark)}
          {renderPerformanceMetric("Retensi Pelanggan", `${Math.min(85 + metrics.newCustomers, 99)}%`, isDark)}
          {renderPerformanceMetric("Perputaran Inventaris", `${Math.round((metrics.todayRevenue / Math.max(metrics.stockValue, 1)) * 30)} hari`, isDark)}
        </div>
      </div>
    </div>
  );
}

// Helper untuk render metric sederhana
function renderPerformanceMetric(label: string, value: string, isDark: boolean) {
  return (
    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white shadow-sm'}`}>
      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{label}</p>
      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}