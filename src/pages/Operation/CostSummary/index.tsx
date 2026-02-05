import React, { useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { useTheme } from '../../../contexts/ThemeContext'; // Import context tema
import { getBusinessHealth } from '../../../utils/analytics/inventoryAnalytics';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  PieChart,
  AlertTriangle
} from 'lucide-react';

export default function CostSummary() {
  const { transactions, wasteLogs } = useApp();
  const { theme } = useTheme(); // Ambil tema
  const isDark = theme === 'dark';

  // Kalkulasi Finansial Menyeluruh
  const summary = useMemo(() => {
    const revenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const cogs = transactions.reduce((sum, t) => {
      const transactionCost = t.items.reduce((iSum, item) => iSum + (item.cost * item.quantity), 0);
      return sum + transactionCost;
    }, 0);
    const wasteLoss = wasteLogs.reduce((sum, w) => sum + w.costLoss, 0);
    const grossProfit = revenue - cogs;
    const netOperationalProfit = grossProfit - wasteLoss;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netOperationalProfit / revenue) * 100 : 0;
    const health = getBusinessHealth(transactions, wasteLoss);

    return {
      revenue,
      cogs,
      wasteLoss,
      grossProfit,
      netOperationalProfit,
      grossMargin,
      netMargin,
      health
    };
  }, [transactions, wasteLogs]);

  return (
    <div className="space-y-6 pb-20">
      <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
        Financial & Cost Summary
      </h1>

      {/* Health Score Card */}
      <div className={`${
        summary.health.healthStatus === 'excellent' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
        summary.health.healthStatus === 'good' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
        summary.health.healthStatus === 'fair' ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
        'bg-gradient-to-r from-red-500 to-rose-600'
      } rounded-2xl p-6 text-white shadow-lg`}>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 opacity-90 mb-2">
              <Activity className="w-5 h-5" />
              <span className="font-medium">Business Health Score</span>
            </div>
            <div className="text-4xl font-bold">{summary.health.healthScore}/100</div>
            <div className="mt-2 text-sm opacity-90 capitalize px-2 py-1 bg-white/20 rounded-lg inline-block">
              Status: {summary.health.healthStatus}
            </div>
          </div>
          <div className="text-right opacity-90 text-sm space-y-1">
             <div>Target Margin: 50%</div>
             <div className="font-bold">Actual: {summary.netMargin.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Revenue */}
        <div className={`p-5 rounded-xl border shadow-sm ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${
              isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <DollarSign className="w-6 h-6" />
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-400 bg-gray-50'
            }`}>All Time</span>
          </div>
          <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Total Revenue
          </div>
          <div className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Rp {summary.revenue.toLocaleString()}
          </div>
        </div>

        {/* Real Profit */}
        <div className={`p-5 rounded-xl border shadow-sm ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${
              summary.netOperationalProfit >= 0 
                ? isDark 
                  ? 'bg-green-900/30 text-green-400' 
                  : 'bg-green-50 text-green-600'
                : isDark 
                  ? 'bg-red-900/30 text-red-400' 
                  : 'bg-red-50 text-red-600'
            }`}>
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Real Profit (After Waste)
          </div>
          <div className={`text-2xl font-bold mt-1 ${
            summary.netOperationalProfit >= 0 
              ? isDark ? 'text-green-400' : 'text-green-700' 
              : 'text-red-600'
          }`}>
            Rp {summary.netOperationalProfit.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Cost Breakdown Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 rounded-xl shadow-sm border p-6 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <h3 className={`font-bold mb-6 flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}>
            <PieChart className="w-5 h-5 text-indigo-500" />
            Breakdown Biaya
          </h3>
          
          <div className="space-y-6">
            {/* COGS Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                  Cost of Goods Sold (Bahan Baku)
                </span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Rp {summary.cogs.toLocaleString()}
                </span>
              </div>
              <div className={`w-full rounded-full h-3 overflow-hidden ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${summary.revenue > 0 ? (summary.cogs / summary.revenue) * 100 : 0}%` }}
                />
              </div>
              <div className={`text-right text-xs mt-1 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {summary.revenue > 0 ? ((summary.cogs / summary.revenue) * 100).toFixed(1) : 0}% dari Revenue
              </div>
            </div>

            {/* Waste Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className={`flex items-center gap-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                   Waste Loss (Terbuang)
                   <AlertTriangle className="w-3 h-3 text-red-500" />
                </span>
                <span className="font-medium text-red-500">
                  Rp {summary.wasteLoss.toLocaleString()}
                </span>
              </div>
              <div className={`w-full rounded-full h-3 overflow-hidden ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div 
                  className="bg-red-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${summary.revenue > 0 ? (summary.wasteLoss / summary.revenue) * 100 : 0}%` }}
                />
              </div>
              <div className={`text-right text-xs mt-1 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {summary.revenue > 0 ? ((summary.wasteLoss / summary.revenue) * 100).toFixed(1) : 0}% dari Revenue
              </div>
            </div>
            
            <div className={`pt-4 border-t ${
              isDark ? 'border-gray-700' : 'border-gray-100'
            }`}>
               <div className={`flex justify-between items-center p-3 rounded-lg border ${
                 isDark 
                   ? 'bg-green-900/20 border-green-800' 
                   : 'bg-green-50 border-green-100'
               }`}>
                 <span className={isDark ? 'text-green-300' : 'text-green-800'}>
                   Sisa untuk Profit
                 </span>
                 <span className={`font-bold ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                   {summary.netMargin.toFixed(1)}%
                 </span>
               </div>
            </div>
          </div>
        </div>

        {/* Insight Card */}
        <div className={`rounded-xl p-6 border ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-gray-50 border-gray-100'
        }`}>
          <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Financial Insight
          </h4>
          <p className={`text-sm leading-relaxed mb-4 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {summary.netMargin < 20 
              ? "Margin profit Anda tipis. Periksa 'Inventory Usage' untuk melihat apakah ada pemborosan bahan baku atau 'Waste Log' untuk mengurangi barang terbuang."
              : "Performa finansial sehat. Pertahankan rasio waste di bawah 5% untuk memaksimalkan profit."}
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Gross Profit</span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Rp {summary.grossProfit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>- Waste</span>
              <span className="font-medium">Rp {summary.wasteLoss.toLocaleString()}</span>
            </div>
            <div className={`border-t my-2 pt-2 flex justify-between font-bold ${
              isDark ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-900'
            }`}>
              <span>Net Profit</span>
              <span>Rp {summary.netOperationalProfit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}