import { useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext'; 
import { useTheme } from '../../../contexts/ThemeContext';
import { analyzeCustomerBehavior } from '../../../utils/analytics/customerAnalytics';
import CustomerStats from '../../../components/customers/CustomerStats';
import { 
  Crown, 
  Users, 
  Repeat, 
  UserMinus, 
  TrendingUp, 
  Award 
} from 'lucide-react';

export default function LoyaltyInsight() {
  // 1. Ambil 'customers' juga dari useApp agar bisa cari nama
  const { transactions, customers } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Analisis Data
  const analytics = useMemo(() => {
    return analyzeCustomerBehavior(transactions);
  }, [transactions]);

  // Identifikasi Churn Risk
  const churnRiskList = useMemo(() => {
    return analytics.frequentVisitors.filter(c => {
      const lastVisit = new Date(c.lastVisit);
      const diffTime = Math.abs(new Date().getTime() - lastVisit.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 45; 
    });
  }, [analytics]);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Loyalty Insights</h1>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Analisis mendalam tentang perilaku dan retensi pelanggan Anda
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CustomerStats
          title="Retention Rate"
          value={`${analytics.customerRetentionRate}%`}
          icon={<Repeat className="w-6 h-6" />}
          description="Returning customers"
          trend={analytics.customerRetentionRate > 20 ? 'up' : 'down'}
        />
        <CustomerStats
          title="Avg. Visit Value"
          value={`Rp ${analytics.avgSpending.toLocaleString()}`}
          icon={<TrendingUp className="w-6 h-6" />}
          description="Revenue per customer"
          trend="stable"
        />
        <CustomerStats
          title="Avg. Visits"
          value={analytics.avgVisits}
          icon={<Users className="w-6 h-6" />}
          description="Visits per customer"
          trend="stable"
        />
        <CustomerStats
          title="New Members"
          value={analytics.newCustomersThisMonth}
          icon={<Award className="w-6 h-6" />}
          description="Joined this month"
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spenders (Gold Customers) */}
        <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <Crown size={24} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Top Spenders</h3>
              <p className="text-xs text-gray-500">Pelanggan dengan nilai belanja tertinggi</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {analytics.topSpenders.map((stats, index) => {
              // 2. Cari data profil pelanggan berdasarkan ID dari hasil analitik
              const profile = customers.find(c => c.id === stats.customerId);
              const displayName = profile ? profile.name : `Unknown (ID: ${stats.customerId.slice(0, 4)})`;

              return (
                <div key={stats.customerId} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-transparent to-transparent hover:from-amber-500/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-xs ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                      index === 1 ? 'bg-gray-300 text-gray-800' :
                      index === 2 ? 'bg-orange-300 text-orange-900' :
                      isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      {/* 3. Tampilkan Nama di sini */}
                      <div className={`font-bold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {displayName}
                      </div> 
                      <div className="text-xs text-gray-500">{stats.visitCount} visits</div>
                    </div>
                  </div>
                  <div className="font-bold text-amber-500">
                    Rp {stats.totalSpent.toLocaleString()}
                  </div>
                </div>
              );
            })}
            
            {analytics.topSpenders.length === 0 && (
              <p className="text-center text-gray-500 py-4">Belum ada data transaksi cukup.</p>
            )}
          </div>
        </div>

        {/* Churn Risk / Inactive */}
        <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <UserMinus size={24} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Risk of Churn</h3>
              <p className="text-xs text-gray-500">Member yang tidak berkunjung &gt; 45 hari</p>
            </div>
          </div>

          <div className="space-y-3">
             {churnRiskList.length > 0 ? (
               churnRiskList.map((stats) => {
                 // Cari nama juga untuk bagian Risk of Churn
                 const profile = customers.find(c => c.id === stats.customerId);
                 const displayName = profile ? profile.name : stats.customerId.substring(0, 8);

                 return (
                   <div key={stats.customerId} className={`p-3 rounded-xl border flex justify-between items-center ${isDark ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
                     <div>
                       <div className={`font-medium text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                         {displayName}
                       </div>
                       <div className="text-xs text-red-500">
                         Last visit: {new Date(stats.lastVisit).toLocaleDateString()}
                       </div>
                     </div>
                     <button className="text-xs bg-white text-red-600 px-3 py-1.5 rounded-lg border border-red-200 font-bold shadow-sm hover:bg-red-50">
                       Contact
                     </button>
                   </div>
                 );
               })
             ) : (
               <div className="flex flex-col items-center justify-center py-8 text-center">
                 <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                   <Award size={24} />
                 </div>
                 <p className="font-medium text-green-600">Great Job!</p>
                 <p className="text-xs text-gray-500 mt-1">Tidak ada pelanggan berisiko churn saat ini.</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}