// src/pages/BusinessInsights/index.tsx
import { useState } from 'react';
import { BarChart3, TrendingUp, Brain, AlertTriangle, DollarSign, Users } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import WeeklySummary from '../../components/insights/WeeklySummary';
import TrendsAnalysis from '../../components/insights/TrendsAnalysis';
import AIAssistant from '../../components/insights/AIAssistant';
import InsightCard from '../../components/insights/InsightCard';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

type InsightTab = 'weekly' | 'trends' | 'ai';

export default function BusinessInsights() {
  const [activeTab, setActiveTab] = useState<InsightTab>('weekly');
  const { transactions, wasteLogs, products } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { format } = useCurrencyFormatter();

  // Empty state
  if (transactions.length === 0) {
    return (
      <div className="text-center py-20 animate-in fade-in duration-300">
        <BarChart3 className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-stone-700' : 'text-stone-300'}`} />
        <h3 className={`font-black text-lg ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Belum ada data transaksi</h3>
        <p className={`text-sm mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
          Mulai transaksi untuk melihat insight bisnis
        </p>
      </div>
    );
  }

  // Hitung insights
  const last7Days = transactions.filter(t => {
    const date = new Date(t.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  });

  const weeklyRevenue = last7Days.reduce((sum, t) => sum + t.total, 0);
  const weeklyProfit = last7Days.reduce((sum, t) => sum + t.profit, 0);
  const avgDailyProfit = weeklyProfit / 7;
  const wasteLoss = wasteLogs.reduce((sum, w) => sum + w.costLoss, 0);

  // Top product
  const productSales: Record<string, number> = {};
  last7Days.forEach(t => {
    t.items.forEach(item => {
      productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
    });
  });

  const topProductId = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topProduct = products.find(p => p.id === topProductId);

  const tabs = [
    { id: 'weekly' as InsightTab, label: 'Weekly Summary', icon: BarChart3 },
    { id: 'trends' as InsightTab, label: 'Trends Analysis', icon: TrendingUp },
    { id: 'ai' as InsightTab, label: 'Ask AI', icon: Brain },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className={`rounded-3xl border p-6 ${isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-gray-100 shadow-sm'}`}>
        <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Business <span className="text-amber-500">Insights</span>
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          Data mentah menjadi keputusan bisnis
        </p>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InsightCard
          title="Weekly Revenue"
          value={format(weeklyRevenue)}
          icon={<DollarSign className="w-6 h-6" />}
          description="Last 7 days"
          trend={weeklyRevenue > 7000000 ? "up" : "down"}
        />
        
        <InsightCard
          title="Daily Profit Avg"
          value={format(Math.round(avgDailyProfit))}
          icon={<TrendingUp className="w-6 h-6" />}
          description="Per day average"
          trend={avgDailyProfit > 500000 ? "up" : "down"}
        />
        
        <InsightCard
          title="Waste Loss"
          value={format(wasteLoss)}
          icon={<AlertTriangle className="w-6 h-6" />}
          description="Cost leakage"
          trend={wasteLoss > 200000 ? "danger" : "safe"}
        />
        
        <InsightCard
          title="Top Product"
          value={topProduct?.name || "N/A"}
          icon={<Users className="w-6 h-6" />}
          description="Most sold this week"
          trend="neutral"
        />
      </div>

      {/* Tabs Navigation */}
      <div className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className={`flex border-b ${isDark ? 'border-stone-800' : 'border-gray-100'}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 py-4 px-6 text-sm font-bold transition-colors ${
                activeTab === tab.id
                  ? isDark ? 'text-amber-400' : 'text-amber-600'
                  : isDark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-amber-400' : 'bg-amber-600'}`} />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 min-h-[400px]">
          {activeTab === 'weekly' && <WeeklySummary transactions={transactions} />}
          {activeTab === 'trends' && <TrendsAnalysis transactions={transactions} products={products} />}
          {activeTab === 'ai' && <AIAssistant transactions={transactions} wasteLogs={wasteLogs} products={products} />}
        </div>
      </div>
    </div>
  );
}